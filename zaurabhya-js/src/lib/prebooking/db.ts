import path from "path";
import { mkdirSync } from "fs";

/**
 * Small database layer for pre-booking orders.
 *
 * Production (Hostinger) uses MySQL through DATABASE_URL or DB_HOST/DB_USER/
 * DB_PASSWORD/DB_NAME. Local development and the test suite fall back to a
 * SQLite file using Node's built-in driver, so nothing has to be installed to
 * run the site. Every statement in store.ts is plain parameterised SQL that
 * runs unchanged on both.
 */

export type SqlValue = string | number | null;
export type DbResult = { affectedRows: number; insertId: number };

export interface Db {
  dialect: "mysql" | "sqlite";
  query<T = Record<string, unknown>>(sql: string, params?: SqlValue[]): Promise<T[]>;
  execute(sql: string, params?: SqlValue[]): Promise<DbResult>;
  /** Runs fn inside a transaction; commits when it resolves, rolls back when it throws. */
  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>;
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "No database configured. Set DATABASE_URL (or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) to a MySQL database.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

export function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const { code, errno, message } = err as { code?: string; errno?: number; message?: string };
  return (
    code === "ER_DUP_ENTRY" ||
    errno === 1062 ||
    Boolean(message && message.includes("UNIQUE constraint failed"))
  );
}

function schemaStatements(dialect: Db["dialect"]): string[] {
  const autoId =
    dialect === "mysql"
      ? "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY"
      : "INTEGER PRIMARY KEY AUTOINCREMENT";
  const tableOptions =
    dialect === "mysql" ? " ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci" : "";

  return [
    `CREATE TABLE IF NOT EXISTS prebooking_settings (
      id INT NOT NULL PRIMARY KEY,
      config_json TEXT NOT NULL,
      updated_at VARCHAR(32) NOT NULL
    )${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS prebooking_counters (
      counter_key VARCHAR(24) NOT NULL PRIMARY KEY,
      last_seq INT NOT NULL
    )${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS prebooking_orders (
      id ${autoId},
      order_number VARCHAR(32) NOT NULL,
      client_token VARCHAR(64) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      product_name VARCHAR(120) NOT NULL,
      quantity_kg INT NOT NULL,
      price_per_kg_paise INT NOT NULL,
      product_amount_paise INT NOT NULL,
      shipping_amount_paise INT NOT NULL,
      tax_amount_paise INT NOT NULL,
      discount_amount_paise INT NOT NULL,
      grand_total_paise INT NOT NULL,
      customer_name VARCHAR(100) NOT NULL,
      customer_email VARCHAR(254) NOT NULL,
      customer_phone VARCHAR(15) NOT NULL,
      address_line_1 VARCHAR(200) NOT NULL,
      address_line_2 VARCHAR(200) NULL,
      city VARCHAR(80) NOT NULL,
      district VARCHAR(80) NOT NULL,
      state VARCHAR(80) NOT NULL,
      pincode VARCHAR(6) NOT NULL,
      country VARCHAR(40) NOT NULL,
      gst_number VARCHAR(15) NULL,
      shipping_method VARCHAR(60) NOT NULL,
      payment_provider VARCHAR(20) NOT NULL,
      payment_status VARCHAR(20) NOT NULL,
      order_status VARCHAR(20) NOT NULL,
      payment_reference VARCHAR(32) NULL,
      payment_note VARCHAR(500) NULL,
      payment_submitted_at VARCHAR(32) NULL,
      admin_email_sent_at VARCHAR(32) NULL,
      customer_email_sent_at VARCHAR(32) NULL,
      created_at VARCHAR(32) NOT NULL,
      updated_at VARCHAR(32) NOT NULL,
      paid_at VARCHAR(32) NULL,
      CONSTRAINT uq_prebooking_order_number UNIQUE (order_number),
      CONSTRAINT uq_prebooking_client_token UNIQUE (client_token)
    )${tableOptions}`,
  ];
}

const INDEX_STATEMENTS = [
  "CREATE INDEX idx_prebooking_payment_status ON prebooking_orders (payment_status, created_at)",
  "CREATE INDEX idx_prebooking_payment_reference ON prebooking_orders (payment_reference)",
];

export async function ensureSchema(db: Db) {
  for (const statement of schemaStatements(db.dialect)) {
    await db.execute(statement);
  }
  for (const statement of INDEX_STATEMENTS) {
    // MySQL has no CREATE INDEX IF NOT EXISTS, so an "already exists" error is expected on restart.
    await db.execute(statement).catch((err: { code?: string; message?: string }) => {
      const exists = err.code === "ER_DUP_KEYNAME" || err.message?.includes("already exists");
      if (!exists) throw err;
    });
  }
}

async function createMysqlDb(): Promise<Db> {
  const mysql = await import("mysql2/promise");
  const shared = {
    connectionLimit: 5,
    charset: "utf8mb4",
    waitForConnections: true,
    enableKeepAlive: true,
  };
  const pool = process.env.DATABASE_URL
    ? mysql.createPool({ uri: process.env.DATABASE_URL, ...shared })
    : mysql.createPool({
        // 127.0.0.1 rather than localhost: on Hostinger localhost can resolve to IPv6.
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ...shared,
      });

  type Runner = Pick<typeof pool, "query">;

  function wrap(runner: Runner): Omit<Db, "transaction"> {
    return {
      dialect: "mysql",
      async query<T>(sql: string, params: SqlValue[] = []) {
        const [rows] = await runner.query(sql, params);
        return rows as T[];
      },
      async execute(sql: string, params: SqlValue[] = []) {
        const [result] = await runner.query(sql, params);
        const header = result as { affectedRows?: number; insertId?: number };
        return {
          affectedRows: header.affectedRows ?? 0,
          insertId: Number(header.insertId ?? 0),
        };
      },
    };
  }

  return {
    ...wrap(pool),
    async transaction<T>(fn: (tx: Db) => Promise<T>) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const tx: Db = { ...wrap(connection), transaction: (inner) => inner(tx) };
        const result = await fn(tx);
        await connection.commit();
        return result;
      } catch (err) {
        await connection.rollback().catch(() => {});
        throw err;
      } finally {
        connection.release();
      }
    },
  };
}

export async function createSqliteDb(file: string): Promise<Db> {
  const { DatabaseSync } = await import("node:sqlite");
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const database = new DatabaseSync(file);
  database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");

  const raw: Omit<Db, "transaction"> = {
    dialect: "sqlite",
    async query<T>(sql: string, params: SqlValue[] = []) {
      return database.prepare(sql).all(...params) as T[];
    },
    async execute(sql: string, params: SqlValue[] = []) {
      const result = database.prepare(sql).run(...params);
      return {
        affectedRows: Number(result.changes),
        insertId: Number(result.lastInsertRowid),
      };
    },
  };

  // One connection is shared, so a transaction must hold everything else back
  // until it finishes, otherwise other requests' statements would join it.
  let queue: Promise<unknown> = Promise.resolve();
  function exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.catch(() => {});
    return run;
  }

  return {
    dialect: "sqlite",
    query: (sql, params) => exclusive(() => raw.query(sql, params)),
    execute: (sql, params) => exclusive(() => raw.execute(sql, params)),
    transaction: (fn) =>
      exclusive(async () => {
        database.exec("BEGIN IMMEDIATE");
        try {
          const tx: Db = { ...raw, transaction: (inner) => inner(tx) };
          const result = await fn(tx);
          database.exec("COMMIT");
          return result;
        } catch (err) {
          database.exec("ROLLBACK");
          throw err;
        }
      }),
  };
}

export function isMysqlConfigured() {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME),
  );
}

async function connect(): Promise<Db> {
  let db: Db;
  if (isMysqlConfigured()) {
    db = await createMysqlDb();
  } else if (process.env.PREBOOKING_SQLITE_PATH || process.env.NODE_ENV !== "production") {
    // A file inside the app folder does not survive a Hostinger redeploy, so in
    // production SQLite is only used when a path is chosen explicitly.
    db = await createSqliteDb(
      process.env.PREBOOKING_SQLITE_PATH || path.join(process.cwd(), "data", "prebooking.sqlite"),
    );
  } else {
    throw new DatabaseNotConfiguredError();
  }
  await ensureSchema(db);
  return db;
}

const globalForDb = globalThis as typeof globalThis & { __prebookingDb?: Promise<Db> };

/** Shared connection, created (and its tables ensured) on first use. */
export function getDb(): Promise<Db> {
  if (!globalForDb.__prebookingDb) {
    globalForDb.__prebookingDb = connect().catch((err) => {
      globalForDb.__prebookingDb = undefined;
      throw err;
    });
  }
  return globalForDb.__prebookingDb;
}

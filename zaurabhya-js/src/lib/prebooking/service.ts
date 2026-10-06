import { createHash, timingSafeEqual } from "crypto";
import type { z } from "zod";
import {
  DEFAULT_SETTINGS,
  FULFILMENT_STATUSES,
  PAYMENT_PROVIDER,
  PENDING_ORDER_TTL_HOURS,
  PREBOOKING_PRODUCT_IDS,
  PREBOOKING_PRODUCTS,
  type OrderStatus,
  type PaymentStatus,
  type PrebookingProductId,
  type PrebookingSettings,
} from "@/lib/prebooking/config";
import { isUniqueViolation, type Db, type SqlValue } from "@/lib/prebooking/db";
import {
  buildAdminPaidEmail,
  buildAdminVerifyEmail,
  buildCustomerConfirmationEmail,
  buildCustomerPaymentNotFoundEmail,
  type EmailMessage,
} from "@/lib/prebooking/emails";
import { computeQuote, formatInr, type Quote } from "@/lib/prebooking/pricing";
import {
  clientTokenSchema,
  ORDER_NUMBER_PATTERN,
  prebookingFormSchema,
  productIdSchema,
  quantitySchema,
  settingsSchema,
  upiReferenceSchema,
} from "@/lib/prebooking/validation";

export type Order = {
  id: number;
  orderNumber: string;
  clientToken: string;
  productId: string;
  productName: string;
  quantityKg: number;
  pricePerKgPaise: number;
  productAmountPaise: number;
  shippingAmountPaise: number;
  taxAmountPaise: number;
  discountAmountPaise: number;
  grandTotalPaise: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
  gstNumber: string | null;
  shippingMethod: string;
  paymentProvider: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentReference: string | null;
  paymentNote: string | null;
  paymentSubmittedAt: string | null;
  adminEmailSentAt: string | null;
  customerEmailSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
};

/** What the customer-facing confirmation page may show: no contact or address details. */
export type PublicOrder = Pick<
  Order,
  | "orderNumber"
  | "productId"
  | "productName"
  | "quantityKg"
  | "pricePerKgPaise"
  | "productAmountPaise"
  | "shippingAmountPaise"
  | "taxAmountPaise"
  | "grandTotalPaise"
  | "shippingMethod"
  | "paymentStatus"
  | "orderStatus"
> & { confirmationEmailSent: boolean };

export function toPublicOrder(order: Order): PublicOrder {
  return {
    orderNumber: order.orderNumber,
    productId: order.productId,
    productName: order.productName,
    quantityKg: order.quantityKg,
    pricePerKgPaise: order.pricePerKgPaise,
    productAmountPaise: order.productAmountPaise,
    shippingAmountPaise: order.shippingAmountPaise,
    taxAmountPaise: order.taxAmountPaise,
    grandTotalPaise: order.grandTotalPaise,
    shippingMethod: order.shippingMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    confirmationEmailSent: Boolean(order.customerEmailSentAt),
  };
}

export type PrebookingErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "AMOUNT_MISMATCH";

const ERROR_STATUS: Record<PrebookingErrorCode, number> = {
  VALIDATION: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  CONFLICT: 409,
  AMOUNT_MISMATCH: 409,
};

/** An expected failure with a message that is safe to show to the person using the site. */
export class PrebookingError extends Error {
  readonly status: number;
  constructor(
    readonly code: PrebookingErrorCode,
    message: string,
    readonly issues?: z.core.$ZodIssue[],
  ) {
    super(message);
    this.name = "PrebookingError";
    this.status = ERROR_STATUS[code];
  }
}

export type Mailer = { send(message: EmailMessage): Promise<void> };

export type ServiceDeps = {
  getDb: () => Promise<Db>;
  mailer: Mailer;
  adminEmail: string;
  now?: () => Date;
};

type OrderRow = Record<string, string | number | null>;

function mapOrder(row: OrderRow): Order {
  const text = (key: string) => (row[key] === null ? null : String(row[key]));
  const num = (key: string) => Number(row[key]);
  return {
    id: num("id"),
    orderNumber: String(row.order_number),
    clientToken: String(row.client_token),
    productId: String(row.product_id),
    productName: String(row.product_name),
    quantityKg: num("quantity_kg"),
    pricePerKgPaise: num("price_per_kg_paise"),
    productAmountPaise: num("product_amount_paise"),
    shippingAmountPaise: num("shipping_amount_paise"),
    taxAmountPaise: num("tax_amount_paise"),
    discountAmountPaise: num("discount_amount_paise"),
    grandTotalPaise: num("grand_total_paise"),
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    customerPhone: String(row.customer_phone),
    addressLine1: String(row.address_line_1),
    addressLine2: text("address_line_2"),
    city: String(row.city),
    district: String(row.district),
    state: String(row.state),
    pincode: String(row.pincode),
    country: String(row.country),
    gstNumber: text("gst_number"),
    shippingMethod: String(row.shipping_method),
    paymentProvider: String(row.payment_provider),
    paymentStatus: String(row.payment_status) as PaymentStatus,
    orderStatus: String(row.order_status) as OrderStatus,
    paymentReference: text("payment_reference"),
    paymentNote: text("payment_note"),
    paymentSubmittedAt: text("payment_submitted_at"),
    adminEmailSentAt: text("admin_email_sent_at"),
    customerEmailSentAt: text("customer_email_sent_at"),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    paidAt: text("paid_at"),
  };
}

/** Constant-time comparison of the secret that ties an order to the browser that created it. */
export function tokensMatch(a: string, b: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

/** Calendar day in India, so order numbers roll over at midnight IST rather than UTC. */
function istDayKey(date: Date) {
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, "");
}

function mergeSettings(stored: unknown): PrebookingSettings {
  const partial = (stored ?? {}) as Partial<PrebookingSettings>;
  const merged = {
    ...DEFAULT_SETTINGS,
    ...partial,
    // Per product, so a product added later starts from its defaults.
    products: Object.fromEntries(
      PREBOOKING_PRODUCT_IDS.map((id) => [
        id,
        { ...DEFAULT_SETTINGS.products[id], ...partial.products?.[id] },
      ]),
    ),
    shipping: {
      ...DEFAULT_SETTINGS.shipping,
      ...partial.shipping,
      zoneRates: { ...DEFAULT_SETTINGS.shipping.zoneRates, ...partial.shipping?.zoneRates },
    },
    upi: { ...DEFAULT_SETTINGS.upi, ...partial.upi },
  };
  const parsed = settingsSchema.safeParse(merged);
  if (!parsed.success) {
    console.error("Stored pre-booking settings are invalid; using defaults:", parsed.error.issues);
    return DEFAULT_SETTINGS;
  }
  return parsed.data;
}

/** Statuses in which a payment reference is tied to real (or possibly real) money. */
const REFERENCE_IN_USE: PaymentStatus[] = ["PAYMENT_INITIATED", "PAID", "REFUND_PENDING", "REFUNDED"];
const CAN_BE_MARKED_PAID: PaymentStatus[] = ["PENDING", "PAYMENT_INITIATED", "FAILED", "EXPIRED"];

const placeholders = (values: unknown[]) => values.map(() => "?").join(", ");

export function createPrebookingService(deps: ServiceDeps) {
  const now = () => (deps.now ? deps.now() : new Date()).toISOString();

  async function getSettings(): Promise<PrebookingSettings> {
    const db = await deps.getDb();
    const rows = await db.query<{ config_json: string }>(
      "SELECT config_json FROM prebooking_settings WHERE id = 1",
    );
    if (rows.length === 0) return DEFAULT_SETTINGS;
    try {
      return mergeSettings(JSON.parse(rows[0].config_json));
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async function saveSettings(input: unknown): Promise<PrebookingSettings> {
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) {
      throw new PrebookingError("VALIDATION", "Invalid settings", parsed.error.issues);
    }
    const db = await deps.getDb();
    const json = JSON.stringify(parsed.data);
    const updated = await db.execute(
      "UPDATE prebooking_settings SET config_json = ?, updated_at = ? WHERE id = 1",
      [json, now()],
    );
    if (updated.affectedRows === 0) {
      await db.execute(
        "INSERT INTO prebooking_settings (id, config_json, updated_at) VALUES (1, ?, ?)",
        [json, now()],
      );
    }
    return parsed.data;
  }

  function parseProductId(value: unknown): PrebookingProductId {
    const parsed = productIdSchema.safeParse(value);
    if (!parsed.success) {
      throw new PrebookingError("VALIDATION", parsed.error.issues[0].message, parsed.error.issues);
    }
    return parsed.data;
  }

  async function quote(input: {
    productId: unknown;
    quantityKg: unknown;
    state: unknown;
  }): Promise<Quote> {
    const productId = parseProductId(input.productId);
    const settings = await getSettings();
    const limits = settings.products[productId];
    const schema = prebookingFormSchema(limits).pick({ state: true }).extend({
      quantityKg: quantitySchema(limits),
    });
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new PrebookingError("VALIDATION", "Invalid quantity or state", parsed.error.issues);
    }
    return computeQuote(settings, productId, parsed.data.quantityKg, parsed.data.state);
  }

  /** ZR-DR-YYYYMMDD-0001: each product has its own sequence, restarting every day. */
  async function nextOrderNumber(tx: Db, prefix: string): Promise<string> {
    const key = `${prefix}-${istDayKey(deps.now ? deps.now() : new Date())}`;
    const bump = () =>
      tx.execute(
        "UPDATE prebooking_counters SET last_seq = last_seq + 1 WHERE counter_key = ?",
        [key],
      );

    if ((await bump()).affectedRows === 0) {
      try {
        await tx.execute(
          "INSERT INTO prebooking_counters (counter_key, last_seq) VALUES (?, 1)",
          [key],
        );
      } catch (err) {
        // Another request created today's counter first; take the next number from it.
        if (!isUniqueViolation(err)) throw err;
        await bump();
      }
    }
    const [row] = await tx.query<{ last_seq: number }>(
      "SELECT last_seq FROM prebooking_counters WHERE counter_key = ?",
      [key],
    );
    return `${key}-${String(row.last_seq).padStart(4, "0")}`;
  }

  async function findOrder(db: Db, column: "order_number" | "client_token" | "id", value: SqlValue) {
    const rows = await db.query<OrderRow>(
      `SELECT * FROM prebooking_orders WHERE ${column} = ?`,
      [value],
    );
    return rows.length ? mapOrder(rows[0]) : null;
  }

  async function expireStaleOrders(db: Db) {
    const cutoff = new Date(
      (deps.now ? deps.now() : new Date()).getTime() - PENDING_ORDER_TTL_HOURS * 60 * 60 * 1000,
    ).toISOString();
    await db.execute(
      "UPDATE prebooking_orders SET payment_status = 'EXPIRED', order_status = 'CANCELLED', updated_at = ? WHERE payment_status = 'PENDING' AND created_at < ?",
      [now(), cutoff],
    );
  }

  async function getOrder(orderNumber: string): Promise<Order | null> {
    if (!ORDER_NUMBER_PATTERN.test(orderNumber)) return null;
    const db = await deps.getDb();
    await expireStaleOrders(db);
    return findOrder(db, "order_number", orderNumber);
  }

  async function requireOrder(orderNumber: string): Promise<Order> {
    const order = await getOrder(orderNumber);
    if (!order) throw new PrebookingError("NOT_FOUND", "Order not found");
    return order;
  }

  /**
   * Creates the PENDING order, with every amount calculated here from the saved
   * settings. Calling it again with the same clientToken (browser refresh, going
   * back to edit the address) updates that order instead of creating another.
   */
  async function createOrder(input: unknown): Promise<{ order: Order; created: boolean }> {
    const productId = parseProductId((input as { productId?: unknown } | null)?.productId);
    const product = PREBOOKING_PRODUCTS[productId];
    const settings = await getSettings();
    const parsed = prebookingFormSchema(settings.products[productId])
      .extend({ clientToken: clientTokenSchema })
      .safeParse(input);
    if (!parsed.success) {
      throw new PrebookingError("VALIDATION", "Please check your details", parsed.error.issues);
    }
    const { clientToken, quantityKg, ...customer } = parsed.data;
    const amounts = computeQuote(settings, productId, quantityKg, customer.state);
    const db = await deps.getDb();

    const details: [string, SqlValue][] = [
      ["quantity_kg", quantityKg],
      ["price_per_kg_paise", amounts.pricePerKgPaise],
      ["product_amount_paise", amounts.productAmountPaise],
      ["shipping_amount_paise", amounts.shippingAmountPaise],
      ["tax_amount_paise", amounts.taxAmountPaise],
      ["discount_amount_paise", amounts.discountAmountPaise],
      ["grand_total_paise", amounts.grandTotalPaise],
      ["customer_name", customer.fullName],
      ["customer_email", customer.email],
      ["customer_phone", customer.phone],
      ["address_line_1", customer.addressLine1],
      ["address_line_2", customer.addressLine2 || null],
      ["city", customer.city],
      ["district", customer.district],
      ["state", customer.state],
      ["pincode", customer.pincode],
      ["country", customer.country],
      ["gst_number", customer.gstNumber || null],
      ["shipping_method", amounts.shippingMethod],
      ["updated_at", now()],
    ];

    const attempt = () =>
      db.transaction(async (tx) => {
        const existing = await findOrder(tx, "client_token", clientToken);
        if (existing) {
          if (existing.productId !== productId) {
            throw new PrebookingError("CONFLICT", "Please start a new pre-booking for this product.");
          }
          // Once a payment reference has been submitted the order is frozen.
          if (existing.paymentStatus !== "PENDING") return { order: existing, created: false };
          await tx.execute(
            `UPDATE prebooking_orders SET ${details.map(([column]) => `${column} = ?`).join(", ")} WHERE id = ? AND payment_status = 'PENDING'`,
            [...details.map(([, value]) => value), existing.id],
          );
          return { order: (await findOrder(tx, "id", existing.id))!, created: false };
        }

        const fixed: [string, SqlValue][] = [
          ["order_number", await nextOrderNumber(tx, product.orderPrefix)],
          ["client_token", clientToken],
          ["product_id", product.id],
          ["product_name", product.name],
          ["payment_provider", PAYMENT_PROVIDER],
          ["payment_status", "PENDING"],
          ["order_status", "PENDING"],
          ["created_at", now()],
        ];
        const columns = [...fixed, ...details];
        const inserted = await tx.execute(
          `INSERT INTO prebooking_orders (${columns.map(([column]) => column).join(", ")}) VALUES (${placeholders(columns)})`,
          columns.map(([, value]) => value),
        );
        return { order: (await findOrder(tx, "id", inserted.insertId))!, created: true };
      });

    try {
      return await attempt();
    } catch (err) {
      // Two identical submissions raced (double click): the second finds the first's order.
      if (isUniqueViolation(err)) return attempt();
      throw err;
    }
  }

  async function referenceUsedElsewhere(db: Db, reference: string, orderId: number) {
    const rows = await db.query(
      `SELECT id FROM prebooking_orders WHERE payment_reference = ? AND id <> ? AND payment_status IN (${placeholders(REFERENCE_IN_USE)})`,
      [reference, orderId, ...REFERENCE_IN_USE],
    );
    return rows.length > 0;
  }

  async function trySend(message: EmailMessage, what: string) {
    try {
      await deps.mailer.send(message);
      return true;
    } catch (err) {
      console.error(`Pre-booking: failed to send ${what}:`, err);
      return false;
    }
  }

  /**
   * The customer says they have paid and gives their UPI reference. This never
   * marks the order as paid: it only queues it for the admin to verify.
   */
  async function submitPaymentReference(input: {
    orderNumber: string;
    clientToken: string;
    reference: unknown;
    baseUrl: string;
  }): Promise<Order> {
    const reference = upiReferenceSchema.safeParse(input.reference);
    if (!reference.success) {
      throw new PrebookingError("VALIDATION", reference.error.issues[0].message);
    }
    const order = await requireOrder(input.orderNumber);
    if (!tokensMatch(order.clientToken, input.clientToken)) {
      throw new PrebookingError(
        "FORBIDDEN",
        "This order can only be paid from the device it was created on, or from the link in your email.",
      );
    }

    if (order.paymentStatus === "PAID") return order;
    if (order.paymentStatus === "PAYMENT_INITIATED") {
      if (order.paymentReference === reference.data) return order;
      throw new PrebookingError(
        "CONFLICT",
        "A payment reference was already submitted for this order and is being verified.",
      );
    }
    if (order.paymentStatus !== "PENDING" && order.paymentStatus !== "FAILED") {
      throw new PrebookingError(
        "CONFLICT",
        `This order is ${order.paymentStatus.toLowerCase().replace("_", " ")} and can no longer be paid. Please start a new pre-booking.`,
      );
    }

    const db = await deps.getDb();
    if (await referenceUsedElsewhere(db, reference.data, order.id)) {
      throw new PrebookingError(
        "CONFLICT",
        "This UPI reference has already been used for another order. Please check the number.",
      );
    }

    const updated = await db.execute(
      "UPDATE prebooking_orders SET payment_status = 'PAYMENT_INITIATED', payment_reference = ?, payment_submitted_at = ?, updated_at = ? WHERE id = ? AND payment_status IN ('PENDING', 'FAILED')",
      [reference.data, now(), now(), order.id],
    );
    const current = (await findOrder(db, "id", order.id))!;
    if (updated.affectedRows === 1) {
      await trySend(
        buildAdminVerifyEmail(
          current,
          deps.adminEmail,
          `${input.baseUrl}/admin/orders/${current.orderNumber}`,
        ),
        `payment-to-verify email for ${current.orderNumber}`,
      );
    }
    return current;
  }

  type EmailOutcome = "sent" | "already-sent" | "failed";

  /**
   * Sends the admin and customer confirmation emails for a PAID order, each at
   * most once: the "sent" timestamp is claimed atomically before sending and
   * released again if sending fails, so a later call can retry it.
   */
  async function sendConfirmationEmails(
    orderId: number,
  ): Promise<{ admin: EmailOutcome; customer: EmailOutcome } | null> {
    const db = await deps.getDb();
    const order = await findOrder(db, "id", orderId);
    if (!order || order.paymentStatus !== "PAID") return null;

    async function sendOnce(
      column: "admin_email_sent_at" | "customer_email_sent_at",
      message: EmailMessage,
    ): Promise<EmailOutcome> {
      const claimed = await db.execute(
        `UPDATE prebooking_orders SET ${column} = ? WHERE id = ? AND ${column} IS NULL AND payment_status = 'PAID'`,
        [now(), orderId],
      );
      if (claimed.affectedRows === 0) return "already-sent";
      if (await trySend(message, `${column} for ${order!.orderNumber}`)) return "sent";
      await db.execute(`UPDATE prebooking_orders SET ${column} = NULL WHERE id = ?`, [orderId]);
      return "failed";
    }

    return {
      admin: await sendOnce("admin_email_sent_at", buildAdminPaidEmail(order, deps.adminEmail)),
      customer: await sendOnce("customer_email_sent_at", buildCustomerConfirmationEmail(order)),
    };
  }

  /**
   * The only way an order becomes PAID: an admin who has seen the money in the
   * UPI account confirms the amount received and its reference. The amount must
   * match the total the server calculated for the order.
   */
  async function confirmPayment(input: {
    orderNumber: string;
    amountReceivedPaise: number;
    reference: unknown;
    note?: string;
  }): Promise<{ order: Order; alreadyPaid: boolean }> {
    const order = await requireOrder(input.orderNumber);
    if (order.paymentStatus === "PAID") {
      await sendConfirmationEmails(order.id);
      return { order: (await getOrder(order.orderNumber))!, alreadyPaid: true };
    }
    if (!CAN_BE_MARKED_PAID.includes(order.paymentStatus)) {
      throw new PrebookingError(
        "CONFLICT",
        `An order with payment status ${order.paymentStatus} cannot be marked as paid.`,
      );
    }
    if (input.amountReceivedPaise !== order.grandTotalPaise) {
      throw new PrebookingError(
        "AMOUNT_MISMATCH",
        `Amount received (${formatInr(input.amountReceivedPaise)}) does not match the order total (${formatInr(order.grandTotalPaise)}). The order was not marked as paid.`,
      );
    }
    const reference = upiReferenceSchema.safeParse(input.reference);
    if (!reference.success) {
      throw new PrebookingError("VALIDATION", reference.error.issues[0].message);
    }

    const db = await deps.getDb();
    if (await referenceUsedElsewhere(db, reference.data, order.id)) {
      throw new PrebookingError(
        "CONFLICT",
        "This UPI reference is already recorded against another order.",
      );
    }

    const updated = await db.execute(
      `UPDATE prebooking_orders SET payment_status = 'PAID', order_status = 'CONFIRMED', payment_reference = ?, payment_note = ?, paid_at = ?, updated_at = ? WHERE id = ? AND payment_status IN (${placeholders(CAN_BE_MARKED_PAID)})`,
      [reference.data, input.note?.trim().slice(0, 500) || null, now(), now(), order.id, ...CAN_BE_MARKED_PAID],
    );
    await sendConfirmationEmails(order.id);
    return {
      order: (await findOrder(db, "id", order.id))!,
      alreadyPaid: updated.affectedRows === 0,
    };
  }

  /** The admin could not find the reported payment. The customer may submit again. */
  async function rejectPayment(input: {
    orderNumber: string;
    note?: string;
    baseUrl: string;
  }): Promise<Order> {
    const order = await requireOrder(input.orderNumber);
    const db = await deps.getDb();
    const updated = await db.execute(
      "UPDATE prebooking_orders SET payment_status = 'FAILED', payment_note = ?, updated_at = ? WHERE id = ? AND payment_status IN ('PENDING', 'PAYMENT_INITIATED')",
      [input.note?.trim().slice(0, 500) || null, now(), order.id],
    );
    if (updated.affectedRows === 0) {
      throw new PrebookingError(
        "CONFLICT",
        `An order with payment status ${order.paymentStatus} cannot be marked as not received.`,
      );
    }
    const current = (await findOrder(db, "id", order.id))!;
    await trySend(
      buildCustomerPaymentNotFoundEmail(
        current,
        `${input.baseUrl}/order-confirmation/${current.orderNumber}?t=${current.clientToken}`,
      ),
      `payment-not-found email for ${current.orderNumber}`,
    );
    return current;
  }

  async function updateOrderStatus(orderNumber: string, status: OrderStatus): Promise<Order> {
    const order = await requireOrder(orderNumber);
    const paid = order.paymentStatus === "PAID";
    let paymentStatus: PaymentStatus = order.paymentStatus;

    if (FULFILMENT_STATUSES.includes(status) && !paid) {
      throw new PrebookingError(
        "CONFLICT",
        `Payment is ${order.paymentStatus}. Verify the payment before moving the order to ${status}.`,
      );
    }
    if (status === "PENDING" && paid) {
      throw new PrebookingError("CONFLICT", "A paid order cannot go back to PENDING.");
    }
    if (status === "CANCELLED" && CAN_BE_MARKED_PAID.includes(order.paymentStatus)) {
      paymentStatus = "CANCELLED";
    }
    if (status === "REFUNDED") {
      if (!["PAID", "REFUND_PENDING", "REFUNDED"].includes(order.paymentStatus)) {
        throw new PrebookingError("CONFLICT", "Only a paid order can be refunded.");
      }
      paymentStatus = "REFUNDED";
    }

    const db = await deps.getDb();
    await db.execute(
      "UPDATE prebooking_orders SET order_status = ?, payment_status = ?, updated_at = ? WHERE id = ?",
      [status, paymentStatus, now(), order.id],
    );
    return (await findOrder(db, "id", order.id))!;
  }

  async function markRefundPending(orderNumber: string): Promise<Order> {
    const order = await requireOrder(orderNumber);
    const db = await deps.getDb();
    const updated = await db.execute(
      "UPDATE prebooking_orders SET payment_status = 'REFUND_PENDING', updated_at = ? WHERE id = ? AND payment_status = 'PAID'",
      [now(), order.id],
    );
    if (updated.affectedRows === 0) {
      throw new PrebookingError("CONFLICT", "Only a paid order can be marked for refund.");
    }
    return (await findOrder(db, "id", order.id))!;
  }

  async function listOrders(options: {
    paymentStatus?: PaymentStatus;
    limit: number;
    offset: number;
  }): Promise<{ orders: Order[]; total: number }> {
    const db = await deps.getDb();
    await expireStaleOrders(db);
    const where = options.paymentStatus ? "WHERE payment_status = ?" : "";
    const params: SqlValue[] = options.paymentStatus ? [options.paymentStatus] : [];
    const [count] = await db.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM prebooking_orders ${where}`,
      params,
    );
    const rows = await db.query<OrderRow>(
      `SELECT * FROM prebooking_orders ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, options.limit, options.offset],
    );
    return { orders: rows.map(mapOrder), total: Number(count.total) };
  }

  return {
    getSettings,
    saveSettings,
    quote,
    createOrder,
    getOrder,
    submitPaymentReference,
    confirmPayment,
    rejectPayment,
    sendConfirmationEmails,
    updateOrderStatus,
    markRefundPending,
    listOrders,
  };
}

export type PrebookingService = ReturnType<typeof createPrebookingService>;

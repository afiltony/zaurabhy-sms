import { mkdir, appendFile, readFile } from "fs/promises";
import path from "path";
import type { CartItem } from "@/lib/cart-context";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.jsonl");

export type OrderStatus = "created" | "paid" | "failed";

export type OrderRecord = {
  id: string;
  status: OrderStatus;
  items: CartItem[];
  itemsSubtotal: number;
  shippingCost: number;
  courier: string;
  /** Grand total actually charged: itemsSubtotal + shippingCost. */
  amount: number;
  currency: "INR";
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  updatedAt: string;
};

async function appendOrderEvent(record: OrderRecord) {
  await mkdir(DATA_DIR, { recursive: true });
  const line = `${JSON.stringify({ ...record, updatedAt: new Date().toISOString() })}\n`;
  await appendFile(ORDERS_FILE, line, "utf8");
}

export async function createOrder(
  record: Omit<OrderRecord, "status" | "updatedAt">,
) {
  const order: OrderRecord = { ...record, status: "created", updatedAt: "" };
  await appendOrderEvent(order);
  return order;
}

export async function updateOrderStatus(
  id: string,
  patch: Partial<OrderRecord> & { status: OrderStatus },
) {
  const existing = await getOrder(id);
  if (!existing) throw new Error(`Order ${id} not found`);
  const updated: OrderRecord = { ...existing, ...patch };
  await appendOrderEvent(updated);
  return updated;
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  let content: string;
  try {
    content = await readFile(ORDERS_FILE, "utf8");
  } catch {
    return null;
  }

  let latest: OrderRecord | null = null;
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    const record: OrderRecord = JSON.parse(line);
    if (record.id === id) latest = record;
  }
  return latest;
}

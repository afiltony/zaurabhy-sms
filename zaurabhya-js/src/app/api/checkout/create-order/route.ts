import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validation";
import { getVariant } from "@/data/products";
import { computeShipping } from "@/data/shipping";
import { createOrder } from "@/lib/orders";
import { getRazorpayClient, isRazorpayConfigured } from "@/lib/razorpay";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { items, ...shipping } = parsed.data;

  let itemsSubtotal = 0;
  for (const item of items) {
    const variant = getVariant(item.slug, item.variantId);
    if (!variant) {
      return NextResponse.json(
        { error: `Unknown product variant: ${item.slug} / ${item.variantId}` },
        { status: 400 },
      );
    }
    itemsSubtotal += variant.price * item.quantity;
  }

  const shippingQuote = computeShipping(items, shipping.state);
  if (!shippingQuote) {
    return NextResponse.json({ error: "Could not calculate shipping" }, { status: 400 });
  }

  const shippingCost = shippingQuote.cost;
  const courier = shippingQuote.courier;
  const amount = itemsSubtotal + shippingCost;

  const orderId = randomUUID();

  if (!isRazorpayConfigured()) {
    await createOrder({
      id: orderId,
      items,
      itemsSubtotal,
      shippingCost,
      courier,
      amount,
      currency: "INR",
      ...shipping,
    });
    return NextResponse.json(
      {
        configured: false,
        orderId,
        amount,
        message:
          "Online payments are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable checkout.",
      },
      { status: 200 },
    );
  }

  const razorpay = getRazorpayClient();
  const razorpayOrder = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: orderId,
  });

  await createOrder({
    id: orderId,
    items,
    itemsSubtotal,
    shippingCost,
    courier,
    amount,
    currency: "INR",
    razorpayOrderId: razorpayOrder.id,
    ...shipping,
  });

  return NextResponse.json({
    configured: true,
    orderId,
    razorpayOrderId: razorpayOrder.id,
    amount,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}

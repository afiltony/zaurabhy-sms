import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validation";
import { resolveOrderPricing } from "@/lib/checkout";
import { createOrder, getNextOrderNumber } from "@/lib/orders";
import { getRazorpayClient, isRazorpayConfigured } from "@/lib/razorpay";
import { buildPayuHash, getPayuBaseUrl, isPayuConfigured } from "@/lib/payu";
import { sendErrorAlert } from "@/lib/mail";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    console.error("Checkout validation failed:", JSON.stringify(parsed.error.issues));
    return NextResponse.json(
      { error: "Invalid submission", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- confirmPhone is only for form validation, not persisted
  const { items, paymentMethod, confirmPhone, ...shipping } = parsed.data;

  const pricing = resolveOrderPricing(items, shipping.state);
  if ("error" in pricing) {
    return NextResponse.json({ error: pricing.error }, { status: 400 });
  }

  const orderId = randomUUID();
  const orderNumber = await getNextOrderNumber();

  if (paymentMethod === "cod") {
    await createOrder({
      id: orderId,
      orderNumber,
      paymentMethod,
      items,
      currency: "INR",
      ...pricing,
      ...shipping,
    });
    return NextResponse.json({
      configured: true,
      orderId,
      orderNumber,
      amount: pricing.amount,
    });
  }

  if (paymentMethod === "payu") {
    if (!isPayuConfigured()) {
      return NextResponse.json(
        {
          configured: false,
          orderId,
          orderNumber,
          amount: pricing.amount,
          message:
            "PayU is not configured yet. Add PAYU_MERCHANT_KEY and PAYU_MERCHANT_SALT to enable this payment method.",
        },
        { status: 200 },
      );
    }

    await createOrder({
      id: orderId,
      orderNumber,
      paymentMethod,
      items,
      currency: "INR",
      ...pricing,
      ...shipping,
    });

    const txnid = orderNumber.replace(/-/g, "");
    const amount = pricing.amount.toFixed(2);
    const productinfo = "ZAURABHYA Order";
    const siteUrl = process.env.SITE_URL || new URL(request.url).origin;

    const hash = buildPayuHash({
      txnid,
      amount,
      productinfo,
      firstname: shipping.fullName,
      email: shipping.email,
    });

    return NextResponse.json({
      configured: true,
      orderId,
      orderNumber,
      amount: pricing.amount,
      payu: {
        action: getPayuBaseUrl(),
        fields: {
          key: process.env.PAYU_MERCHANT_KEY,
          txnid,
          amount,
          productinfo,
          firstname: shipping.fullName,
          email: shipping.email,
          phone: shipping.phone,
          surl: `${siteUrl}/api/checkout/payu/callback`,
          furl: `${siteUrl}/api/checkout/payu/callback`,
          hash,
          service_provider: "payu_paisa",
        },
      },
    });
  }

  // paymentMethod === "razorpay"
  if (!isRazorpayConfigured()) {
    await createOrder({
      id: orderId,
      orderNumber,
      paymentMethod,
      items,
      currency: "INR",
      ...pricing,
      ...shipping,
    });
    return NextResponse.json(
      {
        configured: false,
        orderId,
        orderNumber,
        amount: pricing.amount,
        message:
          "Online payments are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable checkout.",
      },
      { status: 200 },
    );
  }

  const razorpay = getRazorpayClient();
  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: pricing.amount * 100,
      currency: "INR",
      receipt: orderNumber,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    await sendErrorAlert("Razorpay order creation failed", {
      orderNumber,
      amount: pricing.amount,
      customerEmail: shipping.email,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Could not reach the payment gateway. Please try again." },
      { status: 502 },
    );
  }

  await createOrder({
    id: orderId,
    orderNumber,
    paymentMethod,
    items,
    currency: "INR",
    ...pricing,
    razorpayOrderId: razorpayOrder.id,
    ...shipping,
  });

  return NextResponse.json({
    configured: true,
    orderId,
    orderNumber,
    razorpayOrderId: razorpayOrder.id,
    amount: pricing.amount,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}

import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getOrderByRazorpayOrderId, updateOrderStatus } from "@/lib/orders";
import { sendErrorAlert } from "@/lib/mail";

/**
 * Server-to-server notification from Razorpay. This is the reliable source of
 * truth for payment status — unlike the client-side `handler` callback in
 * checkout/page.tsx, it still fires if the browser closes or loses network
 * right after a successful payment.
 *
 * Configure this URL (https://<your-domain>/api/checkout/webhook) and the
 * payment.captured / payment.failed events in the Razorpay Dashboard under
 * Settings > Webhooks, and set RAZORPAY_WEBHOOK_SECRET to the secret shown
 * there.
 */
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  const rawBody = await request.text();

  if (!signature || !Razorpay.validateWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const payment = event.payload?.payment?.entity;

  if (
    payment?.order_id &&
    (event.event === "payment.captured" || event.event === "payment.failed")
  ) {
    const order = await getOrderByRazorpayOrderId(payment.order_id);
    if (order && order.status === "created") {
      const status = event.event === "payment.captured" ? "paid" : "failed";
      await updateOrderStatus(order.id, {
        status,
        razorpayPaymentId: payment.id,
      });
      if (status === "failed") {
        await sendErrorAlert("Razorpay payment failed (webhook)", {
          orderNumber: order.orderNumber,
          orderId: order.id,
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          errorCode: payment.error_code,
          errorDescription: payment.error_description,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}

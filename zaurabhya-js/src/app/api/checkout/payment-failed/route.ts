import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrder, updateOrderStatus } from "@/lib/orders";
import { sendErrorAlert } from "@/lib/mail";

const payloadSchema = z.object({
  orderId: z.string().trim().min(1),
  razorpay_order_id: z.string().trim().optional(),
  razorpay_payment_id: z.string().trim().optional(),
  code: z.string().trim().optional(),
  description: z.string().trim().optional(),
  reason: z.string().trim().optional(),
  source: z.string().trim().optional(),
  step: z.string().trim().optional(),
});

/**
 * Reported by the client when Razorpay's checkout widget itself declines a
 * payment (razorpay.on("payment.failed", ...)). This is the only signal for
 * that case: the webhook may not be configured, and the success `handler`
 * never fires for a declined payment.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const { orderId, razorpay_payment_id, code, description, reason, source, step } =
    parsed.data;

  const order = await getOrder(orderId);
  if (order && order.status === "created") {
    await updateOrderStatus(orderId, {
      status: "failed",
      razorpayPaymentId: razorpay_payment_id,
    });
  }

  await sendErrorAlert("Razorpay payment declined at checkout", {
    orderId,
    orderNumber: order?.orderNumber,
    customerEmail: order?.email,
    razorpayPaymentId: razorpay_payment_id,
    code,
    reason,
    source,
    step,
    description,
  });

  return NextResponse.json({ received: true });
}

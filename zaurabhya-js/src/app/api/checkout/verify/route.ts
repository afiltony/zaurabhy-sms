import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { updateOrderStatus } from "@/lib/orders";

const verifySchema = z.object({
  orderId: z.string().trim().min(1),
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    parsed.data;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json(
      { error: "Razorpay is not configured" },
      { status: 500 },
    );
  }

  const expectedSignature = createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const actual = Buffer.from(razorpay_signature, "hex");
  const isValid =
    expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!isValid) {
    await updateOrderStatus(orderId, {
      status: "failed",
      razorpayPaymentId: razorpay_payment_id,
    });
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  await updateOrderStatus(orderId, {
    status: "paid",
    razorpayPaymentId: razorpay_payment_id,
  });

  return NextResponse.json({ success: true, orderId });
}

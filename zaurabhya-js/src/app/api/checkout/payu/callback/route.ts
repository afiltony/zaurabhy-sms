import { NextResponse } from "next/server";
import { verifyPayuResponseHash } from "@/lib/payu";
import { getOrderByOrderNumber, updateOrderStatus } from "@/lib/orders";

export async function POST(request: Request) {
  const siteUrl = process.env.SITE_URL || new URL(request.url).origin;
  const formData = await request.formData();

  const status = String(formData.get("status") ?? "");
  const txnid = String(formData.get("txnid") ?? "");
  const amount = String(formData.get("amount") ?? "");
  const productinfo = String(formData.get("productinfo") ?? "");
  const firstname = String(formData.get("firstname") ?? "");
  const email = String(formData.get("email") ?? "");
  const hash = String(formData.get("hash") ?? "");
  const mihpayid = formData.get("mihpayid");

  const order = await getOrderByOrderNumber(txnid);
  if (!order) {
    return NextResponse.redirect(`${siteUrl}/checkout`, { status: 303 });
  }

  const isValid = verifyPayuResponseHash({
    status,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    hash,
  });

  await updateOrderStatus(order.id, {
    status: isValid && status === "success" ? "paid" : "failed",
    payuTxnId: txnid,
    payuPaymentId: mihpayid ? String(mihpayid) : undefined,
  });

  return NextResponse.redirect(`${siteUrl}/order-confirmation/${order.id}`, {
    status: 303,
  });
}

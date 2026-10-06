import Link from "next/link";
import { notFound } from "next/navigation";
import {
  confirmPaymentAction,
  markRefundPendingAction,
  rejectPaymentAction,
  resendEmailsAction,
  updateOrderStatusAction,
} from "@/app/admin/actions";
import {
  AdminBanner,
  AdminHeader,
  StatusBadge,
  formatAdminDate,
} from "@/components/admin/AdminChrome";
import { requireAdmin } from "@/lib/prebooking/admin-auth";
import { ORDER_STATUSES } from "@/lib/prebooking/config";
import { formatAddress } from "@/lib/prebooking/emails";
import { formatInr } from "@/lib/prebooking/pricing";
import { prebooking } from "@/lib/prebooking/server";

const card = "rounded-2xl border border-border bg-white p-5";
const input =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const label = "mb-1 block text-xs font-semibold text-ink-soft";

function Field({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <dt className="text-ink-muted">{name}</dt>
      <dd className="text-right font-semibold text-ink">{children}</dd>
    </div>
  );
}

export default async function AdminOrderPage(props: PageProps<"/admin/orders/[orderNumber]">) {
  await requireAdmin();
  const { orderNumber } = await props.params;
  const { notice, error } = await props.searchParams;
  const order = await prebooking.getOrder(orderNumber);
  if (!order) notFound();

  const canVerify = ["PENDING", "PAYMENT_INITIATED", "FAILED", "EXPIRED"].includes(
    order.paymentStatus,
  );
  const canReject = ["PENDING", "PAYMENT_INITIATED"].includes(order.paymentStatus);
  const isPaid = order.paymentStatus === "PAID";
  const emailsPending = isPaid && (!order.adminEmailSentAt || !order.customerEmailSentAt);

  return (
    <>
      <AdminHeader title={order.orderNumber} />
      <AdminBanner notice={notice} error={error} />
      <Link href="/admin" className="text-sm font-semibold text-ink-muted hover:text-coral">
        &larr; All orders
      </Link>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <section className={card}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-ink">Payment</span>
              <StatusBadge status={order.paymentStatus} />
              <span className="ml-3 text-sm font-bold text-ink">Order</span>
              <StatusBadge status={order.orderStatus} />
            </div>
            <dl className="text-sm">
              <Field name="Date">{formatAdminDate(order.createdAt)}</Field>
              <Field name="Product">{order.productName}</Field>
              <Field name="Quantity">{order.quantityKg} KG</Field>
              <Field name="Price per KG">{formatInr(order.pricePerKgPaise)}</Field>
              <Field name="Product Amount">{formatInr(order.productAmountPaise)}</Field>
              <Field name="Shipping">{formatInr(order.shippingAmountPaise)}</Field>
              <Field name="Tax">{formatInr(order.taxAmountPaise)}</Field>
              <Field name="Total">
                <span className="text-lg">{formatInr(order.grandTotalPaise)}</span>
              </Field>
              <Field name="Shipping Method">{order.shippingMethod}</Field>
              <Field name="Payment Method">Paytm UPI (QR)</Field>
              <Field name="UPI Transaction ID (UTR)">
                <span className="font-mono">{order.paymentReference ?? "-"}</span>
              </Field>
              <Field name="Reference submitted">{formatAdminDate(order.paymentSubmittedAt)}</Field>
              <Field name="Paid at">{formatAdminDate(order.paidAt)}</Field>
              <Field name="Payment note">{order.paymentNote ?? "-"}</Field>
              <Field name="Admin email">{formatAdminDate(order.adminEmailSentAt)}</Field>
              <Field name="Customer email">{formatAdminDate(order.customerEmailSentAt)}</Field>
            </dl>
          </section>

          <section className={card}>
            <h2 className="mb-2 text-sm font-bold text-ink">Customer &amp; delivery</h2>
            <dl className="text-sm">
              <Field name="Customer">{order.customerName}</Field>
              <Field name="Phone">
                <a href={`tel:+91${order.customerPhone}`} className="text-blue">
                  {order.customerPhone}
                </a>
              </Field>
              <Field name="Email">
                <a href={`mailto:${order.customerEmail}`} className="break-all text-blue">
                  {order.customerEmail}
                </a>
              </Field>
              <Field name="Delivery Address">
                {formatAddress(order).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </Field>
              <Field name="GST Number">{order.gstNumber ?? "-"}</Field>
            </dl>
          </section>
        </div>

        <div className="space-y-5">
          {canVerify && (
            <section className={`${card} border-teal`}>
              <h2 className="text-base font-bold text-ink">Verify payment</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Open your Paytm app or bank statement and find a credit of{" "}
                <strong>{formatInr(order.grandTotalPaise)}</strong>
                {order.paymentReference && (
                  <>
                    {" "}
                    with reference <strong className="font-mono">{order.paymentReference}</strong>
                  </>
                )}
                . Only mark it as paid once you have seen the money in your account: this confirms
                the order and emails the customer.
              </p>
              <form action={confirmPaymentAction} className="mt-4 space-y-3">
                <input type="hidden" name="orderNumber" value={order.orderNumber} />
                <div>
                  <label className={label} htmlFor="amountReceived">
                    Amount actually received (₹) — type it from your statement
                  </label>
                  <input
                    id="amountReceived"
                    name="amountReceived"
                    inputMode="decimal"
                    required
                    autoComplete="off"
                    className={input}
                  />
                </div>
                <div>
                  <label className={label} htmlFor="reference">
                    UPI reference / UTR (12 digits)
                  </label>
                  <input
                    id="reference"
                    name="reference"
                    inputMode="numeric"
                    required
                    defaultValue={order.paymentReference ?? ""}
                    className={`${input} font-mono`}
                  />
                </div>
                <div>
                  <label className={label} htmlFor="confirmNote">
                    Note (optional)
                  </label>
                  <input id="confirmNote" name="note" maxLength={500} className={input} />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-teal py-3 text-sm font-bold text-teal-foreground"
                >
                  Payment received — mark as PAID
                </button>
              </form>

              {canReject && (
                <form action={rejectPaymentAction} className="mt-5 space-y-3 border-t border-border pt-4">
                  <input type="hidden" name="orderNumber" value={order.orderNumber} />
                  <label className={label} htmlFor="rejectNote">
                    Could not find this payment? Note (optional)
                  </label>
                  <input id="rejectNote" name="note" maxLength={500} className={input} />
                  <button
                    type="submit"
                    className="w-full rounded-full border-[1.5px] border-coral py-3 text-sm font-bold text-coral"
                  >
                    Payment NOT received — mark as FAILED
                  </button>
                  <p className="text-xs text-ink-muted">
                    The customer is emailed that the payment could not be verified and can try
                    again on the same order.
                  </p>
                </form>
              )}
            </section>
          )}

          <section className={card}>
            <h2 className="text-base font-bold text-ink">Order status</h2>
            <form action={updateOrderStatusAction} className="mt-3 flex gap-2">
              <input type="hidden" name="orderNumber" value={order.orderNumber} />
              <select
                name="orderStatus"
                defaultValue={order.orderStatus}
                aria-label="Order status"
                className={input}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="shrink-0 rounded-full bg-coral px-5 text-sm font-bold text-white"
              >
                Update
              </button>
            </form>
            <p className="mt-2 text-xs text-ink-muted">
              Confirmed, Processing, Packed, Shipped and Delivered need a verified payment.
              Refunded marks the payment as refunded (send the refund from your UPI app first).
            </p>

            {isPaid && (
              <form action={markRefundPendingAction} className="mt-4 border-t border-border pt-4">
                <input type="hidden" name="orderNumber" value={order.orderNumber} />
                <button type="submit" className="text-sm font-bold text-coral">
                  Mark payment as REFUND PENDING
                </button>
              </form>
            )}
          </section>

          {isPaid && (
            <section className={card}>
              <h2 className="text-base font-bold text-ink">Confirmation emails</h2>
              <p className="mt-1 text-sm text-ink-soft">
                {emailsPending
                  ? "At least one confirmation email has not been sent (SMTP problem?)."
                  : "Both confirmation emails were sent."}
              </p>
              {emailsPending && (
                <form action={resendEmailsAction} className="mt-3">
                  <input type="hidden" name="orderNumber" value={order.orderNumber} />
                  <button
                    type="submit"
                    className="rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white"
                  >
                    Send missing emails
                  </button>
                </form>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}

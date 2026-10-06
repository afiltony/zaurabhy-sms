import Link from "next/link";
import {
  AdminBanner,
  AdminHeader,
  StatusBadge,
  formatAdminDate,
} from "@/components/admin/AdminChrome";
import { requireAdmin } from "@/lib/prebooking/admin-auth";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/lib/prebooking/config";
import { formatInr } from "@/lib/prebooking/pricing";
import { prebooking } from "@/lib/prebooking/server";

const PAGE_SIZE = 25;

export default async function AdminOrdersPage(props: PageProps<"/admin">) {
  await requireAdmin();
  const params = await props.searchParams;
  const status = PAYMENT_STATUSES.find((value) => value === params.status) as
    | PaymentStatus
    | undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ orders, total }, toVerify] = await Promise.all([
    prebooking.listOrders({ paymentStatus: status, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    prebooking.listOrders({ paymentStatus: "PAYMENT_INITIATED", limit: 1, offset: 0 }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (nextStatus: string | undefined, nextPage = 1) => {
    const query = new URLSearchParams();
    if (nextStatus) query.set("status", nextStatus);
    if (nextPage > 1) query.set("page", String(nextPage));
    const text = query.toString();
    return text ? `/admin?${text}` : "/admin";
  };

  return (
    <>
      <AdminHeader title="Pre-Booking Orders" />
      <AdminBanner notice={params.notice} error={params.error} />

      {toVerify.total > 0 && (
        <Link
          href={href("PAYMENT_INITIATED")}
          className="mb-5 block rounded-xl border border-[#e6c200] bg-[#fff8dc] px-4 py-3 text-sm font-bold text-ink"
        >
          {toVerify.total} payment{toVerify.total === 1 ? "" : "s"} waiting for you to verify &rarr;
        </Link>
      )}

      <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold">
        {[undefined, ...PAYMENT_STATUSES].map((value) => (
          <Link
            key={value ?? "all"}
            href={href(value)}
            className={`rounded-full border px-3 py-1.5 ${
              value === status
                ? "border-teal bg-teal text-teal-foreground"
                : "border-border bg-white text-ink-soft hover:border-teal"
            }`}
          >
            {value ? value.replace(/_/g, " ") : "ALL"}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="border-b border-border bg-cream text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              {[
                "Order Number",
                "Date",
                "Customer",
                "Product",
                "Qty",
                "Amount",
                "Shipping",
                "Total",
                "Payment",
                "Order",
                "UPI Txn ID",
                "Shipping Method",
                "Delivery Address",
              ].map((heading) => (
                <th key={heading} className="px-3 py-3 font-bold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id} className="align-top">
                <td className="px-3 py-3">
                  <Link
                    href={`/admin/orders/${order.orderNumber}`}
                    className="whitespace-nowrap font-bold text-blue underline-offset-2 hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-ink-soft">
                  {formatAdminDate(order.createdAt)}
                </td>
                <td className="px-3 py-3">
                  <p className="font-semibold text-ink">{order.customerName}</p>
                  <p className="text-ink-soft">{order.customerPhone}</p>
                  <p className="text-ink-muted">{order.customerEmail}</p>
                </td>
                <td className="px-3 py-3 text-ink-soft">{order.productName}</td>
                <td className="whitespace-nowrap px-3 py-3">{order.quantityKg} KG</td>
                <td className="px-3 py-3">{formatInr(order.productAmountPaise)}</td>
                <td className="px-3 py-3">{formatInr(order.shippingAmountPaise)}</td>
                <td className="px-3 py-3 font-bold">{formatInr(order.grandTotalPaise)}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={order.paymentStatus} />
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={order.orderStatus} />
                </td>
                <td className="px-3 py-3 font-mono text-xs">{order.paymentReference ?? "-"}</td>
                <td className="px-3 py-3 text-ink-soft">{order.shippingMethod}</td>
                <td className="px-3 py-3 text-ink-soft">
                  {order.city}, {order.district}, {order.state} - {order.pincode}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={13} className="px-3 py-10 text-center text-ink-muted">
                  No orders{status ? ` with payment status ${status.replace(/_/g, " ")}` : " yet"}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
        <span>
          {total} order{total === 1 ? "" : "s"} &middot; page {page} of {pages}
        </span>
        <span className="flex gap-4 font-semibold">
          {page > 1 && <Link href={href(status, page - 1)}>&larr; Newer</Link>}
          {page < pages && <Link href={href(status, page + 1)}>Older &rarr;</Link>}
        </span>
      </div>
    </>
  );
}

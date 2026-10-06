import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import type { OrderStatus, PaymentStatus } from "@/lib/prebooking/config";

export function AdminHeader({ title }: { title: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
      <nav className="flex items-center gap-4 text-sm font-semibold">
        <Link href="/admin" className="text-ink-soft hover:text-coral">
          Orders
        </Link>
        <Link href="/admin/settings" className="text-ink-soft hover:text-coral">
          Settings
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="text-ink-muted hover:text-coral">
            Sign out
          </button>
        </form>
      </nav>
    </div>
  );
}

/** Success / error banner driven by the ?notice= and ?error= params set by admin actions. */
export function AdminBanner({
  notice,
  error,
}: {
  notice?: string | string[];
  error?: string | string[];
}) {
  if (typeof error === "string") {
    return (
      <p role="alert" className="mb-5 rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-sm font-medium text-ink">
        {error}
      </p>
    );
  }
  if (typeof notice === "string") {
    return (
      <p role="status" className="mb-5 rounded-lg border border-teal/40 bg-teal/10 px-4 py-3 text-sm font-medium text-ink">
        {notice}
      </p>
    );
  }
  return null;
}

const GOOD = ["PAID", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];
const WAITING = ["PAYMENT_INITIATED", "REFUND_PENDING"];

export function StatusBadge({ status }: { status: PaymentStatus | OrderStatus }) {
  const tone = GOOD.includes(status)
    ? "bg-teal/15 text-[#00686a]"
    : WAITING.includes(status)
      ? "bg-[#fff1c2] text-[#6b5200]"
      : status === "PENDING"
        ? "bg-cream text-ink-soft"
        : "bg-coral/15 text-[#9c3324]";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function formatAdminDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

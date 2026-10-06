"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import UpiPaymentPanel from "@/components/prebooking/UpiPaymentPanel";
import type { UpiPaymentDetails } from "@/lib/prebooking/upi";

const buttonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-coral px-6 py-4 text-base font-bold text-white transition hover:bg-teal active:scale-95 disabled:opacity-70 sm:w-auto";

/** Re-reads the order from the server and re-renders the page with whatever status it now has. */
export function CheckStatusButton({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function check() {
    setChecking(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/prebooking/orders/${orderNumber}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? "Could not check the status. Please try again.");
      } else if (data.order?.paymentStatus === "PAYMENT_INITIATED") {
        setMessage("Still being verified. We will email you as soon as it is confirmed.");
      } else {
        router.refresh();
      }
    } catch {
      setMessage("Network problem. Please check your connection and try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={check} disabled={checking} className={buttonClass}>
        {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
        Check Payment Status
      </button>
      {message && (
        <p role="status" className="mt-3 text-sm text-ink-soft">
          {message}
        </p>
      )}
    </div>
  );
}

/** "Try Payment Again" for a failed order: pays against the same order, never a new one. */
export function RetryPayment(props: {
  orderNumber: string;
  amountPaise: number;
  clientToken: string;
  upi: UpiPaymentDetails;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        Try Payment Again
      </button>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-white p-5 text-left sm:p-6">
      <UpiPaymentPanel {...props} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { formatInr } from "@/lib/prebooking/pricing";
import type { UpiPaymentDetails } from "@/lib/prebooking/upi";

/**
 * Step 3: pay the exact order amount to the Zaurabhya UPI ID, then report the
 * UPI reference. Submitting it does not confirm the order; it is confirmed
 * only after the payment has been verified.
 */
export default function UpiPaymentPanel({
  orderNumber,
  amountPaise,
  clientToken,
  upi,
  onSubmitted,
}: {
  orderNumber: string;
  amountPaise: number;
  clientToken: string;
  upi: UpiPaymentDetails;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{12}$/.test(reference)) {
      setError("Enter the 12-digit UPI reference (UTR) shown in your UPI app after paying.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/prebooking/orders/${orderNumber}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientToken, reference }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not submit your payment reference. Please try again.");
        setSubmitting(false);
        return;
      }
      onSubmitted?.();
      router.push(`/order-confirmation/${orderNumber}?t=${clientToken}`);
      router.refresh();
    } catch {
      setError("Network problem. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-teal" />
        <h3 className="font-heading text-xl font-bold text-ink">Secure Payment</h3>
      </div>

      <dl className="mt-4 space-y-2 rounded-xl bg-cream p-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-ink-soft">Order Number</dt>
          <dd className="font-semibold text-ink">{orderNumber}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-soft">Payment Method</dt>
          <dd className="font-semibold text-ink">Paytm UPI</dd>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <dt className="font-bold text-ink">Order Amount</dt>
          <dd className="text-2xl font-bold text-ink">{formatInr(amountPaise)}</dd>
        </div>
      </dl>

      <div className="mt-5 grid gap-5 sm:grid-cols-[220px_1fr] sm:items-start">
        <div className="mx-auto w-full max-w-[220px]">
          <div
            role="img"
            aria-label={`UPI QR code to pay ${formatInr(amountPaise)} to ${upi.payeeName}`}
            className="rounded-2xl border border-border bg-white p-3 [&>svg]:h-auto [&>svg]:w-full"
            // SVG generated on our server by the qrcode library from the UPI link.
            dangerouslySetInnerHTML={{ __html: upi.qrSvg }}
          />
          <p className="mt-2 text-center text-xs text-ink-muted">
            Scan with Paytm, PhonePe, Google Pay, BHIM or any UPI app
          </p>
        </div>

        <div className="text-sm text-ink-soft">
          <p>
            Paying to <span className="font-bold text-ink">{upi.payeeName}</span>
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2">
            <span className="break-all font-mono text-sm font-semibold text-ink">{upi.vpa}</span>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard?.writeText(upi.vpa).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex shrink-0 items-center gap-1 text-xs font-bold text-teal"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <a
            href={upi.link}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-teal py-3.5 text-base font-bold text-teal-foreground transition active:scale-95 md:hidden"
          >
            <Smartphone className="h-5 w-5" />
            Pay {formatInr(amountPaise)} in UPI app
          </a>

          <ol className="mt-4 list-decimal space-y-1.5 pl-5">
            <li>
              Scan the QR code (or tap the button on your phone). The amount{" "}
              <span className="font-semibold text-ink">{formatInr(amountPaise)}</span> and your
              order number are filled in for you.
            </li>
            <li>
              Check the name shows <span className="font-semibold text-ink">{upi.payeeName}</span>,
              then complete the payment.
            </li>
            <li>Enter the 12-digit UPI reference (UTR) from your payment receipt below.</li>
          </ol>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 border-t border-border pt-5" noValidate>
        <label htmlFor="upi-reference" className="mb-1 block text-sm font-medium text-ink-soft">
          UPI Reference / UTR Number *
        </label>
        <input
          id="upi-reference"
          inputMode="numeric"
          autoComplete="off"
          placeholder="12-digit number, e.g. 412345678901"
          value={reference}
          onChange={(event) => setReference(event.target.value.replace(/\D/g, "").slice(0, 12))}
          className={`w-full rounded-lg border bg-white px-4 py-3 text-base tracking-wider text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20 ${
            error ? "border-coral" : "border-border"
          }`}
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-coral">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-coral py-4 text-base font-bold text-white transition hover:bg-teal active:scale-95 disabled:opacity-70"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? "Submitting..." : "I Have Paid — Submit for Verification"}
        </button>
        <p className="mt-3 text-center text-xs text-ink-muted">
          Your pre-booking is confirmed only after we verify your payment. You will receive a
          confirmation email once it is verified. Cash on Delivery is not available.
        </p>
      </form>
    </div>
  );
}

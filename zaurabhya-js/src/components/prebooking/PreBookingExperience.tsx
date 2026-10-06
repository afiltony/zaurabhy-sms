"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, ExternalLink, Loader2, PackageCheck, Truck } from "lucide-react";
import TextField from "@/components/forms/TextField";
import SelectField from "@/components/forms/SelectField";
import QuantityStepper from "@/components/prebooking/QuantityStepper";
import UpiPaymentPanel from "@/components/prebooking/UpiPaymentPanel";
import { INDIAN_STATES } from "@/data/shipping";
import type { PublicPrebookingConfig } from "@/lib/prebooking/config";
import { formatInr, type Quote } from "@/lib/prebooking/pricing";
import type { PublicOrder } from "@/lib/prebooking/service";
import type { UpiPaymentDetails } from "@/lib/prebooking/upi";
import { customerDetailsSchema, type CustomerDetails } from "@/lib/prebooking/validation";
import type { z } from "zod";

type DetailsInput = z.input<typeof customerDetailsSchema>;
type Step = 0 | 1 | 2 | 3;
type Payment = { order: PublicOrder; upi: UpiPaymentDetails; clientToken: string };
type Saved = {
  clientToken: string;
  quantity: number;
  details: CustomerDetails | null;
  hasOrder: boolean;
};

// One in-progress pre-booking per product, each with its own token.
const storageKey = (productId: string) => `zaurabhya-prebooking:${productId}`;
const STEPS = ["Customer Details", "Order Summary", "Payment"];

// Secret that ties this browser to its order: the same token always maps to the
// same order on the server, so refreshes and resubmissions never duplicate it.
const tokens = new Map<string, string>();

function getToken(productId: string) {
  let token = tokens.get(productId);
  if (!token) {
    token =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
            byte.toString(16).padStart(2, "0"),
          ).join("");
    tokens.set(productId, token);
  }
  return token;
}

function readSaved(productId: string): Saved | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(productId));
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function writeSaved(productId: string, saved: Saved | null) {
  // A finished pre-booking must not share its token with the next one.
  if (!saved) tokens.delete(productId);
  try {
    if (saved) window.sessionStorage.setItem(storageKey(productId), JSON.stringify(saved));
    else window.sessionStorage.removeItem(storageKey(productId));
  } catch {
    // Private browsing without storage: the form still works, it just cannot survive a refresh.
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Network problem. Please check your connection and try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const issue = Array.isArray(data.issues) ? data.issues[0]?.message : null;
    throw new Error(issue ?? data.error ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "font-bold text-ink" : "text-ink-soft"}>{label}</dt>
      <dd className={strong ? "text-xl font-bold text-ink" : "font-semibold text-ink"}>{value}</dd>
    </div>
  );
}

export default function PreBookingExperience({
  config,
  gallery,
  amazonUrl,
}: {
  config: PublicPrebookingConfig;
  gallery: ReactNode;
  amazonUrl?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLElement>(null);

  const [step, setStep] = useState<Step>(0);
  const [quantity, setQuantity] = useState(config.minQuantityKg);
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DetailsInput, unknown, CustomerDetails>({
    resolver: zodResolver(customerDetailsSchema),
    defaultValues: { country: "India", addressLine2: "", gstNumber: "" },
  });

  const productAmountPaise = quantity * config.pricePerKgPaise;
  const footnote = `Minimum ${config.minQuantityKg} KG · ${formatInr(config.pricePerKgPaise)}/KG · Shipping charges additional · ${config.shippingMethod}`;

  function goToStep(next: Step) {
    setError(null);
    setStep(next);
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  async function placeOrder(orderDetails: CustomerDetails, quantityKg: number) {
    setBusy(true);
    setError(null);
    try {
      const token = getToken(config.productId);
      const result = await postJson<{ order: PublicOrder; upi: UpiPaymentDetails | null }>(
        "/api/prebooking/orders",
        { ...orderDetails, productId: config.productId, quantityKg, clientToken: token },
      );
      if (!result.upi) {
        // Already submitted for verification (or paid) in another tab: show its status instead.
        writeSaved(config.productId, null);
        router.push(`/order-confirmation/${result.order.orderNumber}?t=${token}`);
        return;
      }
      writeSaved(config.productId, {
        clientToken: token,
        quantity: quantityKg,
        details: orderDetails,
        hasOrder: true,
      });
      setPayment({ order: result.order, upi: result.upi, clientToken: token });
      goToStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Restore an in-progress pre-booking after a browser refresh, including one that
  // had already reached the payment step (the server returns the same order).
  useEffect(() => {
    const saved = readSaved(config.productId);
    if (!saved?.clientToken) return;
    tokens.set(config.productId, saved.clientToken);
    // One-time hydration from sessionStorage, which cannot be read during server rendering.
    /* eslint-disable react-hooks/set-state-in-effect */
    const savedQuantity = Math.min(
      config.maxQuantityKg,
      Math.max(config.minQuantityKg, Number(saved.quantity) || config.minQuantityKg),
    );
    setQuantity(savedQuantity);
    if (!saved.details) return;
    setDetails(saved.details);
    reset(saved.details);
    if (saved.hasOrder) {
      setStep(1);
      void placeOrder(saved.details, savedQuantity);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // Runs once on mount; placeOrder only uses stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function continueToSummary(values: CustomerDetails) {
    setBusy(true);
    setError(null);
    try {
      const nextQuote = await postJson<Quote>("/api/prebooking/quote", {
        productId: config.productId,
        quantityKg: quantity,
        state: values.state,
      });
      setDetails(values);
      setQuote(nextQuote);
      setConfirmed(false);
      writeSaved(config.productId, {
        clientToken: getToken(config.productId),
        quantity,
        details: values,
        hasOrder: false,
      });
      goToStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const primaryButton =
    "flex w-full items-center justify-center gap-2 rounded-full bg-coral py-4 text-base font-bold text-white transition hover:bg-teal active:scale-95 disabled:opacity-60";

  return (
    <>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        {gallery}

        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <p className="text-xs font-bold tracking-[0.2em] text-coral">PRE-BOOKING OPEN</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-ink">
              {config.shortName} Pre-Booking
            </h2>
            <p className="mt-3 text-3xl font-bold text-ink">
              {formatInr(config.pricePerKgPaise)}
              <span className="ml-1 text-base font-normal text-ink-muted">/ KG</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-teal">
              Minimum Order: {config.minQuantityKg} KG
            </p>
            <p className="mt-3 rounded-lg bg-cream px-3 py-2 text-sm font-semibold text-ink">
              Pre-booking price: {formatInr(config.pricePerKgPaise)} per KG + shipping charges
            </p>
            <p className="mt-3 text-sm text-ink-soft">Pre-book now directly from Zaurabhya.</p>

            <div className="mt-4">
              <span className="mb-2 block text-xs font-semibold text-ink-soft">Quantity</span>
              {step >= 2 ? (
                <p className="text-lg font-bold text-ink">{quantity} KG</p>
              ) : (
                <QuantityStepper
                  value={quantity}
                  onChange={setQuantity}
                  min={config.minQuantityKg}
                  max={config.maxQuantityKg}
                />
              )}
            </div>

            <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
              <SummaryRow label="Product Amount" value={formatInr(productAmountPaise)} />
              <SummaryRow label="Shipping" value="Calculated at checkout" />
            </dl>

            <button
              type="button"
              onClick={() => goToStep(step === 0 ? 1 : step)}
              className={`mt-5 ${primaryButton}`}
            >
              {step === 0 ? "Start Pre-Booking" : "Continue Pre-Booking"}
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-ink-muted">{footnote}</p>

            <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm text-ink-soft">
              <div className="flex items-start gap-2.5">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                <span>Dispatched by {config.shippingMethod.toLowerCase()} across India.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                <span>Sold by Zaurabhya, grown on our own farms.</span>
              </div>
            </div>
          </div>

          {amazonUrl && (
            <a
              href={amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-coral hover:text-coral"
            >
              <ExternalLink className="h-4 w-4" />
              Smaller packs available on Amazon
            </a>
          )}
        </div>
      </div>

      {step > 0 && (
        <section
          ref={formRef}
          id="prebooking-form"
          aria-label={`${config.shortName} pre-booking form`}
          className="mt-10 scroll-mt-32 rounded-2xl border border-border bg-white p-5 sm:p-8"
        >
          <ol className="flex items-center gap-1 sm:gap-2">
            {STEPS.map((label, index) => {
              const number = index + 1;
              const state = number === step ? "current" : number < step ? "done" : "todo";
              return (
                <li key={label} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
                  <div
                    aria-current={state === "current" ? "step" : undefined}
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded-full px-2 py-2 sm:px-3 ${
                      state === "current"
                        ? "bg-teal text-teal-foreground"
                        : state === "done"
                          ? "bg-teal/10 text-teal"
                          : "bg-cream text-ink-muted"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-ink">
                      {number}
                    </span>
                    <span className="truncate text-[11px] font-bold uppercase tracking-wide sm:text-xs">
                      {label}
                    </span>
                  </div>
                  {number < STEPS.length && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
                  )}
                </li>
              );
            })}
          </ol>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-sm font-medium text-ink"
            >
              {error}
            </p>
          )}

          {step === 1 && (
            <form
              onSubmit={(event) => void handleSubmit(continueToSummary)(event)}
              noValidate
              className="mt-6"
            >
              <h3 className="font-heading text-lg font-bold text-ink">Customer Information</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField
                    label="Full Name *"
                    autoComplete="name"
                    error={errors.fullName?.message}
                    {...register("fullName")}
                  />
                </div>
                <TextField
                  label="Mobile Number *"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
                <TextField
                  label="Email Address *"
                  type="email"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>

              <h3 className="mt-7 font-heading text-lg font-bold text-ink">Delivery Address</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField
                    label="Address Line 1 *"
                    autoComplete="address-line1"
                    error={errors.addressLine1?.message}
                    {...register("addressLine1")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextField
                    label="Address Line 2"
                    autoComplete="address-line2"
                    error={errors.addressLine2?.message}
                    {...register("addressLine2")}
                  />
                </div>
                <TextField
                  label="City *"
                  autoComplete="address-level2"
                  error={errors.city?.message}
                  {...register("city")}
                />
                <TextField
                  label="District *"
                  error={errors.district?.message}
                  {...register("district")}
                />
                <SelectField
                  label="State *"
                  options={INDIAN_STATES}
                  placeholder="Select state"
                  autoComplete="address-level1"
                  error={errors.state?.message}
                  {...register("state")}
                />
                <TextField
                  label="PIN Code *"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  error={errors.pincode?.message}
                  {...register("pincode")}
                />
                <TextField
                  label="Country"
                  readOnly
                  error={errors.country?.message}
                  {...register("country")}
                />
                <TextField
                  label="GST Number (optional)"
                  autoCapitalize="characters"
                  maxLength={15}
                  error={errors.gstNumber?.message}
                  {...register("gstNumber")}
                />
              </div>

              <h3 className="mt-7 font-heading text-lg font-bold text-ink">Quantity</h3>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div>
                  <label
                    htmlFor="prebooking-quantity"
                    className="mb-1 block text-sm font-medium text-ink-soft"
                  >
                    Order Quantity (KG) *
                  </label>
                  <QuantityStepper
                    id="prebooking-quantity"
                    value={quantity}
                    onChange={setQuantity}
                    min={config.minQuantityKg}
                    max={config.maxQuantityKg}
                  />
                </div>
                <div className="text-sm text-ink-soft" aria-live="polite">
                  <p>
                    Quantity: <span className="font-bold text-ink">{quantity} KG</span>
                  </p>
                  <p className="mt-1">
                    Product price: {quantity} × {formatInr(config.pricePerKgPaise)} ={" "}
                    <span className="text-lg font-bold text-ink">
                      {formatInr(productAmountPaise)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Minimum {config.minQuantityKg} KG, whole kilograms only. Shipping is added in
                    the next step.
                  </p>
                </div>
              </div>

              <button type="submit" disabled={busy} className={`mt-7 ${primaryButton}`}>
                {busy && <Loader2 className="h-5 w-5 animate-spin" />}
                Continue to Order Summary
              </button>
            </form>
          )}

          {step === 2 && details && quote && (
            <div className="mt-6">
              <h3 className="font-heading text-lg font-bold text-ink">Your Pre-Booking</h3>
              <dl className="mt-3 space-y-2.5 rounded-xl border border-border p-4 text-sm sm:p-5">
                <SummaryRow label="Product" value={config.productName} />
                <SummaryRow label="Quantity" value={`${quote.quantityKg} KG`} />
                <SummaryRow label="Price" value={`${formatInr(quote.pricePerKgPaise)} / KG`} />
                <SummaryRow label="Product Amount" value={formatInr(quote.productAmountPaise)} />
                <SummaryRow
                  label={`Shipping (${quote.shippingMethod})`}
                  value={formatInr(quote.shippingAmountPaise)}
                />
                {quote.taxAmountPaise > 0 && (
                  <SummaryRow
                    label={`GST (${quote.taxPercent}%)`}
                    value={formatInr(quote.taxAmountPaise)}
                  />
                )}
                <div className="border-t border-border pt-3">
                  <SummaryRow label="Grand Total" value={formatInr(quote.grandTotalPaise)} strong />
                </div>
              </dl>
              <p className="mt-3 text-sm text-ink-soft">
                Shipping charges are calculated separately and added to the product price.
              </p>

              <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-cream p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                    Deliver to
                  </p>
                  <p className="mt-1 font-semibold text-ink">{details.fullName}</p>
                  <p className="text-ink-soft">
                    {details.addressLine1}
                    {details.addressLine2 ? `, ${details.addressLine2}` : ""}
                    <br />
                    {details.city}, {details.district}
                    <br />
                    {details.state} - {details.pincode}, {details.country}
                  </p>
                  <p className="mt-1 text-ink-soft">
                    {details.phone} · {details.email}
                  </p>
                  {details.gstNumber && <p className="text-ink-soft">GST: {details.gstNumber}</p>}
                </div>
                <div className="rounded-xl bg-cream p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                    Delivery method
                  </p>
                  <p className="mt-1 font-semibold text-ink">{quote.shippingMethod}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink-muted">
                    Payment
                  </p>
                  <p className="mt-1 font-semibold text-ink">Paytm UPI (prepaid)</p>
                  <p className="text-ink-soft">Cash on Delivery is not available.</p>
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-teal"
                />
                I confirm that the above delivery details are correct.
              </label>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="rounded-full border-[1.5px] border-border px-6 py-4 text-base font-bold text-ink-soft transition hover:border-coral hover:text-coral"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!confirmed || busy}
                  onClick={() => placeOrder(details, quantity)}
                  className={primaryButton}
                >
                  {busy && <Loader2 className="h-5 w-5 animate-spin" />}
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {step === 3 && payment && (
            <div className="mt-6">
              <UpiPaymentPanel
                orderNumber={payment.order.orderNumber}
                amountPaise={payment.order.grandTotalPaise}
                clientToken={payment.clientToken}
                upi={payment.upi}
                onSubmitted={() => writeSaved(config.productId, null)}
              />
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="mt-4 w-full text-center text-sm font-semibold text-ink-muted underline-offset-2 hover:text-coral hover:underline"
              >
                Change quantity or delivery details
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}

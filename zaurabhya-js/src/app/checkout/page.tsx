"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextField from "@/components/forms/TextField";
import SelectField from "@/components/forms/SelectField";
import { useCart } from "@/lib/cart-context";
import { getProductBySlug, getVariant } from "@/data/products";
import { INDIAN_STATES, computeShipping } from "@/data/shipping";
import {
  checkoutFormSchema,
  paymentMethodOptions,
  type CheckoutInput,
} from "@/lib/validation";

type FormInput = Omit<CheckoutInput, "items">;
type Step = 1 | 2 | 3;

const PAYMENT_METHOD_LABELS: Record<(typeof paymentMethodOptions)[number], string> = {
  razorpay: "Pay Online (Cards/UPI)",
  payu: "PayU",
  cod: "Cash on Delivery",
};

const ADDRESS_FIELDS = [
  "fullName",
  "phone",
  "email",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "pincode",
] as const;

function StepHeader({
  step,
  title,
  active,
  onChange,
}: {
  step: number;
  title: string;
  active: boolean;
  onChange?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            active ? "bg-coral text-white" : "bg-border text-ink-muted"
          }`}
        >
          {step}
        </span>
        <h2 className="font-heading text-base font-bold text-ink">{title}</h2>
      </div>
      {onChange && (
        <button
          type="button"
          onClick={onChange}
          className="text-xs font-bold text-teal transition hover:underline"
        >
          Change
        </button>
      )}
    </div>
  );
}

function submitPayuForm(action: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [step, setStep] = useState<Step>(1);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { paymentMethod: "razorpay" },
  });

  const selectedState = useWatch({ control, name: "state" });
  const selectedPaymentMethod = useWatch({ control, name: "paymentMethod" });
  const isCod = selectedPaymentMethod === "cod";
  const shippingQuote = useMemo(
    () => (selectedState ? computeShipping(items, selectedState) : null),
    [items, selectedState],
  );
  const total = subtotal + (shippingQuote?.cost ?? 0);

  const goToPayment = async () => {
    if (await trigger(ADDRESS_FIELDS)) setStep(2);
  };

  const goToReview = async () => {
    const fields = isCod
      ? (["paymentMethod", "poBox", "confirmPhone"] as const)
      : (["paymentMethod"] as const);
    if (await trigger(fields)) setStep(3);
  };

  const onSubmit = async (shipping: FormInput) => {
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const createRes = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...shipping, items }),
      });
      const createData = await createRes.json().catch(() => null);

      if (!createData) {
        throw new Error("Something went wrong starting checkout. Please try again.");
      }

      if (!createRes.ok) {
        const detail = createData.issues?.[0]?.message;
        throw new Error(
          detail ? `${createData.error}: ${detail}` : createData.error ?? "Could not start checkout",
        );
      }

      if (!createData.configured) {
        setErrorMessage(
          createData.message ??
            "This payment method is not configured yet. Please contact us to complete your order.",
        );
        setStatus("error");
        return;
      }

      if (shipping.paymentMethod === "cod") {
        clear();
        router.push(`/order-confirmation/${createData.orderId}`);
        return;
      }

      if (shipping.paymentMethod === "payu") {
        submitPayuForm(createData.payu.action, createData.payu.fields);
        return;
      }

      if (!window.Razorpay) {
        throw new Error("Payment SDK failed to load. Please retry.");
      }

      const razorpay = new window.Razorpay({
        key: createData.keyId,
        amount: createData.amount * 100,
        currency: createData.currency,
        name: "ZAURABHYA",
        description: `Order ${createData.orderNumber}`,
        order_id: createData.razorpayOrderId,
        prefill: {
          name: shipping.fullName,
          email: shipping.email,
          contact: shipping.phone,
        },
        theme: { color: "#e26d5c" },
        handler: async (response) => {
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: createData.orderId, ...response }),
          });
          if (!verifyRes.ok) {
            setErrorMessage("Payment verification failed. Please contact us.");
            setStatus("error");
            return;
          }
          clear();
          router.push(`/order-confirmation/${createData.orderId}`);
        },
        modal: {
          ondismiss: () => setStatus("idle"),
        },
      });
      razorpay.open();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  if (items.length === 0) {
    return (
      <div className="px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-bold text-ink">
          Your cart is empty
        </h1>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-full bg-coral px-6 py-3 text-sm font-bold text-white transition hover:bg-teal"
        >
          Shop products
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-14 sm:px-6 lg:px-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="mx-auto max-w-4xl">
        <h1 className="font-heading text-3xl font-bold text-ink">Checkout</h1>

        <div className="mt-8 grid gap-8 sm:grid-cols-[1.3fr_1fr]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div
              className={`rounded-2xl border bg-white p-6 sm:p-7 ${
                step === 1 ? "border-coral" : "border-border"
              }`}
            >
              <StepHeader
                step={1}
                title="Delivery address"
                active={step >= 1}
                onChange={step > 1 ? () => setStep(1) : undefined}
              />

              {step === 1 ? (
                <div className="mt-4 space-y-3">
                  <TextField
                    label="Full Name"
                    {...register("fullName")}
                    error={errors.fullName?.message}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <TextField
                      label="Phone"
                      type="tel"
                      {...register("phone")}
                      error={errors.phone?.message}
                    />
                    <TextField
                      label="Email"
                      type="email"
                      {...register("email")}
                      error={errors.email?.message}
                    />
                  </div>
                  <TextField
                    label="Address Line 1"
                    {...register("addressLine1")}
                    error={errors.addressLine1?.message}
                  />
                  <TextField
                    label="Address Line 2 (optional)"
                    {...register("addressLine2")}
                    error={errors.addressLine2?.message}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <TextField
                      label="City"
                      {...register("city")}
                      error={errors.city?.message}
                    />
                    <SelectField
                      label="State"
                      options={INDIAN_STATES}
                      {...register("state")}
                      error={errors.state?.message}
                    />
                    <TextField
                      label="Pincode"
                      {...register("pincode")}
                      error={errors.pincode?.message}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={goToPayment}
                    className="mt-2 rounded-full bg-coral px-6 py-2.5 text-sm font-bold text-white transition hover:bg-teal"
                  >
                    Deliver to this address
                  </button>
                </div>
              ) : (
                <div className="mt-2 text-sm text-ink-soft">
                  <p className="font-semibold text-ink">{getValues("fullName")}</p>
                  <p>
                    {getValues("addressLine1")}
                    {getValues("addressLine2") ? `, ${getValues("addressLine2")}` : ""},{" "}
                    {getValues("city")}, {getValues("state")} {getValues("pincode")}
                  </p>
                  <p>
                    {getValues("phone")} &middot; {getValues("email")}
                  </p>
                </div>
              )}
            </div>

            <div
              className={`rounded-2xl border bg-white p-6 sm:p-7 ${
                step === 2 ? "border-coral" : "border-border"
              } ${step < 2 ? "opacity-50" : ""}`}
            >
              <StepHeader
                step={2}
                title="Payment method"
                active={step >= 2}
                onChange={step > 2 ? () => setStep(2) : undefined}
              />

              {step === 2 && (
                <div className="mt-4">
                  <fieldset>
                    <div className="flex flex-wrap gap-2">
                      {paymentMethodOptions.map((option) => (
                        <label
                          key={option}
                          className="cursor-pointer rounded-full border border-border px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft transition has-[:checked]:border-teal has-[:checked]:bg-teal has-[:checked]:text-teal-foreground"
                        >
                          <input
                            type="radio"
                            value={option}
                            {...register("paymentMethod")}
                            className="sr-only"
                          />
                          {PAYMENT_METHOD_LABELS[option]}
                        </label>
                      ))}
                    </div>
                    {errors.paymentMethod && (
                      <p className="mt-1 text-xs text-coral">
                        {errors.paymentMethod.message}
                      </p>
                    )}
                  </fieldset>

                  {isCod && (
                    <div className="mt-4 space-y-3 rounded-xl border border-border bg-cream/40 p-4">
                      <p className="text-xs font-semibold text-ink-soft">
                        Cash on Delivery details
                      </p>
                      <TextField
                        label="PO Box"
                        {...register("poBox")}
                        error={errors.poBox?.message}
                      />
                      <TextField
                        label="Re-enter Phone Number"
                        type="tel"
                        {...register("confirmPhone")}
                        error={errors.confirmPhone?.message}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={goToReview}
                    className="mt-4 rounded-full bg-coral px-6 py-2.5 text-sm font-bold text-white transition hover:bg-teal"
                  >
                    Use this payment method
                  </button>
                </div>
              )}

              {step > 2 && (
                <p className="mt-2 text-sm text-ink-soft">
                  {PAYMENT_METHOD_LABELS[getValues("paymentMethod")]}
                </p>
              )}
            </div>

            <div
              className={`rounded-2xl border bg-white p-6 sm:p-7 ${
                step === 3 ? "border-coral" : "border-border"
              } ${step < 3 ? "opacity-50" : ""}`}
            >
              <StepHeader step={3} title="Review items and place your order" active={step >= 3} />

              {step === 3 && (
                <div className="mt-4">
                  <p className="text-sm text-ink-muted">
                    Please review your delivery address and payment method above before
                    placing your order.
                  </p>

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="mt-4 w-full rounded-full bg-coral py-3.5 text-sm font-bold text-white transition hover:bg-teal disabled:opacity-60"
                  >
                    {status === "submitting" ? "Processing..." : `Place Order — ₹${total}`}
                  </button>

                  {status === "error" && errorMessage && (
                    <p className="mt-3 text-center text-sm font-medium text-coral">
                      {errorMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          </form>

          <div className="h-fit rounded-2xl border border-border bg-white p-6 sm:p-7">
            <h2 className="font-heading text-lg font-bold text-ink">
              Order summary
            </h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => {
                const product = getProductBySlug(item.slug);
                const variant = getVariant(item.slug, item.variantId);
                if (!product || !variant) return null;
                return (
                  <div
                    key={`${item.slug}-${item.variantId}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-ink-soft">
                      {product.name} ({variant.label}) &times; {item.quantity}
                    </span>
                    <span className="font-semibold text-ink">
                      &#8377;{variant.price * item.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-semibold text-ink">&#8377;{subtotal}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">
                  Shipping
                  {shippingQuote && (
                    <span className="block text-xs text-ink-muted">
                      {shippingQuote.courier} &middot; {shippingQuote.weightKg} kg
                    </span>
                  )}
                </span>
                <span className="font-semibold text-ink">
                  {shippingQuote ? `₹${shippingQuote.cost}` : "Enter state"}
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-bold text-ink">Total</span>
              <span className="text-lg font-bold text-ink">&#8377;{total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

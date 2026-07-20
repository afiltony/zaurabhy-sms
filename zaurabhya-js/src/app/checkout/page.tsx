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
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";

type FormInput = Omit<CheckoutInput, "items">;

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(checkoutSchema.omit({ items: true })),
  });

  const selectedState = useWatch({ control, name: "state" });
  const shippingQuote = useMemo(
    () => (selectedState ? computeShipping(items, selectedState) : null),
    [items, selectedState],
  );
  const total = subtotal + (shippingQuote?.cost ?? 0);

  const onSubmit = async (shipping: FormInput) => {
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const createRes = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...shipping, items }),
      });
      const createData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createData.error ?? "Could not start checkout");
      }

      if (!createData.configured) {
        setErrorMessage(
          createData.message ??
            "Online payments are not configured yet. Please contact us to complete your order.",
        );
        setStatus("error");
        return;
      }

      if (!scriptReady || !window.Razorpay) {
        throw new Error("Payment SDK failed to load. Please retry.");
      }

      const razorpay = new window.Razorpay({
        key: createData.keyId,
        amount: createData.amount * 100,
        currency: createData.currency,
        name: "ZAURABHYA",
        description: "Order payment",
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
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />
      <div className="mx-auto max-w-4xl">
        <h1 className="font-heading text-3xl font-bold text-ink">Checkout</h1>

        <div className="mt-8 grid gap-8 sm:grid-cols-[1.3fr_1fr]">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl border border-border bg-white p-6 sm:p-7"
            noValidate
          >
            <h2 className="font-heading text-lg font-bold text-ink">
              Shipping details
            </h2>
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
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-6 w-full rounded-full bg-coral py-3.5 text-sm font-bold text-white transition hover:bg-teal disabled:opacity-60"
            >
              {status === "submitting" ? "Processing..." : `Pay ₹${total}`}
            </button>

            {status === "error" && errorMessage && (
              <p className="mt-3 text-center text-sm font-medium text-coral">
                {errorMessage}
              </p>
            )}
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

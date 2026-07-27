"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, PackageCheck, ShieldCheck, Truck, CheckCircle2, Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { ProductVariant } from "@/data/products";

export default function ProductPurchasePanel({
  slug,
  variants,
}: {
  slug: string;
  variants: ProductVariant[];
}) {
  const [variantId, setVariantId] = useState(variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  const selectedVariant = variants.find((v) => v.id === variantId) ?? variants[0];

  return (
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <p className="text-3xl font-bold text-ink">
        &#8377;{selectedVariant.price}
        <span className="ml-1 text-base font-normal text-ink-muted">
          / {selectedVariant.label}
        </span>
      </p>
      <p className="mt-1 text-sm font-semibold text-teal">In stock</p>

      <fieldset className="mt-4">
        <legend className="mb-2 block text-xs font-semibold text-ink-soft">
          Pack size
        </legend>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <label
              key={variant.id}
              className="cursor-pointer rounded-full border border-border px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft transition has-[:checked]:border-teal has-[:checked]:bg-teal has-[:checked]:text-teal-foreground"
            >
              <input
                type="radio"
                name={`${slug}-variant`}
                value={variant.id}
                checked={variantId === variant.id}
                onChange={() => setVariantId(variant.id)}
                className="sr-only"
              />
              {variant.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <span className="mb-2 block text-xs font-semibold text-ink-soft">
          Quantity
        </span>
        <div className="inline-flex items-center rounded-full border border-border">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-2.5 text-ink-soft transition hover:text-coral"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-bold text-ink">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => q + 1)}
            className="p-2.5 text-ink-soft transition hover:text-coral"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          disabled={buying}
          onClick={() => {
            addItem(slug, variantId, quantity);
            setBuying(true);
            setTimeout(() => router.push("/checkout"), 200);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-coral py-3 text-sm font-bold text-white transition-[background-color,transform] duration-150 hover:bg-teal active:scale-95 disabled:opacity-80"
        >
          {buying ? (
            <span className="flex items-center gap-1.5 animate-pop-in">
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </span>
          ) : (
            "Buy Now"
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            addItem(slug, variantId, quantity);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-coral py-3 text-sm font-bold text-coral transition-[background-color,color,transform] duration-150 hover:bg-coral hover:text-white active:scale-95"
        >
          {added ? (
            <span className="flex items-center gap-1.5 animate-pop-in">
              <CheckCircle2 className="h-4 w-4" />
              Added to cart
            </span>
          ) : (
            "Add to cart"
          )}
        </button>
      </div>

      <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm text-ink-soft">
        <div className="flex items-start gap-2.5">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
          <span>Fast dispatch, delivered pan-India. Cash on Delivery available.</span>
        </div>
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
          <span>Secure checkout with online payment or COD.</span>
        </div>
        <div className="flex items-start gap-2.5">
          <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
          <span>Sold by Zaurabhya, grown on our own farms.</span>
        </div>
      </div>
    </div>
  );
}

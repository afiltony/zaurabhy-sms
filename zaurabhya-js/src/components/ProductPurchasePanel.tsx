"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
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
  const { addItem } = useCart();
  const router = useRouter();

  const selectedVariant = variants.find((v) => v.id === variantId) ?? variants[0];

  return (
    <div className="mt-6">
      <p className="text-2xl font-bold text-ink">
        &#8377;{selectedVariant.price}
        <span className="ml-1 text-base font-normal text-ink-muted">
          / {selectedVariant.label}
        </span>
      </p>

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

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-border">
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

        <button
          type="button"
          onClick={() => addItem(slug, variantId, quantity)}
          className="rounded-full border-[1.5px] border-coral px-6 py-2.5 text-sm font-bold text-coral transition hover:bg-coral hover:text-white"
        >
          Add to cart
        </button>

        <button
          type="button"
          onClick={() => {
            addItem(slug, variantId, quantity);
            router.push("/checkout");
          }}
          className="rounded-full bg-coral px-6 py-2.5 text-sm font-bold text-white transition hover:bg-teal"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}

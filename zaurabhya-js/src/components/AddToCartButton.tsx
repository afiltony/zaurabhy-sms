"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function AddToCartButton({
  slug,
  variantId,
  quantity = 1,
  className,
  label = "Add to cart",
}: {
  slug: string;
  variantId: string;
  quantity?: number;
  className?: string;
  label?: string;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        addItem(slug, variantId, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className={
        className ??
        "rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal"
      }
    >
      {added ? (
        <span className="flex items-center justify-center gap-1.5">
          <CheckCircle2 className="h-4 w-4" />
          Added
        </span>
      ) : (
        label
      )}
    </button>
  );
}

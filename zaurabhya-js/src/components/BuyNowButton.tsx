"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function BuyNowButton({
  slug,
  variantId,
  quantity = 1,
  className,
  label = "Buy Now",
}: {
  slug: string;
  variantId: string;
  quantity?: number;
  className?: string;
  label?: string;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [buying, setBuying] = useState(false);

  return (
    <button
      type="button"
      disabled={buying}
      onClick={() => {
        addItem(slug, variantId, quantity);
        setBuying(true);
        setTimeout(() => router.push("/checkout"), 200);
      }}
      className={
        (className ??
          "rounded-full border-[1.5px] border-coral px-5 py-2.5 text-sm font-bold text-coral transition hover:bg-coral hover:text-white") +
        " transition-transform duration-150 active:scale-95 disabled:opacity-80"
      }
    >
      {buying ? (
        <span className="flex items-center justify-center gap-1.5 animate-pop-in">
          <Loader2 className="h-4 w-4 animate-spin" />
          Adding...
        </span>
      ) : (
        label
      )}
    </button>
  );
}

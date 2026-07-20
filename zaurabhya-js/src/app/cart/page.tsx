"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { getProductBySlug, getVariant } from "@/data/products";

export default function CartPage() {
  const { items, setQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-bold text-ink">
          Your cart is empty
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Add some Kerala rice or tamarind to get started.
        </p>
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
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-ink">Your Cart</h1>

        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-white">
          {items.map((item) => {
            const product = getProductBySlug(item.slug);
            const variant = getVariant(item.slug, item.variantId);
            if (!product || !variant) return null;
            return (
              <div
                key={`${item.slug}-${item.variantId}`}
                className="flex items-center gap-4 p-5"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-white"
                >
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundColor: "#e7e0d1",
                        backgroundImage:
                          "repeating-linear-gradient(135deg, rgba(34,87,122,.06), rgba(34,87,122,.06) 6px, rgba(34,87,122,.11) 6px, rgba(34,87,122,.11) 12px)",
                      }}
                    />
                  )}
                </Link>

                <div className="flex-1">
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-heading text-base font-bold text-ink hover:text-coral"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm text-ink-muted">
                    {variant.label} &middot; &#8377;{variant.price}
                  </p>
                </div>

                <div className="flex items-center rounded-full border border-border">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() =>
                      setQuantity(item.slug, item.variantId, item.quantity - 1)
                    }
                    className="p-2 text-ink-soft transition hover:text-coral"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-ink">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() =>
                      setQuantity(item.slug, item.variantId, item.quantity + 1)
                    }
                    className="p-2 text-ink-soft transition hover:text-coral"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="w-20 text-right text-sm font-bold text-ink">
                  &#8377;{variant.price * item.quantity}
                </p>

                <button
                  type="button"
                  aria-label={`Remove ${product.name}`}
                  onClick={() => removeItem(item.slug, item.variantId)}
                  className="text-ink-muted transition hover:text-coral"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-white p-5">
          <span className="text-sm font-semibold text-ink-soft">Subtotal</span>
          <span className="text-xl font-bold text-ink">&#8377;{subtotal}</span>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/products"
            className="text-sm font-semibold text-ink-muted transition hover:text-coral"
          >
            &larr; Continue shopping
          </Link>
          <Link
            href="/checkout"
            className="rounded-full bg-coral px-8 py-3.5 text-sm font-bold text-white transition hover:bg-teal"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}

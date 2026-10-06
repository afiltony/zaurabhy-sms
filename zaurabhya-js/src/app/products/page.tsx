import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import ProductCardPurchase from "@/components/ProductCardPurchase";
import { PRODUCTS } from "@/data/products";
import { getSettingsForDisplay } from "@/lib/prebooking/server";
import { withSiteKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop premium Kerala rice varieties and Malabar tamarind, direct from our own farms.",
  keywords: withSiteKeywords("buy Kerala rice online", "shop Kerala rice and tamarind"),
};

// Picks up pre-booking price changes made in /admin/settings.
export const revalidate = 300;

export default async function ProductsPage() {
  const preBookingSettings = await getSettingsForDisplay();

  return (
    <div className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 text-center">
          <p className="mb-2.5 text-xs font-bold tracking-[0.2em] text-coral">
            SHOP
          </p>
          <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
            Two staples, one source
          </h1>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((product) => (
            <article
              key={product.slug}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white"
            >
              <Link href={`/products/${product.slug}`}>
                {product.image ? (
                  <div className="relative h-44 bg-white">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-contain p-3"
                    />
                  </div>
                ) : (
                  <PhotoPlaceholder caption={product.caption} className="h-44" />
                )}
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <Link href={`/products/${product.slug}`}>
                  <h2 className="font-heading text-xl font-bold text-ink">
                    {product.name}
                  </h2>
                </Link>
                <p className="mt-2 flex-1 text-sm text-ink-muted">
                  {product.description}
                </p>
                <ProductCardPurchase
                  product={product}
                  preBookingSettings={preBookingSettings}
                  layout="row"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

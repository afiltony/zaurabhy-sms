import Image from "next/image";
import Link from "next/link";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import ProductCardPurchase from "@/components/ProductCardPurchase";
import { PRODUCTS } from "@/data/products";
import { getSettingsForDisplay } from "@/lib/prebooking/server";

export default async function Products() {
  const preBookingSettings = await getSettingsForDisplay();

  return (
    <section id="products" className="px-4 pb-5 pt-11 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 text-center">
          <p className="mb-2.5 text-xs font-bold tracking-[0.2em] text-coral">
            OUR PREMIUM PRODUCTS
          </p>
          <h2 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
            Two staples, one source
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-5">
          {PRODUCTS.map((product) => (
            <article
              key={product.slug}
              className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-white sm:w-[calc(50%-0.625rem)]"
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
                  <h3 className="font-heading text-xl font-bold text-ink">
                    {product.name}
                  </h3>
                </Link>
                <p className="mt-2 flex-1 text-sm text-ink-muted">
                  {product.description}
                </p>
                <ProductCardPurchase
                  product={product}
                  preBookingSettings={preBookingSettings}
                  layout="stack"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

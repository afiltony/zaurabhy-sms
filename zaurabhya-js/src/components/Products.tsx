import Image from "next/image";
import Link from "next/link";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import AddToCartButton from "@/components/AddToCartButton";
import BuyNowButton from "@/components/BuyNowButton";
import { PRODUCTS, getDefaultVariant, getLowestPrice } from "@/data/products";

export default function Products() {
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
                <p className="mt-3 text-sm font-bold text-ink">
                  From &#8377;{getLowestPrice(product)}
                  <span className="font-normal text-ink-muted">
                    {" "}
                    / {getDefaultVariant(product).label}
                  </span>
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <BuyNowButton
                    slug={product.slug}
                    variantId={getDefaultVariant(product).id}
                    className="w-full rounded-full bg-coral px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-teal"
                  />
                  <AddToCartButton
                    slug={product.slug}
                    variantId={getDefaultVariant(product).id}
                    className="w-full rounded-full border-[1.5px] border-coral px-4 py-2.5 text-center text-sm font-bold text-coral transition hover:bg-coral hover:text-white"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

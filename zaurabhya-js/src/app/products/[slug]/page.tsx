import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import PreBookingExperience from "@/components/prebooking/PreBookingExperience";
import { PRODUCTS, getProductBySlug, getLowestPrice } from "@/data/products";
import { isPrebookingProductId, toPublicConfig } from "@/lib/prebooking/config";
import { getSettingsForDisplay } from "@/lib/prebooking/server";
import { withSiteKeywords, SITE_URL } from "@/lib/seo";

// Lets a pre-booking price change made in /admin/settings reach this page
// (saving the settings also revalidates it immediately).
export const revalidate = 300;

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) return {};

  if (product.preBooking) {
    const name = product.name.toLowerCase();
    return {
      title: `${product.name} Pre-Booking`,
      description: `Premium Zaurabhya ${product.name} — pre-book directly from our farm. ${product.description}`,
      keywords: withSiteKeywords(...product.keywords, `${name} pre-booking`, `bulk ${name}`),
    };
  }

  return {
    title: product.name,
    description: product.description,
    keywords: withSiteKeywords(...product.keywords),
  };
}

export default async function ProductPage(
  props: PageProps<"/products/[slug]">,
) {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const preBookingConfig =
    product.preBooking && isPrebookingProductId(product.slug)
      ? toPublicConfig(await getSettingsForDisplay(), product.slug)
      : null;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.longDescription,
    image: product.images.filter((src): src is string => Boolean(src)),
    brand: { "@type": "Brand", name: "ZAURABHYA" },
    url: `${SITE_URL}/products/${product.slug}`,
    offers: preBookingConfig
      ? {
          "@type": "Offer",
          priceCurrency: "INR",
          price: preBookingConfig.pricePerKgPaise / 100,
          availability: "https://schema.org/PreOrder",
          eligibleQuantity: {
            "@type": "QuantitativeValue",
            minValue: preBookingConfig.minQuantityKg,
            unitCode: "KGM",
          },
        }
      : {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          lowPrice: getLowestPrice(product),
          offerCount: product.variants.length,
          availability: "https://schema.org/InStock",
        },
  };

  const gallery = (
    <ProductGallery images={product.images} name={product.name} caption={product.caption} />
  );

  return (
    <div className="px-4 py-14 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="mx-auto max-w-5xl">
        <Link
          href="/products"
          className="text-sm font-semibold text-ink-muted transition hover:text-coral"
        >
          &larr; Back to shop
        </Link>

        {preBookingConfig ? (
          <>
            <h1 className="mt-5 font-heading text-3xl font-bold text-ink sm:text-4xl">
              {product.name} Pre-Booking
            </h1>
            <p className="mt-2 text-base text-ink-muted">
              Premium Zaurabhya {product.name} — Pre-book directly from our farm
            </p>
            <PreBookingExperience
              config={preBookingConfig}
              gallery={gallery}
              amazonUrl={product.amazonUrl}
            />
          </>
        ) : (
          <>
            <h1 className="mt-5 font-heading text-3xl font-bold text-ink sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
              {gallery}

              <div className="lg:sticky lg:top-24">
                <ProductPurchasePanel slug={product.slug} variants={product.variants} />

                {product.amazonUrl && (
                  <a
                    href={product.amazonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-coral hover:text-coral"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Available on Amazon
                  </a>
                )}
              </div>
            </div>
          </>
        )}

        <div className="mt-10 max-w-2xl">
          <h2 className="font-heading text-lg font-bold text-ink">
            About this item
          </h2>
          <ul className="mt-3 space-y-2">
            {product.highlights.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                {point}
              </li>
            ))}
          </ul>

          <h2 className="mt-8 font-heading text-lg font-bold text-ink">
            Product description
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            {product.longDescription}
          </p>
        </div>
      </div>
    </div>
  );
}

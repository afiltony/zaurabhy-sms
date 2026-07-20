import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import { PRODUCTS, getProductBySlug } from "@/data/products";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage(
  props: PageProps<"/products/[slug]">,
) {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/products"
          className="text-sm font-semibold text-ink-muted transition hover:text-coral"
        >
          &larr; Back to shop
        </Link>

        <div className="mt-5">
          <ProductGallery
            images={product.images}
            name={product.name}
            caption={product.caption}
          />

          <h1 className="mt-8 font-heading text-3xl font-bold text-ink sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            {product.longDescription}
          </p>

          <ProductPurchasePanel slug={product.slug} variants={product.variants} />
        </div>
      </div>
    </div>
  );
}

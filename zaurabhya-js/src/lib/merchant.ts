import { PRODUCTS, type Product } from "@/data/products";
import { INDIAN_STATES } from "@/data/shipping";
import {
  PREBOOKING_PRODUCTS,
  isPrebookingProductId,
  type PrebookingSettings,
} from "@/lib/prebooking/config";
import { computeQuote } from "@/lib/prebooking/pricing";
import { SITE_URL } from "@/lib/seo";

/**
 * One product as Google Shopping needs to see it. Shared by the product page's
 * structured data and the Merchant Center feed so the two can never disagree.
 *
 * Google lists the smallest order a shopper can actually place, so the price
 * is the minimum pre-booking quantity (tax included), not the per-KG rate.
 */
export type MerchantListing = {
  id: string;
  title: string;
  description: string;
  url: string;
  images: string[];
  productType: string;
  minQuantityKg: number;
  /** Price of the minimum quantity, tax included. */
  pricePaise: number;
  /** Highest shipping charge for the minimum quantity anywhere in India, tax included. */
  shippingPaise: number;
};

/** Google accepts an overstated shipping cost but not an understated one, so quote the dearest state. */
function highestShippingPaise(
  settings: PrebookingSettings,
  productId: keyof typeof PREBOOKING_PRODUCTS,
  quantityKg: number,
) {
  return Math.max(
    ...INDIAN_STATES.map(
      (state) => computeQuote(settings, productId, quantityKg, state).shippingAmountPaise,
    ),
  );
}

export function toMerchantListing(
  product: Product,
  settings: PrebookingSettings,
): MerchantListing | null {
  if (!product.preBooking || !isPrebookingProductId(product.slug)) return null;

  const { minQuantityKg, pricePerKgPaise } = settings.products[product.slug];
  const withTax = (paise: number) => Math.round(paise * (1 + settings.taxPercent / 100));

  return {
    id: product.slug,
    title: `${PREBOOKING_PRODUCTS[product.slug].name} - ${minQuantityKg} kg`,
    description: product.longDescription,
    url: `${SITE_URL}/products/${product.slug}`,
    images: product.images
      .filter((src): src is string => Boolean(src))
      .map((src) => `${SITE_URL}${src}`),
    productType: product.slug.includes("rice") ? "Food > Rice" : "Food > Spices & Seasonings",
    minQuantityKg,
    pricePaise: withTax(minQuantityKg * pricePerKgPaise),
    shippingPaise: withTax(highestShippingPaise(settings, product.slug, minQuantityKg)),
  };
}

export function getMerchantListings(settings: PrebookingSettings): MerchantListing[] {
  return PRODUCTS.map((product) => toMerchantListing(product, settings)).filter(
    (listing): listing is MerchantListing => listing !== null,
  );
}

/** "950.00" - the plain decimal format both schema.org and Merchant Center expect. */
export function paiseToDecimal(paise: number): string {
  return (paise / 100).toFixed(2);
}

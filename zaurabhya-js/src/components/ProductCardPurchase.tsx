import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import BuyNowButton from "@/components/BuyNowButton";
import { getDefaultVariant, getLowestPrice, type Product } from "@/data/products";
import { isPrebookingProductId, type PrebookingSettings } from "@/lib/prebooking/config";
import { formatInr } from "@/lib/prebooking/pricing";

/**
 * Price line and call-to-action for a product card. Pre-booking products link
 * to their pre-booking page instead of offering Buy Now / Add to cart.
 */
export default function ProductCardPurchase({
  product,
  preBookingSettings,
  layout,
}: {
  product: Product;
  preBookingSettings: PrebookingSettings;
  layout: "stack" | "row";
}) {
  if (product.preBooking && isPrebookingProductId(product.slug)) {
    const preBookingConfig = preBookingSettings.products[product.slug];
    return (
      <>
        <p className="mt-3 text-sm font-bold text-ink">
          {formatInr(preBookingConfig.pricePerKgPaise)}
          <span className="font-normal text-ink-muted">
            {" "}
            / KG &middot; Pre-booking, min. {preBookingConfig.minQuantityKg} KG
          </span>
        </p>
        <div className="mt-4">
          <Link
            href={`/products/${product.slug}`}
            className="block w-full rounded-full bg-coral px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-teal"
          >
            Pre-Book Now
          </Link>
        </div>
      </>
    );
  }

  const width = layout === "stack" ? "w-full" : "flex-1";
  return (
    <>
      <p className="mt-3 text-sm font-bold text-ink">
        From &#8377;{getLowestPrice(product)}
        <span className="font-normal text-ink-muted">
          {" "}
          / {getDefaultVariant(product).label}
        </span>
      </p>
      <div className={`mt-4 flex gap-2 ${layout === "stack" ? "flex-col" : "items-center"}`}>
        <BuyNowButton
          slug={product.slug}
          variantId={getDefaultVariant(product).id}
          className={`${width} rounded-full bg-coral px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-teal`}
        />
        <AddToCartButton
          slug={product.slug}
          variantId={getDefaultVariant(product).id}
          className={`${width} rounded-full border-[1.5px] border-coral px-4 py-2.5 text-center text-sm font-bold text-coral transition hover:bg-coral hover:text-white`}
        />
      </div>
    </>
  );
}

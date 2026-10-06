import { getVariant, isPreBookingProduct } from "@/data/products";
import { computeShipping } from "@/data/shipping";
import type { CheckoutInput } from "@/lib/validation";

export type OrderPricing = {
  itemsSubtotal: number;
  shippingCost: number;
  courier: string;
  amount: number;
};

export function resolveOrderPricing(
  items: CheckoutInput["items"],
  state: CheckoutInput["state"],
): OrderPricing | { error: string } {
  let itemsSubtotal = 0;
  for (const item of items) {
    if (isPreBookingProduct(item.slug)) {
      return { error: "This product is available by pre-booking only" };
    }
    const variant = getVariant(item.slug, item.variantId);
    if (!variant) {
      return { error: `Unknown product variant: ${item.slug} / ${item.variantId}` };
    }
    itemsSubtotal += variant.price * item.quantity;
  }

  const shippingQuote = computeShipping(items, state);
  if (!shippingQuote) {
    return { error: "Could not calculate shipping" };
  }

  return {
    itemsSubtotal,
    shippingCost: shippingQuote.cost,
    courier: shippingQuote.courier,
    amount: itemsSubtotal + shippingQuote.cost,
  };
}

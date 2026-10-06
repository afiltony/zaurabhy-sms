import { getShippingZone } from "@/data/shipping";
import type {
  PrebookingProductId,
  PrebookingSettings,
  ShippingSettings,
} from "@/lib/prebooking/config";

/** Indian grouping, with paise shown only when there are any: 95000 -> "₹950", 475050 -> "₹4,750.50". */
export function formatInr(paise: number): string {
  const digits = paise % 100 === 0 ? 0 : 2;
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function computeProductAmountPaise(quantityKg: number, pricePerKgPaise: number): number {
  return quantityKg * pricePerKgPaise;
}

export function computeShippingPaise(
  shipping: ShippingSettings,
  quantityKg: number,
  state: string,
): number {
  if (!shipping.enabled) return 0;

  switch (shipping.calculationType) {
    case "flat":
      return shipping.flatChargePaise;
    case "weight":
      return shipping.basePaise + quantityKg * shipping.perKgPaise;
    case "state": {
      const rate = shipping.stateRates[state] ?? shipping.zoneRates[getShippingZone(state)];
      return rate.basePaise + quantityKg * rate.perKgPaise;
    }
  }
}

export type Quote = {
  quantityKg: number;
  pricePerKgPaise: number;
  productAmountPaise: number;
  shippingAmountPaise: number;
  taxAmountPaise: number;
  taxPercent: number;
  discountAmountPaise: number;
  grandTotalPaise: number;
  shippingMethod: string;
};

/** The single place a pre-booking total is calculated. Only ever trusted when run on the server. */
export function computeQuote(
  settings: PrebookingSettings,
  productId: PrebookingProductId,
  quantityKg: number,
  state: string,
): Quote {
  const { pricePerKgPaise } = settings.products[productId];
  const productAmountPaise = computeProductAmountPaise(quantityKg, pricePerKgPaise);
  const shippingAmountPaise = computeShippingPaise(settings.shipping, quantityKg, state);
  const taxAmountPaise = Math.round(
    ((productAmountPaise + shippingAmountPaise) * settings.taxPercent) / 100,
  );

  return {
    quantityKg,
    pricePerKgPaise,
    productAmountPaise,
    shippingAmountPaise,
    taxAmountPaise,
    taxPercent: settings.taxPercent,
    discountAmountPaise: 0,
    grandTotalPaise: productAmountPaise + shippingAmountPaise + taxAmountPaise,
    shippingMethod: settings.shippingMethod,
  };
}

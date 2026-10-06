import type { ShippingZone } from "@/data/shipping";

/**
 * Central configuration for the product pre-booking flow. These are only the
 * defaults: the live values are stored in the database and edited from
 * /admin/settings. All money is held in paise (integers) to avoid float drift.
 */

/**
 * Products sold by pre-booking. The key is the product slug in src/data/products.ts
 * (which must also carry `preBooking: true`); orderPrefix starts its order numbers.
 */
export const PREBOOKING_PRODUCTS = {
  "dosa-rice": {
    id: "dosa-rice",
    name: "Zaurabhya Dosa Rice",
    shortName: "Dosa Rice",
    orderPrefix: "ZR-DR",
  },
  "malabar-tamarind": {
    id: "malabar-tamarind",
    name: "Zaurabhya Malabar Tamarind",
    shortName: "Malabar Tamarind",
    orderPrefix: "ZR-MT",
  },
} as const;

export type PrebookingProductId = keyof typeof PREBOOKING_PRODUCTS;
export const PREBOOKING_PRODUCT_IDS = Object.keys(PREBOOKING_PRODUCTS) as PrebookingProductId[];

export function isPrebookingProductId(value: unknown): value is PrebookingProductId {
  return typeof value === "string" && value in PREBOOKING_PRODUCTS;
}

export const PAYMENT_PROVIDER = "UPI_QR";

export const PAYMENT_STATUSES = [
  "PENDING",
  "PAYMENT_INITIATED",
  "PAID",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "REFUND_PENDING",
  "REFUNDED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Order statuses that mean the rice is being fulfilled, so payment must be verified first. */
export const FULFILMENT_STATUSES: readonly OrderStatus[] = [
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
];

/** Unpaid orders with no payment reference submitted are expired after this long. */
export const PENDING_ORDER_TTL_HOURS = 48;

export const SHIPPING_CALCULATION_TYPES = ["flat", "weight", "state"] as const;
export type ShippingCalculationType = (typeof SHIPPING_CALCULATION_TYPES)[number];

export type ShippingRate = { basePaise: number; perKgPaise: number };

export type ShippingSettings = {
  enabled: boolean;
  calculationType: ShippingCalculationType;
  /** Option A - flat: one charge per order. */
  flatChargePaise: number;
  /** Option B - weight based: base + quantity x per kg. */
  basePaise: number;
  perKgPaise: number;
  /** Option C - state based: a rate per zone, optionally overridden per state. */
  zoneRates: Record<ShippingZone, ShippingRate>;
  stateRates: Partial<Record<string, ShippingRate>>;
};

export type ProductSettings = {
  pricePerKgPaise: number;
  minQuantityKg: number;
  maxQuantityKg: number;
};

export type PrebookingSettings = {
  products: Record<PrebookingProductId, ProductSettings>;
  shippingMethod: string;
  shipping: ShippingSettings;
  /** Percentage applied to product amount + shipping. 0 disables the tax line. */
  taxPercent: number;
  upi: { vpa: string; payeeName: string };
};

export const DEFAULT_SETTINGS: PrebookingSettings = {
  products: {
    "dosa-rice": { pricePerKgPaise: 9500, minQuantityKg: 10, maxQuantityKg: 500 },
    // Maximums keep a single order under the usual ₹1,00,000 UPI payment limit.
    "malabar-tamarind": { pricePerKgPaise: 45000, minQuantityKg: 5, maxQuantityKg: 200 },
  },
  shippingMethod: "Parcel Service",
  shipping: {
    enabled: true,
    calculationType: "state",
    flatChargePaise: 30000,
    basePaise: 1500,
    perKgPaise: 3000,
    // Mirrors the cheapest courier in src/data/shipping.ts (first kg + additional kg).
    zoneRates: {
      kerala: { basePaise: 1500, perKgPaise: 3000 },
      south: { basePaise: 2500, perKgPaise: 4000 },
      national: { basePaise: 4000, perKgPaise: 5500 },
    },
    stateRates: {},
  },
  taxPercent: 0,
  upi: { vpa: "7356796946@ptyes", payeeName: "Thomas Zacharias" },
};

/** The subset of settings that is safe to send to the browser. */
export type PublicPrebookingConfig = {
  productId: PrebookingProductId;
  productName: string;
  shortName: string;
  pricePerKgPaise: number;
  minQuantityKg: number;
  maxQuantityKg: number;
  shippingMethod: string;
};

export function toPublicConfig(
  settings: PrebookingSettings,
  productId: PrebookingProductId,
): PublicPrebookingConfig {
  const product = PREBOOKING_PRODUCTS[productId];
  return {
    productId,
    productName: product.name,
    shortName: product.shortName,
    ...settings.products[productId],
    shippingMethod: settings.shippingMethod,
  };
}

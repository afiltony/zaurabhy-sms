import { getVariant } from "@/data/products";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

export type ShippingZone = "kerala" | "south" | "national";

const SOUTH_ZONE_STATES: IndianState[] = [
  "Tamil Nadu",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Puducherry",
];

export function getShippingZone(state: string): ShippingZone {
  if (state === "Kerala") return "kerala";
  if (SOUTH_ZONE_STATES.includes(state as IndianState)) return "south";
  return "national";
}

/**
 * Reference rate cards for couriers commonly used by Kerala small businesses,
 * built from each courier's publicly published domestic parcel pricing.
 * Confirm against your actual negotiated/current rates before relying on them.
 */
type ZoneRate = { firstKg: number; addlKgRate: number };

type Courier = {
  name: string;
  rates: Record<ShippingZone, ZoneRate>;
};

export const COURIERS: Courier[] = [
  {
    name: "India Post (Speed Post/Parcel)",
    rates: {
      kerala: { firstKg: 50, addlKgRate: 35 },
      south: { firstKg: 70, addlKgRate: 45 },
      national: { firstKg: 100, addlKgRate: 60 },
    },
  },
  {
    name: "Professional Couriers",
    rates: {
      kerala: { firstKg: 45, addlKgRate: 30 },
      south: { firstKg: 65, addlKgRate: 40 },
      national: { firstKg: 95, addlKgRate: 55 },
    },
  },
  {
    name: "DTDC",
    rates: {
      kerala: { firstKg: 70, addlKgRate: 50 },
      south: { firstKg: 90, addlKgRate: 60 },
      national: { firstKg: 130, addlKgRate: 80 },
    },
  },
];

// Standard domestic volumetric divisor used by DTDC, Blue Dart, Xpressbees, etc.
const VOLUMETRIC_DIVISOR = 5000;

export type CartLike = { slug: string; variantId: string; quantity: number }[];

export function computeChargeableWeightKg(items: CartLike): number {
  let actualWeightKg = 0;
  let volumetricWeightKg = 0;

  for (const item of items) {
    const variant = getVariant(item.slug, item.variantId);
    if (!variant) continue;
    const { weightKg, dimensionsCm } = variant.shipping;
    actualWeightKg += weightKg * item.quantity;
    volumetricWeightKg +=
      ((dimensionsCm.length * dimensionsCm.width * dimensionsCm.height) /
        VOLUMETRIC_DIVISOR) *
      item.quantity;
  }

  const chargeable = Math.max(actualWeightKg, volumetricWeightKg);
  // Couriers bill in 0.5kg slabs, rounded up.
  return Math.max(0.5, Math.ceil(chargeable * 2) / 2);
}

function rateFor(rate: ZoneRate, weightKg: number) {
  if (weightKg <= 1) return rate.firstKg;
  return rate.firstKg + Math.ceil(weightKg - 1) * rate.addlKgRate;
}

export type ShippingQuote = {
  courier: string;
  cost: number;
  weightKg: number;
  zone: ShippingZone;
};

export function computeShipping(
  items: CartLike,
  state: string,
): ShippingQuote | null {
  if (items.length === 0) return null;

  const zone = getShippingZone(state);
  const weightKg = computeChargeableWeightKg(items);

  let cheapest: ShippingQuote | null = null;
  for (const courier of COURIERS) {
    const cost = rateFor(courier.rates[zone], weightKg);
    if (!cheapest || cost < cheapest.cost) {
      cheapest = { courier: courier.name, cost, weightKg, zone };
    }
  }
  return cheapest;
}

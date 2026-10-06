import { z } from "zod";
import { INDIAN_STATES } from "@/data/shipping";
import { PREBOOKING_PRODUCT_IDS, SHIPPING_CALCULATION_TYPES } from "@/lib/prebooking/config";

/** Accepts "98765 43210", "+91-9876543210", "09876543210" and returns the bare 10 digits. */
export function normalizeIndianMobile(value: string): string {
  const digits = value.replace(/[\s\-()]/g, "");
  return digits.replace(/^(\+91|91|0)(?=[6-9]\d{9}$)/, "");
}

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const optionalText = (max: number) =>
  z.string().trim().max(max, "Too long").optional().or(z.literal(""));

export const customerDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Your full name is required").max(100, "Too long"),
  phone: z
    .string()
    .trim()
    .transform(normalizeIndianMobile)
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")),
  email: z.string().trim().max(254, "Too long").email("Enter a valid email address"),
  addressLine1: z.string().trim().min(4, "Address is required").max(200, "Too long"),
  addressLine2: optionalText(200),
  city: z.string().trim().min(2, "City is required").max(80, "Too long"),
  district: z.string().trim().min(2, "District is required").max(80, "Too long"),
  state: z.enum(INDIAN_STATES, { message: "Select your state" }),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code"),
  country: z.literal("India", { message: "We currently deliver within India only" }),
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => value === "" || GSTIN_PATTERN.test(value), "Enter a valid 15-character GSTIN")
    .optional(),
});

export type CustomerDetails = z.infer<typeof customerDetailsSchema>;

export function quantitySchema(limits: { minQuantityKg: number; maxQuantityKg: number }) {
  return z
    .number({ message: "Enter the quantity in KG" })
    .int("Quantity must be in whole kilograms")
    .min(limits.minQuantityKg, `Minimum order is ${limits.minQuantityKg} KG`)
    .max(
      limits.maxQuantityKg,
      `For more than ${limits.maxQuantityKg} KG please use our wholesale enquiry`,
    );
}

/** Step 1 of the form: customer details plus quantity, validated against the live limits. */
export function prebookingFormSchema(limits: { minQuantityKg: number; maxQuantityKg: number }) {
  return customerDetailsSchema.extend({ quantityKg: quantitySchema(limits) });
}

export type PrebookingFormInput = z.input<ReturnType<typeof prebookingFormSchema>>;
export type PrebookingFormValues = z.output<ReturnType<typeof prebookingFormSchema>>;

export const clientTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9-]{20,64}$/, "Invalid session token");

/** UPI transaction reference (UTR / RRN) shown in every UPI app after paying: 12 digits. */
export const upiReferenceSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s/g, ""))
  .pipe(z.string().regex(/^\d{12}$/, "Enter the 12-digit UPI reference (UTR) from your payment"));

export const ORDER_NUMBER_PATTERN = /^ZR-[A-Z]{2}-\d{8}-\d{4,}$/;

export const productIdSchema = z.enum(PREBOOKING_PRODUCT_IDS, {
  message: "This product is not available for pre-booking",
});

const paise = z.number().int().min(0).max(100_000_00);
const rateSchema = z.object({ basePaise: paise, perKgPaise: paise });

const productSettingsSchema = z
  .object({
    pricePerKgPaise: z.number().int().min(100, "Price must be at least ₹1").max(100_000_00),
    minQuantityKg: z.number().int().min(1).max(10_000),
    maxQuantityKg: z.number().int().min(1).max(10_000),
  })
  .refine((value) => value.maxQuantityKg >= value.minQuantityKg, {
    path: ["maxQuantityKg"],
    message: "Maximum quantity cannot be below the minimum",
  });

export const settingsSchema = z
  .object({
    products: z.object({
      "dosa-rice": productSettingsSchema,
      "malabar-tamarind": productSettingsSchema,
    }),
    shippingMethod: z.string().trim().min(2).max(60),
    shipping: z.object({
      enabled: z.boolean(),
      calculationType: z.enum(SHIPPING_CALCULATION_TYPES),
      flatChargePaise: paise,
      basePaise: paise,
      perKgPaise: paise,
      zoneRates: z.object({ kerala: rateSchema, south: rateSchema, national: rateSchema }),
      stateRates: z.partialRecord(z.enum(INDIAN_STATES), rateSchema),
    }),
    taxPercent: z.number().min(0).max(28),
    upi: z.object({
      vpa: z
        .string()
        .trim()
        .regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, "Enter a valid UPI ID"),
      payeeName: z.string().trim().min(2).max(60),
    }),
  });

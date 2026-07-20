import { z } from "zod";
import { INDIAN_STATES } from "@/data/shipping";

export const monthlyRequirementOptions = [
  "100 Kg",
  "500 Kg",
  "1 Ton",
  "5 Tons",
] as const;

export const deliveryPreferenceOptions = [
  "Own Transport",
  "Parcel Service",
] as const;

export const wholesaleEnquirySchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "Enter a valid phone number")
    .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email"),
  state: z.string().trim().min(2, "State is required"),
  monthlyRequirement: z.enum(monthlyRequirementOptions, {
    message: "Select your monthly requirement",
  }),
  deliveryPreference: z.enum(deliveryPreferenceOptions, {
    message: "Select a delivery preference",
  }),
  agreeToTerms: z.literal(true, {
    message: "You must agree to the Terms of Use",
  }),
});

export type WholesaleEnquiryInput = z.infer<typeof wholesaleEnquirySchema>;

export const exportEnquirySchema = z.object({
  country: z.string().trim().min(2, "Country is required"),
  companyName: z.string().trim().min(2, "Company name is required"),
  importLicense: z.string().trim().optional().or(z.literal("")),
  destinationPort: z.string().trim().min(2, "Destination port is required"),
  containerRequirement: z
    .string()
    .trim()
    .min(1, "Container requirement is required"),
});

export type ExportEnquiryInput = z.infer<typeof exportEnquirySchema>;

export const dealerBusinessTypeOptions = [
  "Retailer",
  "Distributor",
  "Supermarket",
  "Online Seller",
] as const;

export const dealerRegistrationSchema = z.object({
  fullName: z.string().trim().min(2, "Your name is required"),
  businessName: z.string().trim().min(2, "Business name is required"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "Enter a valid phone number")
    .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  businessType: z.enum(dealerBusinessTypeOptions, {
    message: "Select your business type",
  }),
  gstNumber: z.string().trim().optional().or(z.literal("")),
});

export type DealerRegistrationInput = z.infer<typeof dealerRegistrationSchema>;

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Your name is required"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "Enter a valid phone number")
    .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email"),
  addressLine1: z.string().trim().min(4, "Address is required"),
  addressLine2: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required"),
  state: z.enum(INDIAN_STATES, { message: "Select your state" }),
  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "Enter a valid 6-digit pincode"),
  items: z
    .array(
      z.object({
        slug: z.string().trim().min(1),
        variantId: z.string().trim().min(1),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1, "Your cart is empty"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

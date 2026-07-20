"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import TextField from "@/components/forms/TextField";
import {
  deliveryPreferenceOptions,
  monthlyRequirementOptions,
  wholesaleEnquirySchema,
  type WholesaleEnquiryInput,
} from "@/lib/validation";

export default function WholesaleForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WholesaleEnquiryInput>({
    resolver: zodResolver(wholesaleEnquirySchema),
  });

  const onSubmit = async (data: WholesaleEnquiryInput) => {
    setStatus("idle");
    try {
      const res = await fetch("/api/wholesale-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      id="wholesale-enquiry"
      className="rounded-2xl border border-border bg-white p-6 sm:p-7"
    >
      <h2 className="font-heading text-2xl font-bold text-ink">
        Wholesale price enquiry
      </h2>
      <p className="mt-1.5 text-sm text-ink-muted">
        Get bulk rates within 24 hours.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3" noValidate>
        <TextField
          label="Business Name"
          {...register("businessName")}
          error={errors.businessName?.message}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Phone"
            type="tel"
            {...register("phone")}
            error={errors.phone?.message}
          />
          <TextField
            label="Email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
          />
        </div>
        <TextField
          label="State"
          {...register("state")}
          error={errors.state?.message}
        />

        <fieldset>
          <legend className="mb-2 block text-xs font-semibold text-ink-soft">
            Monthly requirement
          </legend>
          <div className="flex flex-wrap gap-2">
            {monthlyRequirementOptions.map((option) => (
              <label
                key={option}
                className="cursor-pointer rounded-full border border-border px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft transition has-[:checked]:border-teal has-[:checked]:bg-teal has-[:checked]:text-teal-foreground"
              >
                <input
                  type="radio"
                  value={option}
                  {...register("monthlyRequirement")}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
          {errors.monthlyRequirement && (
            <p className="mt-1 text-xs text-coral">
              {errors.monthlyRequirement.message}
            </p>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2 block text-xs font-semibold text-ink-soft">
            Delivery preference
          </legend>
          <div className="flex flex-wrap gap-2">
            {deliveryPreferenceOptions.map((option) => (
              <label
                key={option}
                className="cursor-pointer rounded-full border border-border px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft transition has-[:checked]:border-teal has-[:checked]:bg-teal has-[:checked]:text-teal-foreground"
              >
                <input
                  type="radio"
                  value={option}
                  {...register("deliveryPreference")}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
          {errors.deliveryPreference && (
            <p className="mt-1 text-xs text-coral">
              {errors.deliveryPreference.message}
            </p>
          )}
        </fieldset>

        <div>
          <label className="flex items-start gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              {...register("agreeToTerms")}
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms-of-use" className="font-semibold text-blue underline">
                Terms of Use
              </Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="mt-1 text-xs text-coral">
              {errors.agreeToTerms.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-blue py-3 text-sm font-bold text-white transition hover:bg-teal disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit enquiry"}
        </button>

        {status === "success" && (
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-teal">
            <CheckCircle2 className="h-4 w-4" />
            Thanks! We&apos;ll get back to you shortly.
          </p>
        )}
        {status === "error" && (
          <p className="text-center text-sm font-medium text-coral">
            Something went wrong. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}

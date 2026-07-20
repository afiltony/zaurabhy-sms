"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import TextField from "@/components/forms/TextField";
import {
  dealerBusinessTypeOptions,
  dealerRegistrationSchema,
  type DealerRegistrationInput,
} from "@/lib/validation";

export default function DealerRegistrationForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DealerRegistrationInput>({
    resolver: zodResolver(dealerRegistrationSchema),
  });

  const onSubmit = async (data: DealerRegistrationInput) => {
    setStatus("idle");
    try {
      const res = await fetch("/api/dealer-registration", {
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
    <div className="rounded-2xl border border-border bg-white p-6 sm:p-7">
      <h2 className="font-heading text-2xl font-bold text-ink">
        Dealer registration
      </h2>
      <p className="mt-1.5 text-sm text-ink-muted">
        Tell us about your business and we&apos;ll get in touch within 24
        hours.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Your Name"
            {...register("fullName")}
            error={errors.fullName?.message}
          />
          <TextField
            label="Business Name"
            {...register("businessName")}
            error={errors.businessName?.message}
          />
        </div>
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
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="City"
            {...register("city")}
            error={errors.city?.message}
          />
          <TextField
            label="State"
            {...register("state")}
            error={errors.state?.message}
          />
        </div>
        <TextField
          label="GST Number (optional)"
          {...register("gstNumber")}
          error={errors.gstNumber?.message}
        />

        <fieldset>
          <legend className="mb-2 block text-xs font-semibold text-ink-soft">
            Business type
          </legend>
          <div className="flex flex-wrap gap-2">
            {dealerBusinessTypeOptions.map((option) => (
              <label
                key={option}
                className="cursor-pointer rounded-full border border-border px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft transition has-[:checked]:border-teal has-[:checked]:bg-teal has-[:checked]:text-teal-foreground"
              >
                <input
                  type="radio"
                  value={option}
                  {...register("businessType")}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
          {errors.businessType && (
            <p className="mt-1 text-xs text-coral">
              {errors.businessType.message}
            </p>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-blue py-3 text-sm font-bold text-white transition hover:bg-teal disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Register as a dealer"}
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

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import TextField from "@/components/forms/TextField";
import { contactEnquirySchema, type ContactEnquiryInput } from "@/lib/validation";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactEnquiryInput>({
    resolver: zodResolver(contactEnquirySchema),
  });

  const onSubmit = async (data: ContactEnquiryInput) => {
    setStatus("idle");
    try {
      const res = await fetch("/api/contact", {
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
        Send us a message
      </h2>
      <p className="mt-1.5 text-sm text-ink-muted">
        We usually reply within 24 hours.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3" noValidate>
        <TextField
          label="Full Name"
          {...register("fullName")}
          error={errors.fullName?.message}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
          />
          <TextField
            label="Phone (optional)"
            type="tel"
            {...register("phone")}
            error={errors.phone?.message}
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="mb-1 block text-sm font-medium text-ink-soft"
          >
            Message
          </label>
          <textarea
            id="message"
            rows={4}
            {...register("message")}
            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20 ${
              errors.message ? "border-coral" : "border-border"
            }`}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-coral">{errors.message.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-blue py-3 text-sm font-bold text-white transition hover:bg-teal disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Send message"}
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

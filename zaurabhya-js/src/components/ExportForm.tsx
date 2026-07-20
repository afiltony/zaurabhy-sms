"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import TextField from "@/components/forms/TextField";
import { exportEnquirySchema, type ExportEnquiryInput } from "@/lib/validation";

export default function ExportForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExportEnquiryInput>({
    resolver: zodResolver(exportEnquirySchema),
  });

  const onSubmit = async (data: ExportEnquiryInput) => {
    setStatus("idle");
    try {
      const res = await fetch("/api/export-enquiry", {
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
    <div id="export" className="rounded-2xl bg-blue p-6 text-cream-light sm:p-7">
      <h2 className="font-heading text-2xl font-bold text-white">
        Export enquiry
      </h2>
      <p className="mt-1.5 text-sm text-[#c8d8e4]">
        For importers &amp; distributors abroad.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Country"
            variant="dark"
            {...register("country")}
            error={errors.country?.message}
          />
          <TextField
            label="Company Name"
            variant="dark"
            {...register("companyName")}
            error={errors.companyName?.message}
          />
        </div>
        <TextField
          label="Import License"
          variant="dark"
          {...register("importLicense")}
          error={errors.importLicense?.message}
        />
        <TextField
          label="Destination Port"
          variant="dark"
          {...register("destinationPort")}
          error={errors.destinationPort?.message}
        />
        <TextField
          label="Container Requirement"
          variant="dark"
          placeholder="e.g. 1x 20ft / month"
          {...register("containerRequirement")}
          error={errors.containerRequirement?.message}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-coral py-3 text-sm font-bold text-white transition hover:bg-teal disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit enquiry"}
        </button>

        {status === "success" && (
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-white">
            <CheckCircle2 className="h-4 w-4" />
            Thanks! Our export team will reach out shortly.
          </p>
        )}
        {status === "error" && (
          <p className="text-center text-sm font-medium text-[#ffd7cd]">
            Something went wrong. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}

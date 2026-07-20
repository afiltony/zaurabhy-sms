import type { Metadata } from "next";
import DealerRegistrationForm from "@/components/DealerRegistrationForm";

export const metadata: Metadata = {
  title: "Dealer Registration",
  description:
    "Register as a ZAURABHYA dealer, distributor, or retailer and get access to wholesale pricing on Kerala rice and Malabar tamarind.",
};

export default function RegisterPage() {
  return (
    <div className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <p className="text-center text-sm font-semibold text-coral">
          Become a Partner
        </p>
        <h1 className="mt-2 text-center font-heading text-3xl font-bold text-ink sm:text-4xl">
          Register as a Dealer
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-ink-muted sm:text-base">
          Join retailers and wholesalers across India and international
          markets selling premium Kerala rice &amp; Malabar tamarind.
        </p>

        <div className="mt-10">
          <DealerRegistrationForm />
        </div>
      </div>
    </div>
  );
}

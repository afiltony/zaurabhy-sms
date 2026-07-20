"use client";

import { useState } from "react";

const CUSTOMER_TYPES = [
  {
    label: "Consumer",
    note: "Retail packs delivered to your door, plus recipes and free shipping over ₹999.",
    cta: "Shop retail",
    href: "#products",
  },
  {
    label: "Retailer",
    note: "Shelf-ready cases at retailer margins with fast domestic dispatch.",
    cta: "Get retailer rates",
    href: "#wholesale-enquiry",
  },
  {
    label: "Wholesaler",
    note: "Volume slabs from 500 kg with dedicated account support.",
    cta: "Request wholesale quote",
    href: "#wholesale-enquiry",
  },
  {
    label: "Distributor",
    note: "Territory pricing, marketing support and priority stock allocation.",
    cta: "Apply as distributor",
    href: "#wholesale-enquiry",
  },
  {
    label: "Export Buyer",
    note: "FOB / CIF quotes in USD, AED, EUR or GBP with full export documentation.",
    cta: "Start export enquiry",
    href: "#export",
  },
];

export default function CustomerType() {
  const [active, setActive] = useState(0);
  const current = CUSTOMER_TYPES[active];

  return (
    <section className="mx-4 my-5 rounded-3xl bg-[#f4ead6] px-6 py-10 sm:mx-6 sm:px-10 lg:mx-8">
      <div className="mb-6 text-center">
        <p className="mb-2 text-xs font-bold tracking-[0.2em] text-coral">
          SEE YOUR PRICING
        </p>
        <h2 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
          Tell us who you are
        </h2>
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-2.5">
        {CUSTOMER_TYPES.map((type, index) => (
          <button
            key={type.label}
            type="button"
            onClick={() => setActive(index)}
            className={`rounded-full border-[1.5px] px-5 py-2.5 text-sm font-bold transition ${
              index === active
                ? "border-coral bg-coral text-white"
                : "border-[#d8ccb4] bg-white text-ink-soft hover:border-coral"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-xl rounded-2xl border border-[#e6d9bf] bg-white p-6 text-center">
        <p className="text-xs font-bold tracking-[0.14em] text-blue">
          {current.label.toUpperCase()} PRICING
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">
          {current.note}
        </p>
        <a
          href={current.href}
          className="mt-4 inline-block rounded-full bg-coral px-6 py-3 text-sm font-bold text-white transition hover:bg-teal"
        >
          {current.cta}
        </a>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Return Policy",
  description:
    "Our policy on returns, replacements, and refunds for ZAURABHYA Kerala rice and Malabar tamarind orders.",
};

const LAST_UPDATED = "18 July 2026";

export default function ReturnPolicyPage() {
  return (
    <div className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold text-coral">Legal</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-ink sm:text-4xl">
          Return Policy
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-soft sm:text-base">
          <Section title="1. Our commitment">
            <p>
              We take care to pack and ship our Kerala rice and Malabar
              tamarind so it arrives in good condition. As these are
              consumable food products, we are unable to accept returns once
              a package has been opened, except in the cases described
              below.
            </p>
          </Section>

          <Section title="2. Purchases made on Amazon or other marketplaces">
            <p>
              If you bought a ZAURABHYA product through Amazon or another
              third-party marketplace, returns, replacements, and refunds
              are handled entirely under that marketplace&apos;s own return
              policy and timelines. Please raise your request directly with
              the marketplace where the purchase was made.
            </p>
          </Section>

          <Section title="3. Damaged, defective, or incorrect items">
            <p>
              If your order arrives damaged, defective, spoiled, or
              different from what you ordered, please contact us within
              48 hours of delivery with:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Your order or invoice number.</li>
              <li>Clear photos of the product, packaging, and shipping label.</li>
              <li>A brief description of the issue.</li>
            </ul>
            <p className="mt-3">
              Once verified, we will arrange a replacement or refund at no
              additional cost to you. We do not require you to return the
              opened product for food-safety reasons.
            </p>
          </Section>

          <Section title="4. Wholesale and export orders">
            <p>
              Bulk wholesale and export orders are subject to the specific
              terms agreed at the time of quotation or invoice, including
              quality checks, inspection windows, and any return or
              replacement terms stated in that agreement. Please refer to
              your order confirmation or contact your ZAURABHYA
              representative for details specific to your shipment.
            </p>
          </Section>

          <Section title="5. What is not covered">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Change of mind after an order has been packed or shipped.</li>
              <li>Products consumed or used beyond a reasonable inspection quantity.</li>
              <li>Issues reported more than 7 days after delivery, except where required by law.</li>
              <li>Damage caused by improper storage after delivery.</li>
            </ul>
          </Section>

          <Section title="6. Refund method and timeline">
            <p>
              Approved refunds are issued to the original payment method
              (or, for marketplace orders, processed by the marketplace)
              and typically reflect within 5–10 business days, depending on
              your bank or payment provider.
            </p>
          </Section>

          <Section title="7. Contact us">
            <p>
              To start a return, replacement, or refund request, please
              reach out via the{" "}
              <Link href="/#contact" className="font-semibold text-teal hover:underline">
                contact section
              </Link>{" "}
              of our website with your order details.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 font-heading text-lg font-bold text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

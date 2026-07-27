import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { withSiteKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with ZAURABHYA (operated by VIMATONS SIGNS (OPC) PVT LTD) for orders, wholesale, export, or general enquiries.",
  keywords: withSiteKeywords("contact ZAURABHYA", "Kerala rice supplier contact"),
};

export default function ContactPage() {
  return (
    <div className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-sm font-semibold text-coral">
          Get in Touch
        </p>
        <h1 className="mt-2 text-center font-heading text-3xl font-bold text-ink sm:text-4xl">
          Contact Us
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-ink-muted sm:text-base">
          Questions about an order, wholesale rates, or export? Reach out and
          our team will get back to you shortly.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-white p-6 sm:p-7">
              <h2 className="font-heading text-lg font-bold text-ink">
                VIMATONS SIGNS (OPC) PVT LTD
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Registered operator of ZAURABHYA
              </p>

              <div className="mt-5 space-y-4 text-sm text-ink-soft">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal" />
                  <span>
                    Lake Parampil, Thengana,
                    <br />
                    Changanassery, Kottayam,
                    <br />
                    Kerala, India
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4.5 w-4.5 shrink-0 text-teal" />
                  <a href="tel:+917356796946" className="hover:text-coral">
                    +91 73567 96946
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4.5 w-4.5 shrink-0 text-teal" />
                  <a href="mailto:info@zaurabhya.com" className="hover:text-coral">
                    info@zaurabhya.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms and conditions governing your use of the ZAURABHYA website and services.",
};

const LAST_UPDATED = "18 July 2026";

export default function TermsOfUsePage() {
  return (
    <div className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold text-coral">Legal</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-ink sm:text-4xl">
          Terms of Use
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-soft sm:text-base">
          <Section title="1. Acceptance of terms">
            <p>
              These Terms of Use (&quot;Terms&quot;) govern your access to and
              use of the ZAURABHYA website, including any content,
              functionality, and services offered on or through it (the
              &quot;Site&quot;). By using the Site, you agree to be bound by
              these Terms. If you do not agree, please do not use the Site.
            </p>
          </Section>

          <Section title="2. Who we are">
            <p>
              ZAURABHYA supplies premium Kerala rice varieties and Malabar
              tamarind (kudampuli), grown on our own farms in Kerala, India.
              References to &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;
              refer to ZAURABHYA; &quot;you&quot; refers to the user or
              viewer of the Site.
            </p>
          </Section>

          <Section title="3. Use of the site">
            <p>
              You may use the Site to browse our products, submit wholesale
              or export enquiries, and contact us. You agree to:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Provide accurate and complete information in any enquiry or form you submit.</li>
              <li>Use the Site only for lawful purposes and in a manner that does not infringe the rights of, or restrict or inhibit the use of, the Site by any third party.</li>
              <li>Not attempt to gain unauthorized access to any part of the Site, other accounts, or computer systems connected to the Site.</li>
            </ul>
          </Section>

          <Section title="4. Products and orders">
            <p>
              Product descriptions, images, and availability on the Site are
              for informational purposes and are subject to change without
              notice. Retail purchases made through third-party marketplaces
              (such as Amazon) are subject to that marketplace&apos;s own
              terms, policies, and order processes, not these Terms.
              Wholesale and export enquiries submitted through the Site are
              not orders — they are requests for us to contact you, and any
              resulting sale is governed by a separate agreement or invoice
              between you and ZAURABHYA.
            </p>
          </Section>

          <Section title="5. Intellectual property">
            <p>
              All content on the Site, including text, graphics, logos, and
              images, is the property of ZAURABHYA or its licensors and is
              protected by applicable intellectual property laws. You may
              not reproduce, distribute, or create derivative works from
              this content without our prior written consent.
            </p>
          </Section>

          <Section title="6. Third-party links">
            <p>
              The Site may contain links to third-party websites or services
              (such as Amazon or social media platforms) that are not owned
              or controlled by ZAURABHYA. We are not responsible for the
              content, policies, or practices of any third-party sites.
            </p>
          </Section>

          <Section title="7. Disclaimer of warranties">
            <p>
              The Site and its content are provided &quot;as is&quot; without
              warranties of any kind, express or implied. While we strive
              for accuracy, we do not guarantee that the Site will be
              error-free, uninterrupted, or that product information is
              always current.
            </p>
          </Section>

          <Section title="8. Limitation of liability">
            <p>
              To the fullest extent permitted by law, ZAURABHYA shall not be
              liable for any indirect, incidental, or consequential damages
              arising from your use of the Site.
            </p>
          </Section>

          <Section title="9. Changes to these terms">
            <p>
              We may update these Terms from time to time. Changes take
              effect once posted on this page. Continued use of the Site
              after changes are posted constitutes acceptance of the revised
              Terms.
            </p>
          </Section>

          <Section title="10. Governing law">
            <p>
              These Terms are governed by the laws of India, and any
              disputes shall be subject to the exclusive jurisdiction of the
              courts of Kerala, India.
            </p>
          </Section>

          <Section title="11. Contact us">
            <p>
              For questions about these Terms, please reach out via the{" "}
              <Link href="/#contact" className="font-semibold text-teal hover:underline">
                contact section
              </Link>{" "}
              of our website.
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

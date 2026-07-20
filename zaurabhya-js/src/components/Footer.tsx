import Image from "next/image";
import Link from "next/link";

const EXPLORE_LINKS = [
  { label: "About", href: "/" },
  { label: "Products", href: "/#products" },
  { label: "Our Farms", href: "/#farms" },
  { label: "Amazon", href: "#" },
];

const BUSINESS_LINKS = [
  { label: "Dealer Registration", href: "/register" },
  { label: "Wholesale", href: "/#wholesale-enquiry" },
  { label: "Export", href: "/#export" },
  { label: "Contact", href: "/#contact" },
];

const LEGAL_LINKS = [
  { label: "Terms of Use", href: "/terms-of-use" },
  { label: "Return Policy", href: "/return-policy" },
];

const CONNECT_LINKS = [
  { label: "WhatsApp", href: "#" },
  { label: "Facebook", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
];

export default function Footer() {
  return (
    <footer id="contact" className="px-4 pb-8 pt-11 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-6 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/logo-zaurabhya.png"
              alt="ZAURABHYA"
              width={359}
              height={123}
              className="mb-3 h-8 w-auto object-contain"
            />
            <p className="max-w-[260px] text-sm leading-relaxed text-ink-muted">
              Premium Kerala rice &amp; Malabar tamarind, direct from our own
              farms to homes and businesses worldwide.
            </p>
          </div>

          <FooterColumn title="Explore" links={EXPLORE_LINKS} />
          <FooterColumn title="Business" links={BUSINESS_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
          <FooterColumn title="Connect" links={CONNECT_LINKS} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-border pt-5 text-[13px] text-ink-muted/80">
          <span>&copy; {new Date().getFullYear()} ZAURABHYA. All rights reserved.</span>
          <span>FSSAI Certified &middot; Made in Kerala, India</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="mb-3 text-[13px] font-bold text-ink">{title}</p>
      <div className="flex flex-col gap-2">
        {links.map((link) =>
          link.href.startsWith("/") ? (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-ink-muted transition hover:text-coral"
            >
              {link.label}
            </Link>
          ) : (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-ink-muted transition hover:text-coral"
            >
              {link.label}
            </a>
          ),
        )}
      </div>
    </div>
  );
}

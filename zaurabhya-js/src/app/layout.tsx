import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/cart-context";
import { SITE_KEYWORDS, SITE_URL } from "@/lib/seo";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ZAURABHYA | Premium Kerala Rice & Malabar Tamarind, Farm Direct",
    template: "%s | ZAURABHYA",
  },
  description:
    "ZAURABHYA supplies premium high-fiber Kerala rice varieties (raw, dosa, appam, idli) and Malabar tamarind (kudampuli), grown on our own farms. FSSAI certified, wholesale and export ready.",
  keywords: SITE_KEYWORDS,
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "ZAURABHYA",
    title: "ZAURABHYA | Premium Kerala Rice & Malabar Tamarind, Farm Direct",
    description:
      "Naturally healthy, farm-fresh, high-fiber Kerala rice and Malabar tamarind, direct from our own farms.",
    images: [{ url: "/logo-zaurabhya.png" }],
  },
  twitter: {
    card: "summary",
    title: "ZAURABHYA | Premium Kerala Rice & Malabar Tamarind, Farm Direct",
    description:
      "Naturally healthy, farm-fresh, high-fiber Kerala rice and Malabar tamarind, direct from our own farms.",
    images: ["/logo-zaurabhya.png"],
  },
  icons: {
    icon: "/logo-zaurabhya.png",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ZAURABHYA",
  url: siteUrl,
  logo: `${siteUrl}/logo-zaurabhya.png`,
  description:
    "Premium high-fiber Kerala rice and Malabar tamarind, direct from our own farms.",
  address: {
    "@type": "PostalAddress",
    addressRegion: "Kerala",
    addressCountry: "IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${inter.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}

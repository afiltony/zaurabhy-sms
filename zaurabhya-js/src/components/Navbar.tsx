"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, ShoppingCart, X } from "lucide-react";
import AnnouncementBar from "@/components/AnnouncementBar";
import { useCart } from "@/lib/cart-context";

const NAV_LINKS = [
  { label: "Products", href: "/#products" },
  { label: "Our Farms", href: "/#farms" },
  { label: "Wholesale", href: "/#wholesale-enquiry" },
  { label: "Export", href: "/#export" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <div className="sticky top-0 z-50">
      <AnnouncementBar />
      <header className="flex items-center justify-between border-b border-border bg-cream px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-zaurabhya.png"
            alt="ZAURABHYA"
            width={359}
            height={123}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-ink-soft transition hover:text-coral"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/cart"
            className="relative inline-flex items-center justify-center rounded-full p-2 text-ink-soft transition hover:text-coral"
            aria-label="View cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <Link
            href="/products"
            className="rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(226,109,92,0.35)] transition hover:bg-teal"
          >
            Buy Now
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {open && (
        <nav className="border-b border-border bg-cream px-4 pb-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-semibold text-ink-soft hover:text-coral"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cart"
            className="mt-2 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-ink-soft hover:text-coral"
            onClick={() => setOpen(false)}
          >
            <ShoppingCart className="h-4 w-4" />
            Cart{itemCount > 0 ? ` (${itemCount})` : ""}
          </Link>
          <Link
            href="/products"
            className="mt-2 block rounded-full bg-coral px-5 py-2.5 text-center text-sm font-bold text-white"
            onClick={() => setOpen(false)}
          >
            Buy Now
          </Link>
        </nav>
      )}
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";

const HIGHLIGHTS = [
  "High Fiber Raw Rice",
  "Traditional Kerala Varieties",
  "Direct Farm to Table",
  "FSSAI Certified",
];

export default function Hero() {
  return (
    <section
      id="home"
      className="relative mx-4 mt-4 min-h-[560px] overflow-hidden rounded-3xl sm:mx-6 lg:mx-8"
    >
      <Image
        src="/hero-paddy-field.png"
        alt="Kerala paddy field at golden hour"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1c2018]/85 via-[#1c2018]/55 to-[#1c2018]/5" />

      <div className="relative flex min-h-[560px] max-w-2xl flex-col justify-center px-6 py-14 sm:px-10 sm:py-16">
        <p className="text-xs font-bold tracking-[0.22em] text-[#f0b8a8]">
          PREMIUM KERALA FOOD
        </p>

        <h1 className="my-4 font-heading text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
          ZAURABHYA
        </h1>

        <p className="text-base font-semibold tracking-wide text-[#e9dcc4] sm:text-lg">
          Naturally Healthy &middot; Farm Fresh &middot; High Fiber
        </p>

        <p className="mt-5 max-w-md text-lg text-[#f4ecdd] sm:text-xl">
          Premium Kerala rice &amp; Malabar tamarind, delivered direct from
          our own farms.
        </p>

        <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
          {HIGHLIGHTS.map((item) => (
            <li
              key={item}
              className="text-sm font-semibold text-[#eadfca] sm:text-base"
            >
              &#10003; {item}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="rounded-full bg-coral px-6 py-3.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(226,109,92,0.4)] transition hover:bg-teal"
          >
            Buy Now
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[#f4ead6] px-6 py-3.5 text-sm font-bold text-blue transition hover:bg-teal hover:text-white"
          >
            Become a Dealer
          </Link>
        </div>
      </div>
    </section>
  );
}

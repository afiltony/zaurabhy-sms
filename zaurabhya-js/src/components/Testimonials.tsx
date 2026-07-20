const TESTIMONIALS = [
  {
    quote: "Excellent quality rice — consistent every order.",
    attribution: "Retail customer · Kochi",
  },
  {
    quote: "Authentic Kerala taste our diners recognise instantly.",
    attribution: "Restaurant buyer · Dubai",
  },
  {
    quote: "Very good for dosa and appam — great wholesale terms.",
    attribution: "Wholesaler · Chennai",
  },
];

export default function Testimonials() {
  return (
    <section className="px-4 py-11 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-7 text-center font-heading text-3xl font-bold text-ink sm:text-4xl">
          What our customers say
        </h2>

        <div className="grid gap-[18px] sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.attribution}
              className="rounded-2xl border border-border bg-white p-6"
            >
              <div className="mb-3 text-base text-coral">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="text-base font-medium text-ink">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-4 text-[13px] font-semibold text-ink-muted">
                {t.attribution}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

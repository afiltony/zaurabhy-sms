const BENEFITS = [
  "High fiber",
  "Traditional Kerala rice",
  "Premium taste",
  "Carefully processed",
  "Rich natural aroma",
];

export default function HealthBenefits() {
  return (
    <section className="px-4 py-11 text-center sm:px-6 lg:px-8">
      <h2 className="mb-6 font-heading text-3xl font-bold text-ink sm:text-4xl">
        Health benefits
      </h2>

      <div className="flex flex-wrap justify-center gap-3">
        {BENEFITS.map((benefit) => (
          <span
            key={benefit}
            className="rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-ink-soft"
          >
            &#10003; {benefit}
          </span>
        ))}
      </div>
    </section>
  );
}

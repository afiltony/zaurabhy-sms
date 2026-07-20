const REASONS = [
  {
    emoji: "\u{1F33E}",
    label: "Own-farm production",
    description: "Full control, seed to sack.",
  },
  {
    emoji: "\u{1F965}",
    label: "Traditional practices",
    description: "Time-honoured Kerala methods.",
  },
  {
    emoji: "\u{1F331}",
    label: "Naturally grown",
    description: "Clean, minimally processed.",
  },
  {
    emoji: "\u{1F49A}",
    label: "High fiber nutrition",
    description: "Wholesome, low-glycemic.",
  },
  {
    emoji: "\u{1F3C6}",
    label: "Premium quality",
    description: "Graded and quality-checked.",
  },
  {
    emoji: "\u{1F4E6}",
    label: "Bulk supply",
    description: "From cartons to containers.",
  },
  {
    emoji: "\u{1F30D}",
    label: "Export ready",
    description: "Documentation & logistics.",
  },
  {
    emoji: "\u{1F69A}",
    label: "Fast delivery",
    description: "Reliable domestic & global.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="px-4 py-11 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-7 text-center font-heading text-3xl font-bold text-ink sm:text-4xl">
          Why choose Zaurabhya?
        </h2>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {REASONS.map((reason) => (
            <div
              key={reason.label}
              className="rounded-xl border border-border bg-white p-5"
            >
              <div className="mb-2.5 text-2xl">{reason.emoji}</div>
              <h3 className="font-heading text-base font-bold text-ink">
                {reason.label}
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

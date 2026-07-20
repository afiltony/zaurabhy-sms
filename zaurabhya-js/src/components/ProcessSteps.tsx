const STEP_LABELS = [
  "Land Prep",
  "Planting",
  "Crop Care",
  "Harvest",
  "Processing",
  "Packaging",
  "Delivery",
];

export default function ProcessSteps() {
  return (
    <section
      id="farms"
      className="mx-4 my-5 rounded-3xl bg-[#1f2a20] px-6 py-11 text-[#eadfca] sm:mx-6 sm:px-10 lg:mx-8"
    >
      <div className="mb-7 text-center">
        <p className="mb-2 text-xs font-bold tracking-[0.2em] text-[#f0b8a8]">
          OUR PROCESS
        </p>
        <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
          From our farms to your table
        </h2>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {STEP_LABELS.map((label, index) => (
          <div key={label} className="flex items-center gap-2.5">
            <div className="min-w-[96px] rounded-xl border border-[#f0b8a8]/30 bg-white/[0.06] px-[18px] py-3.5 text-center">
              <div className="font-heading text-xl font-bold text-[#f0b8a8]">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="mt-1 text-[13px] font-semibold text-[#eadfca]">
                {label}
              </div>
            </div>
            {index < STEP_LABELS.length - 1 && (
              <span className="text-lg text-[#f0b8a8]">&rarr;</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

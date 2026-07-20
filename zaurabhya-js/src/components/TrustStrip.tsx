const ITEMS = [
  "\u{1F33E} Own-farm production",
  "\u{1F3C6} Premium grade",
  "\u{1F4E6} Bulk supply",
  "\u{1F30D} Export ready",
  "\u{1F6D2} Available on Amazon",
];

export default function TrustStrip() {
  return (
    <div className="flex flex-wrap justify-center gap-x-9 gap-y-3 px-6 py-6 text-sm font-semibold text-ink-muted sm:px-8">
      {ITEMS.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

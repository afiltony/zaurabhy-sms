const stripeBackground = {
  backgroundColor: "#e7e0d1",
  backgroundImage:
    "repeating-linear-gradient(135deg, rgba(34,87,122,.06), rgba(34,87,122,.06) 9px, rgba(34,87,122,.11) 9px, rgba(34,87,122,.11) 18px)",
};

export default function PhotoPlaceholder({
  caption,
  className = "",
}: {
  caption: string;
  className?: string;
}) {
  return (
    <div
      style={stripeBackground}
      className={`flex items-end font-mono text-[10px] font-semibold tracking-wide text-ink-muted ${className}`}
    >
      <span className="p-3">[ {caption} ]</span>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

/** Whole-kilogram quantity input with large - / + controls that cannot go below the minimum order. */
export default function QuantityStepper({
  id,
  value,
  onChange,
  min,
  max,
}: {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  // While typing, the field may briefly hold a value below the minimum ("1" on the way to "15").
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-white">
      <button
        type="button"
        aria-label="Decrease quantity by 1 KG"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className="flex h-12 w-12 items-center justify-center rounded-full text-ink-soft transition hover:text-coral disabled:opacity-30"
      >
        <Minus className="h-5 w-5" />
      </button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        aria-label="Order quantity in KG"
        value={draft ?? String(value)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 5);
          setDraft(digits);
          const parsed = Number(digits);
          if (digits && parsed >= min && parsed <= max) onChange(parsed);
        }}
        onBlur={() => {
          if (draft !== null && draft !== "") onChange(clamp(Number(draft)));
          setDraft(null);
        }}
        className="w-14 bg-transparent text-center text-lg font-bold text-ink outline-none"
      />
      <span className="pr-1 text-sm font-semibold text-ink-muted">KG</span>
      <button
        type="button"
        aria-label="Increase quantity by 1 KG"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="flex h-12 w-12 items-center justify-center rounded-full text-ink-soft transition hover:text-coral disabled:opacity-30"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}

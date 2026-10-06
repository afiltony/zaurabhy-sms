import { REGIONAL_BREAKFAST_TERMS } from "@/lib/seo";

/**
 * "Healthy breakfast" in each major Indian language. Visible text (not just
 * meta tags) so search engines and AI assistants can match queries asked in
 * those languages.
 */
export default function RegionalBreakfastTerms() {
  return (
    <section>
      <h2 className="mt-8 font-heading text-lg font-bold text-ink">
        A healthy breakfast, in your language
      </h2>
      <p className="mt-3 text-base leading-relaxed text-ink-muted">
        Our high-fiber dosa rice makes a healthy breakfast of dosa, idli and appam — whatever
        you call them at home.
      </p>
      <ul className="mt-4 space-y-2">
        {REGIONAL_BREAKFAST_TERMS.map((term) => (
          <li
            key={term.lang}
            lang={term.lang}
            dir="auto"
            className="text-sm leading-relaxed text-ink-soft"
          >
            <span className="font-semibold text-ink">{term.language}:</span>{" "}
            {term.healthyBreakfast} — {term.healthyDosa}, {term.idli}, {term.appam} ·{" "}
            {term.dosaRice}
          </li>
        ))}
      </ul>
    </section>
  );
}

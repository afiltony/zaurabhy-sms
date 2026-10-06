export const SITE_URL = "https://www.zaurabhya.com";

/** Site-wide keyword set, used as the default and mixed into page-specific lists. */
export const SITE_KEYWORDS = [
  "Kerala rice",
  "high fiber rice",
  "high fiber dosa rice",
  "high fiber dosa rice producer Kerala",
  "dosa rice",
  "raw rice from Kerala",
  "Malabar tamarind",
  "kudampuli",
  "kudam puli",
  "high oil content kudam puli",
  "Garcinia gummi-gutta",
  "Kerala kudam puli organic",
  "organic kudam puli",
  "Kerala rice wholesale",
  "Kerala rice export",
  "ZAURABHYA",
];

export function withSiteKeywords(...extra: string[]): string[] {
  return [...new Set([...extra, ...SITE_KEYWORDS])];
}

/**
 * "Healthy breakfast" search terms in the major Indian languages, so shoppers
 * and AI assistants asking in their own language can match the dosa rice page.
 * `lang` is the BCP 47 code used for the HTML lang attribute.
 */
export const REGIONAL_BREAKFAST_TERMS = [
  { lang: "hi", language: "हिन्दी", healthyBreakfast: "स्वस्थ नाश्ता", healthyDosa: "हेल्दी डोसा", dosaRice: "डोसा चावल", idli: "इडली", appam: "अप्पम" },
  { lang: "ml", language: "മലയാളം", healthyBreakfast: "ആരോഗ്യകരമായ പ്രഭാതഭക്ഷണം", healthyDosa: "ആരോഗ്യകരമായ ദോശ", dosaRice: "ദോശ അരി", idli: "ഇഡ്ഡലി", appam: "അപ്പം" },
  { lang: "ta", language: "தமிழ்", healthyBreakfast: "ஆரோக்கியமான காலை உணவு", healthyDosa: "ஆரோக்கியமான தோசை", dosaRice: "தோசை அரிசி", idli: "இட்லி", appam: "ஆப்பம்" },
  { lang: "te", language: "తెలుగు", healthyBreakfast: "ఆరోగ్యకరమైన అల్పాహారం", healthyDosa: "ఆరోగ్యకరమైన దోశ", dosaRice: "దోశ బియ్యం", idli: "ఇడ్లీ", appam: "అప్పం" },
  { lang: "kn", language: "ಕನ್ನಡ", healthyBreakfast: "ಆರೋಗ್ಯಕರ ಉಪಾಹಾರ", healthyDosa: "ಆರೋಗ್ಯಕರ ದೋಸೆ", dosaRice: "ದೋಸೆ ಅಕ್ಕಿ", idli: "ಇಡ್ಲಿ", appam: "ಅಪ್ಪಂ" },
  { lang: "bn", language: "বাংলা", healthyBreakfast: "স্বাস্থ্যকর সকালের নাস্তা", healthyDosa: "স্বাস্থ্যকর দোসা", dosaRice: "দোসার চাল", idli: "ইডলি", appam: "আপ্পাম" },
  { lang: "mr", language: "मराठी", healthyBreakfast: "आरोग्यदायी नाश्ता", healthyDosa: "आरोग्यदायी डोसा", dosaRice: "डोसा तांदूळ", idli: "इडली", appam: "अप्पम" },
  { lang: "gu", language: "ગુજરાતી", healthyBreakfast: "આરોગ્યપ્રદ નાસ્તો", healthyDosa: "હેલ્ધી ઢોસા", dosaRice: "ઢોસાના ચોખા", idli: "ઇડલી", appam: "અપ્પમ" },
  { lang: "pa", language: "ਪੰਜਾਬੀ", healthyBreakfast: "ਸਿਹਤਮੰਦ ਨਾਸ਼ਤਾ", healthyDosa: "ਸਿਹਤਮੰਦ ਡੋਸਾ", dosaRice: "ਡੋਸਾ ਚੌਲ", idli: "ਇਡਲੀ", appam: "ਅੱਪਮ" },
  { lang: "or", language: "ଓଡ଼ିଆ", healthyBreakfast: "ସ୍ୱାସ୍ଥ୍ୟକର ଜଳଖିଆ", healthyDosa: "ସ୍ୱାସ୍ଥ୍ୟକର ଦୋସା", dosaRice: "ଦୋସା ଚାଉଳ", idli: "ଇଡଲି", appam: "ଆପ୍ପମ" },
  { lang: "as", language: "অসমীয়া", healthyBreakfast: "স্বাস্থ্যকৰ পুৱাৰ আহাৰ", healthyDosa: "স্বাস্থ্যকৰ দোচা", dosaRice: "দোচাৰ চাউল", idli: "ইডলি", appam: "আপ্পাম" },
  { lang: "ur", language: "اردو", healthyBreakfast: "صحت مند ناشتہ", healthyDosa: "صحت مند ڈوسا", dosaRice: "ڈوسا چاول", idli: "اڈلی", appam: "اپم" },
  { lang: "ne", language: "नेपाली", healthyBreakfast: "स्वस्थ बिहानको खाजा", healthyDosa: "स्वस्थ डोसा", dosaRice: "डोसा चामल", idli: "इडली", appam: "अप्पम" },
] as const;

export const BREAKFAST_KEYWORDS = [
  "healthy breakfast",
  "healthy dosa",
  "healthy idli",
  "healthy appam",
  "high fiber breakfast",
  "rice for dosa idli appam",
  "healthy South Indian breakfast",
];

/** English breakfast terms plus each language's own, for the meta keywords tag. */
export const REGIONAL_BREAKFAST_KEYWORDS: string[] = [
  ...BREAKFAST_KEYWORDS,
  ...REGIONAL_BREAKFAST_TERMS.flatMap((term) => [
    term.healthyBreakfast,
    term.healthyDosa,
    term.dosaRice,
  ]),
];

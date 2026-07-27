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

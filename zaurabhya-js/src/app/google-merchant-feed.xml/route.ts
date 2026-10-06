import { getMerchantListings, paiseToDecimal } from "@/lib/merchant";
import { getSettingsForDisplay } from "@/lib/prebooking/server";
import { SITE_URL } from "@/lib/seo";

// Product feed for Google Merchant Center (Google Shopping). Add this URL as a
// scheduled feed there; prices follow /admin/settings automatically.
export const revalidate = 300;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const listings = getMerchantListings(await getSettingsForDisplay());

  const items = listings
    .map((listing) => {
      const [image, ...moreImages] = listing.images;
      return `    <item>
      <g:id>${escapeXml(listing.id)}</g:id>
      <g:title>${escapeXml(listing.title)}</g:title>
      <g:description>${escapeXml(listing.description)}</g:description>
      <g:link>${escapeXml(listing.url)}</g:link>
      <g:image_link>${escapeXml(image)}</g:image_link>
${moreImages.map((src) => `      <g:additional_image_link>${escapeXml(src)}</g:additional_image_link>`).join("\n")}
      <g:availability>in_stock</g:availability>
      <g:price>${paiseToDecimal(listing.pricePaise)} INR</g:price>
      <g:unit_pricing_measure>${listing.minQuantityKg} kg</g:unit_pricing_measure>
      <g:unit_pricing_base_measure>1 kg</g:unit_pricing_base_measure>
      <g:brand>ZAURABHYA</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:product_type>${escapeXml(listing.productType)}</g:product_type>
      <g:shipping_weight>${listing.minQuantityKg} kg</g:shipping_weight>
      <g:shipping>
        <g:country>IN</g:country>
        <g:price>${paiseToDecimal(listing.shippingPaise)} INR</g:price>
      </g:shipping>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>ZAURABHYA</title>
    <link>${SITE_URL}</link>
    <description>Premium Kerala rice and Malabar tamarind, direct from our own farms.</description>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

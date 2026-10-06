import QRCode from "qrcode";
import type { PrebookingSettings } from "@/lib/prebooking/config";

export type UpiPaymentDetails = {
  vpa: string;
  payeeName: string;
  /** upi://pay link: opens the customer's UPI app on mobile with amount and order number filled in. */
  link: string;
  /** The same link as an SVG QR code, for scanning from another screen. */
  qrSvg: string;
};

export function buildUpiLink(
  upi: PrebookingSettings["upi"],
  amountPaise: number,
  orderNumber: string,
): string {
  // encodeURIComponent (not URLSearchParams) so spaces become %20; several UPI apps reject "+".
  const params = [
    ["pa", upi.vpa],
    ["pn", upi.payeeName],
    ["am", (amountPaise / 100).toFixed(2)],
    ["cu", "INR"],
    ["tn", orderNumber],
  ];
  return `upi://pay?${params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&")}`;
}

export async function buildUpiPaymentDetails(
  upi: PrebookingSettings["upi"],
  amountPaise: number,
  orderNumber: string,
): Promise<UpiPaymentDetails> {
  const link = buildUpiLink(upi, amountPaise, orderNumber);
  const qrSvg = await QRCode.toString(link, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  });
  return { vpa: upi.vpa, payeeName: upi.payeeName, link, qrSvg };
}

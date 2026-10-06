import { isPrebookingProductId, PREBOOKING_PRODUCTS } from "@/lib/prebooking/config";
import { formatInr } from "@/lib/prebooking/pricing";
import type { Order } from "@/lib/prebooking/service";

export type EmailMessage = { to: string; subject: string; html: string; text: string };

/** "Dosa Rice", "Malabar Tamarind": the product name without the brand, for subjects and headings. */
function shortName(order: Order) {
  return isPrebookingProductId(order.productId)
    ? PREBOOKING_PRODUCTS[order.productId].shortName
    : order.productName;
}

const CONTACT = { phone: "+91 73567 96946", email: "info@zaurabhya.com" };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return `${new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  })} IST`;
}

export function formatAddress(order: Order): string[] {
  return [
    order.addressLine1,
    order.addressLine2,
    `${order.city}, ${order.district}`,
    `${order.state} - ${order.pincode}`,
    order.country,
  ].filter((line): line is string => Boolean(line));
}

type Row = [label: string, value: string];

function amountRows(order: Order, totalLabel: string): Row[] {
  const rows: Row[] = [
    ["Product", order.productName],
    ["Quantity", `${order.quantityKg} KG`],
    ["Price per KG", formatInr(order.pricePerKgPaise)],
    ["Product Amount", formatInr(order.productAmountPaise)],
    ["Shipping Charge", formatInr(order.shippingAmountPaise)],
  ];
  if (order.taxAmountPaise > 0) rows.push(["Tax (GST)", formatInr(order.taxAmountPaise)]);
  rows.push([totalLabel, formatInr(order.grandTotalPaise)]);
  return rows;
}

function table(rows: Row[]) {
  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#5b5445;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:8px 0;color:#211d18;font-weight:600">${escapeHtml(value).replace(/\n/g, "<br/>")}</td></tr>`,
    )
    .join("");
  return `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:15px;width:100%">${body}</table>`;
}

function layout(heading: string, sections: string[]) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#211d18;max-width:560px;margin:0 auto;padding:16px">
<h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(heading)}</h1>
${sections.join("\n")}
</div>`;
}

function textRows(rows: Row[]) {
  return rows.map(([label, value]) => `${label}: ${value}`).join("\n");
}

/** Internal notification, sent only after the payment has been verified. */
export function buildAdminPaidEmail(order: Order, to: string): EmailMessage {
  const summary: Row[] = [
    ["ORDER NUMBER", order.orderNumber],
    ["CUSTOMER", order.customerName],
    ["PHONE", order.customerPhone],
    ["PRODUCT", shortName(order)],
    ["QUANTITY", `${order.quantityKg} KG`],
    ["TOTAL PAID", formatInr(order.grandTotalPaise)],
    ["PAYMENT STATUS", order.paymentStatus],
  ];
  const details: Row[] = [
    ["Payment Transaction ID", order.paymentReference ?? "-"],
    ["Payment Date/Time", formatDateTime(order.paidAt)],
    ["Email", order.customerEmail],
    ["Delivery Address", formatAddress(order).join("\n")],
    ...(order.gstNumber ? ([["GST Number", order.gstNumber]] as Row[]) : []),
    ...amountRows(order, "Grand Total"),
    ["Shipping Method", order.shippingMethod],
  ];

  return {
    to,
    subject: `NEW PAID ${shortName(order).toUpperCase()} ORDER — ${order.orderNumber}`,
    html: layout(`New paid ${shortName(order)} pre-booking`, [
      `<div style="background:#f4ffff;border:1px solid #00aaad;border-radius:12px;padding:12px 16px;margin-bottom:16px">${table(summary)}</div>`,
      table(details),
    ]),
    text: `${textRows(summary)}\n\n${textRows(details)}`,
  };
}

export function buildCustomerConfirmationEmail(order: Order): EmailMessage {
  const rows: Row[] = [
    ["Order Number", order.orderNumber],
    ["Payment Status", order.paymentStatus],
    ...amountRows(order, "Total Paid"),
    ["Shipping Method", order.shippingMethod],
    ["Delivery Address", formatAddress(order).join("\n")],
  ];
  const nextStep =
    "We will now process your pre-booking and arrange dispatch through parcel service. We will contact you on your mobile number when your order is dispatched.";
  const contact = `Questions? Call or WhatsApp ${CONTACT.phone} or email ${CONTACT.email} and mention your order number.`;

  return {
    to: order.customerEmail,
    subject: `Zaurabhya ${shortName(order)} Pre-Booking Confirmed — ${order.orderNumber}`,
    html: layout("Thank you for your pre-booking", [
      `<p>Hi ${escapeHtml(order.customerName)},</p>`,
      `<p>We have received your payment and your ${escapeHtml(order.productName)} pre-booking is confirmed.</p>`,
      table(rows),
      `<p style="margin-top:16px"><strong>What happens next:</strong> ${escapeHtml(nextStep)}</p>`,
      `<p>${escapeHtml(contact)}</p>`,
      `<p>Thanks,<br/>Team Zaurabhya</p>`,
    ]),
    text: `Hi ${order.customerName},\n\nWe have received your payment and your ${order.productName} pre-booking is confirmed.\n\n${textRows(rows)}\n\nWhat happens next: ${nextStep}\n\n${contact}\n\nTeam Zaurabhya`,
  };
}

/** Tells the admin that a customer says they have paid, so the payment can be checked. */
export function buildAdminVerifyEmail(order: Order, to: string, adminUrl: string): EmailMessage {
  const rows: Row[] = [
    ["ORDER NUMBER", order.orderNumber],
    ["AMOUNT TO FIND", formatInr(order.grandTotalPaise)],
    ["UPI REFERENCE (UTR)", order.paymentReference ?? "-"],
    ["CUSTOMER", order.customerName],
    ["PHONE", order.customerPhone],
    ["PRODUCT", shortName(order)],
    ["QUANTITY", `${order.quantityKg} KG`],
  ];
  const instruction =
    "The customer reports paying by UPI. This is NOT yet confirmed. Check your Paytm / bank statement for this amount and reference, then mark the order as paid or not received.";

  return {
    to,
    subject: `PAYMENT TO VERIFY — ${order.orderNumber} — ${formatInr(order.grandTotalPaise)}`,
    html: layout(`${shortName(order)} payment waiting for verification`, [
      `<p>${escapeHtml(instruction)}</p>`,
      table(rows),
      `<p style="margin-top:20px"><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#e26d5c;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:999px">Open order in admin</a></p>`,
    ]),
    text: `${instruction}\n\n${textRows(rows)}\n\n${adminUrl}`,
  };
}

/** Sent when the admin could not find the reported payment. Deliberately not a confirmation. */
export function buildCustomerPaymentNotFoundEmail(order: Order, retryUrl: string): EmailMessage {
  const message = `We could not find a UPI payment of ${formatInr(order.grandTotalPaise)} matching the reference you submitted for order ${order.orderNumber}, so your pre-booking has NOT been confirmed.`;
  const help = `If money was debited from your account, please reply to this email or call ${CONTACT.phone} with a screenshot of the payment. Otherwise you can complete the payment using the link below.`;

  return {
    to: order.customerEmail,
    subject: `Payment not verified — Zaurabhya order ${order.orderNumber}`,
    html: layout("We could not verify your payment", [
      `<p>Hi ${escapeHtml(order.customerName)},</p>`,
      `<p>${escapeHtml(message)}</p>`,
      `<p>${escapeHtml(help)}</p>`,
      `<p><a href="${escapeHtml(retryUrl)}">Complete your payment</a></p>`,
      `<p>Team Zaurabhya</p>`,
    ]),
    text: `Hi ${order.customerName},\n\n${message}\n\n${help}\n\n${retryUrl}\n\nTeam Zaurabhya`,
  };
}

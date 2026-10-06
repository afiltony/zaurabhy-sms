"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { INDIAN_STATES } from "@/data/shipping";
import {
  endAdminSession,
  isCorrectPassword,
  requireAdmin,
  startAdminSession,
} from "@/lib/prebooking/admin-auth";
import {
  ORDER_STATUSES,
  PREBOOKING_PRODUCT_IDS,
  SHIPPING_CALCULATION_TYPES,
  type OrderStatus,
  type ShippingRate,
} from "@/lib/prebooking/config";
import { getBaseUrl, getClientIp, isRateLimited } from "@/lib/prebooking/http";
import { rupeesToPaise } from "@/lib/prebooking/pricing";
import { prebooking } from "@/lib/prebooking/server";
import { PrebookingError } from "@/lib/prebooking/service";

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

/** "1,265.00" -> 126500 paise. Returns NaN for anything that is not a plain amount. */
function paise(form: FormData, name: string): number {
  const raw = text(form, name).replace(/[₹,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return Number.NaN;
  return rupeesToPaise(Number(raw));
}

function describe(err: unknown): string {
  if (err instanceof PrebookingError) {
    const issue = err.issues?.[0];
    return issue ? `${issue.path.join(".")}: ${issue.message}` : err.message;
  }
  console.error("Admin action failed:", err);
  return "Something went wrong. Please try again.";
}

/** Runs an admin mutation, then returns to `path` with a success or error banner. */
async function run(path: string, success: string, action: () => Promise<unknown>): Promise<never> {
  await requireAdmin();
  let query: string;
  try {
    await action();
    query = `notice=${encodeURIComponent(success)}`;
  } catch (err) {
    query = `error=${encodeURIComponent(describe(err))}`;
  }
  revalidatePath("/admin", "layout");
  redirect(`${path}?${query}`);
}

export async function loginAction(form: FormData) {
  const ip = getClientIp(await headers());
  if (isRateLimited(`admin-login:${ip}`, 5, 15 * 60_000)) {
    redirect("/admin/login?error=locked");
  }
  if (!isCorrectPassword(text(form, "password"))) {
    redirect("/admin/login?error=invalid");
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}

export async function confirmPaymentAction(form: FormData) {
  const orderNumber = text(form, "orderNumber");
  await run(`/admin/orders/${orderNumber}`, "Payment verified. Order marked PAID.", async () => {
    const amountReceivedPaise = paise(form, "amountReceived");
    if (Number.isNaN(amountReceivedPaise)) {
      throw new PrebookingError("VALIDATION", "Enter the amount received in rupees, e.g. 1265");
    }
    await prebooking.confirmPayment({
      orderNumber,
      amountReceivedPaise,
      reference: text(form, "reference"),
      note: text(form, "note"),
    });
  });
}

export async function rejectPaymentAction(form: FormData) {
  const orderNumber = text(form, "orderNumber");
  const baseUrl = getBaseUrl(await headers());
  await run(`/admin/orders/${orderNumber}`, "Marked as payment not received.", () =>
    prebooking.rejectPayment({ orderNumber, note: text(form, "note"), baseUrl }),
  );
}

export async function updateOrderStatusAction(form: FormData) {
  const orderNumber = text(form, "orderNumber");
  await run(`/admin/orders/${orderNumber}`, "Order status updated.", async () => {
    const status = text(form, "orderStatus") as OrderStatus;
    if (!ORDER_STATUSES.includes(status)) {
      throw new PrebookingError("VALIDATION", "Unknown order status");
    }
    await prebooking.updateOrderStatus(orderNumber, status);
  });
}

export async function markRefundPendingAction(form: FormData) {
  const orderNumber = text(form, "orderNumber");
  await run(`/admin/orders/${orderNumber}`, "Marked as refund pending.", () =>
    prebooking.markRefundPending(orderNumber),
  );
}

export async function resendEmailsAction(form: FormData) {
  const orderNumber = text(form, "orderNumber");
  await run(`/admin/orders/${orderNumber}`, "Confirmation emails sent.", async () => {
    const order = await prebooking.getOrder(orderNumber);
    const result = order && (await prebooking.sendConfirmationEmails(order.id));
    if (!result) {
      throw new PrebookingError("CONFLICT", "Confirmation emails are only sent for paid orders.");
    }
    if (result.admin === "failed" || result.customer === "failed") {
      throw new PrebookingError("CONFLICT", "Email could not be sent. Check the SMTP settings.");
    }
  });
}

export async function saveSettingsAction(form: FormData) {
  await run("/admin/settings", "Settings saved.", async () => {
    const rate = (prefix: string): ShippingRate => ({
      basePaise: paise(form, `${prefix}Base`),
      perKgPaise: paise(form, `${prefix}PerKg`),
    });

    const stateRates: Record<string, ShippingRate> = {};
    INDIAN_STATES.forEach((state, index) => {
      const base = text(form, `state${index}Base`);
      const perKg = text(form, `state${index}PerKg`);
      if (!base && !perKg) return;
      stateRates[state] = {
        basePaise: base ? paise(form, `state${index}Base`) : 0,
        perKgPaise: perKg ? paise(form, `state${index}PerKg`) : 0,
      };
    });

    const calculationType = text(form, "calculationType");
    await prebooking.saveSettings({
      products: Object.fromEntries(
        PREBOOKING_PRODUCT_IDS.map((id) => [
          id,
          {
            pricePerKgPaise: paise(form, `${id}__pricePerKg`),
            minQuantityKg: Number(text(form, `${id}__minQuantityKg`)),
            maxQuantityKg: Number(text(form, `${id}__maxQuantityKg`)),
          },
        ]),
      ),
      shippingMethod: text(form, "shippingMethod"),
      shipping: {
        enabled: form.get("shippingEnabled") === "on",
        calculationType: SHIPPING_CALCULATION_TYPES.find((type) => type === calculationType),
        flatChargePaise: paise(form, "flatCharge"),
        basePaise: paise(form, "weightBase"),
        perKgPaise: paise(form, "weightPerKg"),
        zoneRates: { kerala: rate("kerala"), south: rate("south"), national: rate("national") },
        stateRates,
      },
      taxPercent: Number(text(form, "taxPercent")),
      upi: { vpa: text(form, "upiVpa"), payeeName: text(form, "upiPayeeName") },
    });
    // Product and listing pages cache the price; refresh them now.
    revalidatePath("/", "layout");
  });
}

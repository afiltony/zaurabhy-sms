import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type PrebookingSettings } from "@/lib/prebooking/config";
import { createSqliteDb, ensureSchema, type Db } from "@/lib/prebooking/db";
import type { EmailMessage } from "@/lib/prebooking/emails";
import { computeQuote, computeShippingPaise, formatInr } from "@/lib/prebooking/pricing";
import {
  createPrebookingService,
  PrebookingError,
  toPublicOrder,
} from "@/lib/prebooking/service";
import { buildUpiLink } from "@/lib/prebooking/upi";

const BASE_URL = "https://www.zaurabhya.com";

const VALID = {
  fullName: "Anjali Menon",
  phone: "98765 43210",
  email: "anjali@example.com",
  addressLine1: "12 Temple Road",
  addressLine2: "",
  city: "Changanassery",
  district: "Kottayam",
  state: "Kerala",
  pincode: "686101",
  country: "India",
  gstNumber: "",
  productId: "dosa-rice",
  quantityKg: 10,
};

/** Default settings with the Dosa Rice product settings partly replaced. */
const withDosa = (override: Partial<PrebookingSettings["products"]["dosa-rice"]>) => ({
  ...DEFAULT_SETTINGS,
  products: {
    ...DEFAULT_SETTINGS.products,
    "dosa-rice": { ...DEFAULT_SETTINGS.products["dosa-rice"], ...override },
  },
});

let tokenCounter = 0;
const newToken = () => `test-token-${String(++tokenCounter).padStart(12, "0")}`;

async function setup(options: { failEmail?: () => boolean } = {}) {
  const db = await createSqliteDb(":memory:");
  await ensureSchema(db);
  const sent: EmailMessage[] = [];
  const clock = { now: new Date("2026-10-06T06:00:00.000Z") };
  const service = createPrebookingService({
    getDb: async () => db,
    mailer: {
      async send(message) {
        if (options.failEmail?.()) throw new Error("SMTP down");
        sent.push(message);
      },
    },
    adminEmail: "lscctony@gmail.com",
    now: () => clock.now,
  });
  const confirmations = () =>
    sent.filter(
      (m) => m.subject.startsWith("NEW PAID") || m.subject.includes("Pre-Booking Confirmed"),
    );
  return { db, service, sent, clock, confirmations };
}

async function countOrders(db: Db) {
  const [row] = await db.query<{ total: number }>("SELECT COUNT(*) AS total FROM prebooking_orders");
  return Number(row.total);
}

async function expectError(promise: Promise<unknown>, code: string) {
  const err = await promise.then(
    () => null,
    (e) => e,
  );
  expect(err).toBeInstanceOf(PrebookingError);
  expect((err as PrebookingError).code).toBe(code);
  return err as PrebookingError;
}

describe("pricing", () => {
  it.each([
    [10, 950_00],
    [11, 1045_00],
    [50, 4750_00],
    [100, 9500_00],
  ])("%i KG costs quantity x ₹95", (quantityKg, expected) => {
    const quote = computeQuote(DEFAULT_SETTINGS, "dosa-rice", quantityKg, "Kerala");
    expect(quote.productAmountPaise).toBe(expected);
    expect(quote.grandTotalPaise).toBe(expected + quote.shippingAmountPaise);
  });

  it("formats rupees the Indian way without stray decimals", () => {
    expect(formatInr(950_00)).toBe("₹950");
    expect(formatInr(1900_00)).toBe("₹1,900");
    expect(formatInr(4750_00)).toBe("₹4,750");
    expect(formatInr(9500_00)).toBe("₹9,500");
    expect(formatInr(1_25_000_50)).toBe("₹1,25,000.50");
  });
});

describe("shipping engine", () => {
  const shipping = DEFAULT_SETTINGS.shipping;

  it("flat: one configured charge per order", () => {
    const flat = { ...shipping, calculationType: "flat" as const, flatChargePaise: 250_00 };
    expect(computeShippingPaise(flat, 10, "Kerala")).toBe(250_00);
    expect(computeShippingPaise(flat, 100, "Delhi")).toBe(250_00);
  });

  it("weight based: base + quantity x per kg", () => {
    const weight = {
      ...shipping,
      calculationType: "weight" as const,
      basePaise: 50_00,
      perKgPaise: 20_00,
    };
    expect(computeShippingPaise(weight, 10, "Kerala")).toBe(250_00);
    expect(computeShippingPaise(weight, 50, "Kerala")).toBe(1050_00);
  });

  it("state based: zone rate, overridden per state when configured", () => {
    expect(computeShippingPaise(shipping, 10, "Kerala")).toBe(315_00);
    expect(computeShippingPaise(shipping, 10, "Tamil Nadu")).toBe(425_00);
    expect(computeShippingPaise(shipping, 10, "Delhi")).toBe(590_00);
    const withOverride = {
      ...shipping,
      stateRates: { Delhi: { basePaise: 100_00, perKgPaise: 10_00 } },
    };
    expect(computeShippingPaise(withOverride, 10, "Delhi")).toBe(200_00);
  });

  it("disabled shipping charges nothing, and tax applies to product + shipping", () => {
    expect(computeShippingPaise({ ...shipping, enabled: false }, 10, "Kerala")).toBe(0);
    const taxed: PrebookingSettings = { ...DEFAULT_SETTINGS, taxPercent: 5 };
    const quote = computeQuote(taxed, "dosa-rice", 10, "Kerala");
    expect(quote.taxAmountPaise).toBe(Math.round((950_00 + 315_00) * 0.05));
    expect(quote.grandTotalPaise).toBe(950_00 + 315_00 + quote.taxAmountPaise);
  });

  it("uses shipping settings saved by the admin", async () => {
    const { service } = await setup();
    await service.saveSettings({
      ...DEFAULT_SETTINGS,
      shipping: { ...DEFAULT_SETTINGS.shipping, calculationType: "flat", flatChargePaise: 123_00 },
    });
    const quote = await service.quote({ productId: "dosa-rice", quantityKg: 20, state: "Goa" });
    expect(quote.shippingAmountPaise).toBe(123_00);
    expect(quote.grandTotalPaise).toBe(1900_00 + 123_00);
  });
});

describe("order validation", () => {
  it.each([
    ["quantity below 10", { quantityKg: 9 }],
    ["decimal quantity 10.5", { quantityKg: 10.5 }],
    ["quantity sent as text", { quantityKg: "10" }],
    ["missing customer name", { fullName: "" }],
    ["invalid mobile", { phone: "12345" }],
    ["mobile not starting 6-9", { phone: "5876543210" }],
    ["invalid email", { email: "not-an-email" }],
    ["invalid PIN code", { pincode: "68610" }],
    ["PIN code starting with 0", { pincode: "012345" }],
    ["unknown state", { state: "Atlantis" }],
    ["invalid GSTIN", { gstNumber: "ABC" }],
  ])("rejects %s", async (_name, override) => {
    const { service, db } = await setup();
    await expectError(
      service.createOrder({ ...VALID, ...override, clientToken: newToken() }),
      "VALIDATION",
    );
    expect(await countOrders(db)).toBe(0);
  });

  it("normalises the mobile number and accepts a valid GSTIN", async () => {
    const { service } = await setup();
    const { order } = await service.createOrder({
      ...VALID,
      phone: "+91 98765-43210",
      gstNumber: "32abcde1234f1z5",
      clientToken: newToken(),
    });
    expect(order.customerPhone).toBe("9876543210");
    expect(order.gstNumber).toBe("32ABCDE1234F1Z5");
  });
});

describe("order creation", () => {
  it("creates a PENDING order with server-calculated amounts, ignoring browser totals", async () => {
    const { service, sent } = await setup();
    const { order, created } = await service.createOrder({
      ...VALID,
      clientToken: newToken(),
      grandTotalPaise: 1,
      productAmountPaise: 1,
      shippingAmountPaise: 0,
      paymentStatus: "PAID",
    });
    expect(created).toBe(true);
    expect(order.orderNumber).toBe("ZR-DR-20261006-0001");
    expect(order.productAmountPaise).toBe(950_00);
    expect(order.shippingAmountPaise).toBe(315_00);
    expect(order.grandTotalPaise).toBe(1265_00);
    expect(order.paymentStatus).toBe("PENDING");
    expect(order.orderStatus).toBe("PENDING");
    expect(order.shippingMethod).toBe("Parcel Service");
    expect(sent).toHaveLength(0);
  });

  it("issues unique sequential order numbers under concurrent requests", async () => {
    const { service } = await setup();
    const results = await Promise.all(
      Array.from({ length: 25 }, () => service.createOrder({ ...VALID, clientToken: newToken() })),
    );
    const numbers = results.map((r) => r.order.orderNumber).sort();
    expect(new Set(numbers).size).toBe(25);
    expect(numbers[0]).toBe("ZR-DR-20261006-0001");
    expect(numbers[24]).toBe("ZR-DR-20261006-0025");
  });

  it("uses the Indian calendar day in the order number", async () => {
    const { service, clock } = await setup();
    clock.now = new Date("2026-10-06T19:00:00.000Z"); // 00:30 IST on the 7th
    const { order } = await service.createOrder({ ...VALID, clientToken: newToken() });
    expect(order.orderNumber).toBe("ZR-DR-20261007-0001");
  });

  it("browser refresh / resubmission reuses the same order instead of duplicating it", async () => {
    const { service, db } = await setup();
    const clientToken = newToken();
    const first = await service.createOrder({ ...VALID, clientToken });
    const [second, third] = await Promise.all([
      service.createOrder({ ...VALID, clientToken }),
      service.createOrder({ ...VALID, quantityKg: 20, city: "Kottayam", clientToken }),
    ]);
    expect(second.order.orderNumber).toBe(first.order.orderNumber);
    expect(third.order.orderNumber).toBe(first.order.orderNumber);
    expect(await countOrders(db)).toBe(1);

    const latest = (await service.getOrder(first.order.orderNumber))!;
    expect([10, 20]).toContain(latest.quantityKg);
    expect(latest.productAmountPaise).toBe(latest.quantityKg * 95_00);
  });

  it("fails cleanly, creating nothing, when the database is down", async () => {
    const service = createPrebookingService({
      getDb: async () => {
        throw new Error("ECONNREFUSED");
      },
      mailer: { send: async () => {} },
      adminEmail: "lscctony@gmail.com",
    });
    await expect(service.createOrder({ ...VALID, clientToken: newToken() })).rejects.toThrow(
      "ECONNREFUSED",
    );
  });
});

describe("payment", () => {
  async function placed(ctx: Awaited<ReturnType<typeof setup>>, quantityKg = 10) {
    const clientToken = newToken();
    const { order } = await ctx.service.createOrder({ ...VALID, quantityKg, clientToken });
    return { order, clientToken };
  }
  const submit = (
    ctx: Awaited<ReturnType<typeof setup>>,
    orderNumber: string,
    clientToken: string,
    reference = "412345678901",
  ) => ctx.service.submitPaymentReference({ orderNumber, clientToken, reference, baseUrl: BASE_URL });

  it("pending: a submitted reference only queues the order for verification", async () => {
    const ctx = await setup();
    const { order, clientToken } = await placed(ctx);
    const updated = await submit(ctx, order.orderNumber, clientToken);

    expect(updated.paymentStatus).toBe("PAYMENT_INITIATED");
    expect(updated.orderStatus).toBe("PENDING");
    expect(updated.paidAt).toBeNull();
    expect(ctx.confirmations()).toHaveLength(0);
    expect(ctx.sent).toHaveLength(1);
    expect(ctx.sent[0].to).toBe("lscctony@gmail.com");
    expect(ctx.sent[0].subject).toContain("PAYMENT TO VERIFY");
  });

  it("successful: admin verification marks the order PAID and sends both emails once", async () => {
    const ctx = await setup();
    const { order, clientToken } = await placed(ctx);
    await submit(ctx, order.orderNumber, clientToken);
    const { order: paid, alreadyPaid } = await ctx.service.confirmPayment({
      orderNumber: order.orderNumber,
      amountReceivedPaise: 1265_00,
      reference: "412345678901",
    });

    expect(alreadyPaid).toBe(false);
    expect(paid.paymentStatus).toBe("PAID");
    expect(paid.orderStatus).toBe("CONFIRMED");
    expect(paid.paidAt).toBe("2026-10-06T06:00:00.000Z");

    const [admin, customer] = ctx.confirmations();
    expect(ctx.confirmations()).toHaveLength(2);
    expect(admin.to).toBe("lscctony@gmail.com");
    expect(admin.subject).toBe(`NEW PAID DOSA RICE ORDER — ${order.orderNumber}`);
    expect(customer.to).toBe("anjali@example.com");
    expect(customer.subject).toBe(
      `Zaurabhya Dosa Rice Pre-Booking Confirmed — ${order.orderNumber}`,
    );
    for (const text of ["₹1,265", "₹950", "₹315", "10 KG", "412345678901", "686101"]) {
      expect(admin.html).toContain(text);
    }
  });

  it("incorrect payment amount: the order is not marked paid", async () => {
    const ctx = await setup();
    const { order, clientToken } = await placed(ctx);
    await submit(ctx, order.orderNumber, clientToken);
    await expectError(
      ctx.service.confirmPayment({
        orderNumber: order.orderNumber,
        amountReceivedPaise: 950_00,
        reference: "412345678901",
      }),
      "AMOUNT_MISMATCH",
    );
    expect((await ctx.service.getOrder(order.orderNumber))!.paymentStatus).toBe("PAYMENT_INITIATED");
    expect(ctx.confirmations()).toHaveLength(0);
  });

  it("failed: a payment that was not received sends no confirmation", async () => {
    const ctx = await setup();
    const { order, clientToken } = await placed(ctx);
    await submit(ctx, order.orderNumber, clientToken);
    const failed = await ctx.service.rejectPayment({
      orderNumber: order.orderNumber,
      note: "Not in statement",
      baseUrl: BASE_URL,
    });

    expect(failed.paymentStatus).toBe("FAILED");
    expect(failed.orderStatus).toBe("PENDING");
    expect(ctx.confirmations()).toHaveLength(0);
    const notice = ctx.sent.at(-1)!;
    expect(notice.to).toBe("anjali@example.com");
    expect(notice.subject).toContain("Payment not verified");
    expect(notice.html).toContain("NOT been confirmed");
  });

  it("retry: a failed order accepts a new reference without creating a second order", async () => {
    const ctx = await setup();
    const { order, clientToken } = await placed(ctx);
    await submit(ctx, order.orderNumber, clientToken, "111111111111");
    await ctx.service.rejectPayment({ orderNumber: order.orderNumber, baseUrl: BASE_URL });

    const retried = await submit(ctx, order.orderNumber, clientToken, "222222222222");
    expect(retried.orderNumber).toBe(order.orderNumber);
    expect(retried.paymentStatus).toBe("PAYMENT_INITIATED");
    expect(retried.paymentReference).toBe("222222222222");
    expect(await countOrders(ctx.db)).toBe(1);

    const { order: paid } = await ctx.service.confirmPayment({
      orderNumber: order.orderNumber,
      amountReceivedPaise: order.grandTotalPaise,
      reference: "222222222222",
    });
    expect(paid.paymentStatus).toBe("PAID");
  });

  it("duplicate confirmation: repeated or simultaneous verification sends emails once", async () => {
    const ctx = await setup();
    const { order, clientToken } = await placed(ctx);
    await submit(ctx, order.orderNumber, clientToken);
    const confirm = () =>
      ctx.service.confirmPayment({
        orderNumber: order.orderNumber,
        amountReceivedPaise: 1265_00,
        reference: "412345678901",
      });

    const results = await Promise.all([confirm(), confirm(), confirm()]);
    await confirm();
    expect(results.filter((r) => !r.alreadyPaid)).toHaveLength(1);
    expect(ctx.confirmations()).toHaveLength(2);
    expect(await countOrders(ctx.db)).toBe(1);

    // A duplicate submission of the same reference by the customer changes nothing either.
    const again = await submit(ctx, order.orderNumber, clientToken);
    expect(again.paymentStatus).toBe("PAID");
    expect(ctx.confirmations()).toHaveLength(2);
  });

  it("email failure: the order stays PAID and the emails can be re-sent later", async () => {
    let smtpDown = true;
    const ctx = await setup({ failEmail: () => smtpDown });
    const { order, clientToken } = await placed(ctx);
    await submit(ctx, order.orderNumber, clientToken);
    const { order: paid } = await ctx.service.confirmPayment({
      orderNumber: order.orderNumber,
      amountReceivedPaise: 1265_00,
      reference: "412345678901",
    });

    expect(paid.paymentStatus).toBe("PAID");
    expect(paid.customerEmailSentAt).toBeNull();
    expect(paid.adminEmailSentAt).toBeNull();
    expect(toPublicOrder(paid).confirmationEmailSent).toBe(false);

    smtpDown = false;
    expect(await ctx.service.sendConfirmationEmails(paid.id)).toEqual({
      admin: "sent",
      customer: "sent",
    });
    expect(await ctx.service.sendConfirmationEmails(paid.id)).toEqual({
      admin: "already-sent",
      customer: "already-sent",
    });
    expect(ctx.confirmations()).toHaveLength(2);
  });

  it("customer returning to the confirmation URL sees the order and triggers nothing", async () => {
    const ctx = await setup();
    const { order, clientToken } = await placed(ctx);
    await submit(ctx, order.orderNumber, clientToken);
    await ctx.service.confirmPayment({
      orderNumber: order.orderNumber,
      amountReceivedPaise: 1265_00,
      reference: "412345678901",
    });
    const emailsBefore = ctx.sent.length;

    for (let visit = 0; visit < 3; visit++) {
      const view = toPublicOrder((await ctx.service.getOrder(order.orderNumber))!);
      expect(view.paymentStatus).toBe("PAID");
      expect(view.grandTotalPaise).toBe(1265_00);
      expect(view.confirmationEmailSent).toBe(true);
      expect(JSON.stringify(view)).not.toMatch(/anjali|9876543210|Temple Road|test-token/);
    }
    expect(ctx.sent).toHaveLength(emailsBefore);
    expect(await ctx.service.getOrder("ZR-DR-20261006-9999")).toBeNull();
    expect(await ctx.service.getOrder("'; DROP TABLE prebooking_orders; --")).toBeNull();
  });

  it("rejects a reference from the wrong browser, a malformed one, and one already used", async () => {
    const ctx = await setup();
    const first = await placed(ctx);
    const second = await placed(ctx);

    await expectError(submit(ctx, first.order.orderNumber, second.clientToken), "FORBIDDEN");
    await expectError(submit(ctx, first.order.orderNumber, first.clientToken, "12345"), "VALIDATION");
    await submit(ctx, first.order.orderNumber, first.clientToken, "333333333333");
    await expectError(
      submit(ctx, second.order.orderNumber, second.clientToken, "333333333333"),
      "CONFLICT",
    );
    await expectError(
      submit(ctx, first.order.orderNumber, first.clientToken, "444444444444"),
      "CONFLICT",
    );
  });

  it("freezes the order once a reference is submitted", async () => {
    const ctx = await setup();
    const { order, clientToken } = await placed(ctx);
    await submit(ctx, order.orderNumber, clientToken);
    const { order: after } = await ctx.service.createOrder({ ...VALID, quantityKg: 99, clientToken });
    expect(after.quantityKg).toBe(10);
    expect(after.grandTotalPaise).toBe(1265_00);
  });

  it("expires unpaid orders after 48 hours, but not ones awaiting verification", async () => {
    const ctx = await setup();
    const abandoned = await placed(ctx);
    const waiting = await placed(ctx);
    await submit(ctx, waiting.order.orderNumber, waiting.clientToken);

    ctx.clock.now = new Date("2026-10-08T07:00:00.000Z");
    expect((await ctx.service.getOrder(abandoned.order.orderNumber))!.paymentStatus).toBe("EXPIRED");
    expect((await ctx.service.getOrder(waiting.order.orderNumber))!.paymentStatus).toBe(
      "PAYMENT_INITIATED",
    );
    await expectError(submit(ctx, abandoned.order.orderNumber, abandoned.clientToken), "CONFLICT");
  });
});

describe("admin order management", () => {
  it("will not fulfil an unpaid order, and tracks refunds on paid ones", async () => {
    const ctx = await setup();
    const clientToken = newToken();
    const { order } = await ctx.service.createOrder({ ...VALID, clientToken });
    await expectError(ctx.service.updateOrderStatus(order.orderNumber, "SHIPPED"), "CONFLICT");
    await expectError(ctx.service.updateOrderStatus(order.orderNumber, "REFUNDED"), "CONFLICT");

    await ctx.service.confirmPayment({
      orderNumber: order.orderNumber,
      amountReceivedPaise: order.grandTotalPaise,
      reference: "555555555555",
    });
    expect((await ctx.service.updateOrderStatus(order.orderNumber, "SHIPPED")).orderStatus).toBe(
      "SHIPPED",
    );
    expect((await ctx.service.markRefundPending(order.orderNumber)).paymentStatus).toBe(
      "REFUND_PENDING",
    );
    const refunded = await ctx.service.updateOrderStatus(order.orderNumber, "REFUNDED");
    expect(refunded.paymentStatus).toBe("REFUNDED");
  });

  it("cancelling an unpaid order cancels its payment and lists by status", async () => {
    const ctx = await setup();
    const { order } = await ctx.service.createOrder({ ...VALID, clientToken: newToken() });
    await ctx.service.createOrder({ ...VALID, clientToken: newToken() });
    const cancelled = await ctx.service.updateOrderStatus(order.orderNumber, "CANCELLED");
    expect(cancelled.paymentStatus).toBe("CANCELLED");

    const all = await ctx.service.listOrders({ limit: 10, offset: 0 });
    expect(all.total).toBe(2);
    expect(all.orders[0].orderNumber).toBe("ZR-DR-20261006-0002");
    const pending = await ctx.service.listOrders({ paymentStatus: "PENDING", limit: 10, offset: 0 });
    expect(pending.total).toBe(1);
  });

  it("rejects invalid settings and keeps the previous ones", async () => {
    const { service } = await setup();
    await expectError(
      service.saveSettings(withDosa({ minQuantityKg: 50, maxQuantityKg: 20 })),
      "VALIDATION",
    );
    await service.saveSettings(withDosa({ pricePerKgPaise: 100_00, minQuantityKg: 5 }));
    const quote = await service.quote({ productId: "dosa-rice", quantityKg: 5, state: "Kerala" });
    expect(quote.productAmountPaise).toBe(500_00);
  });
});

describe("Malabar Tamarind pre-booking", () => {
  const TAMARIND = { ...VALID, productId: "malabar-tamarind" };

  it("uses its own price, order-number series and email wording", async () => {
    const ctx = await setup();
    const clientToken = newToken();
    const { order } = await ctx.service.createOrder({ ...TAMARIND, clientToken });
    expect(order.orderNumber).toBe("ZR-MT-20261006-0001");
    expect(order.productId).toBe("malabar-tamarind");
    expect(order.productName).toBe("Zaurabhya Malabar Tamarind");
    expect(order.pricePerKgPaise).toBe(450_00);
    expect(order.productAmountPaise).toBe(4500_00);
    expect(order.grandTotalPaise).toBe(4500_00 + 315_00);

    // Dosa Rice keeps its own sequence on the same day.
    const dosa = await ctx.service.createOrder({ ...VALID, clientToken: newToken() });
    expect(dosa.order.orderNumber).toBe("ZR-DR-20261006-0001");

    await ctx.service.submitPaymentReference({
      orderNumber: order.orderNumber,
      clientToken,
      reference: "712345678901",
      baseUrl: BASE_URL,
    });
    await ctx.service.confirmPayment({
      orderNumber: order.orderNumber,
      amountReceivedPaise: order.grandTotalPaise,
      reference: "712345678901",
    });
    const subjects = ctx.sent.map((m) => m.subject);
    expect(subjects).toContain("NEW PAID MALABAR TAMARIND ORDER — ZR-MT-20261006-0001");
    expect(subjects).toContain(
      "Zaurabhya Malabar Tamarind Pre-Booking Confirmed — ZR-MT-20261006-0001",
    );
    expect(ctx.sent.at(-1)!.html).not.toContain("Dosa");
  });

  it("applies its own quantity limits and rejects unknown products", async () => {
    const { service } = await setup();
    const minimum = await service.createOrder({ ...TAMARIND, quantityKg: 5, clientToken: newToken() });
    expect(minimum.order.productAmountPaise).toBe(2250_00);
    await expectError(
      service.createOrder({ ...TAMARIND, quantityKg: 4, clientToken: newToken() }),
      "VALIDATION",
    );
    await expectError(
      service.createOrder({ ...TAMARIND, quantityKg: 201, clientToken: newToken() }),
      "VALIDATION",
    );
    await expectError(
      service.createOrder({ ...VALID, productId: "basmati", clientToken: newToken() }),
      "VALIDATION",
    );
    await expectError(
      service.quote({ productId: undefined, quantityKg: 10, state: "Kerala" }),
      "VALIDATION",
    );
  });

  it("does not let one browser token move an order to a different product", async () => {
    const { service, db } = await setup();
    const clientToken = newToken();
    await service.createOrder({ ...VALID, clientToken });
    await expectError(service.createOrder({ ...TAMARIND, clientToken }), "CONFLICT");
    expect(await countOrders(db)).toBe(1);
  });
});

describe("UPI payment link", () => {
  it("carries the payee, the exact amount and the order number", () => {
    const link = buildUpiLink(DEFAULT_SETTINGS.upi, 1265_00, "ZR-DR-20261006-0001");
    expect(link).toBe(
      "upi://pay?pa=7356796946%40ptyes&pn=Thomas%20Zacharias&am=1265.00&cu=INR&tn=ZR-DR-20261006-0001",
    );
  });
});

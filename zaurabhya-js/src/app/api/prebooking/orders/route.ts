import { handleJsonPost } from "@/lib/prebooking/http";
import { prebooking } from "@/lib/prebooking/server";
import { toPublicOrder } from "@/lib/prebooking/service";
import { buildUpiPaymentDetails } from "@/lib/prebooking/upi";

/** Creates (or, for the same clientToken, updates) the PENDING order and returns how to pay it. */
export function POST(request: Request) {
  return handleJsonPost(
    request,
    { name: "orders", max: 15, windowMs: 10 * 60_000 },
    async (body) => {
      const { order } = await prebooking.createOrder(body);
      const payable = order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED";
      const settings = await prebooking.getSettings();
      return {
        order: toPublicOrder(order),
        upi: payable
          ? await buildUpiPaymentDetails(settings.upi, order.grandTotalPaise, order.orderNumber)
          : null,
      };
    },
  );
}

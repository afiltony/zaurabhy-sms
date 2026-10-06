import { getBaseUrl, handleJsonPost } from "@/lib/prebooking/http";
import { prebooking } from "@/lib/prebooking/server";
import { toPublicOrder } from "@/lib/prebooking/service";

/** Customer reports their UPI reference. Queues the order for verification; never marks it paid. */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/prebooking/orders/[orderNumber]/payment">,
) {
  const { orderNumber } = await ctx.params;
  return handleJsonPost(
    request,
    { name: "payment", max: 10, windowMs: 10 * 60_000 },
    async (body) => {
      const order = await prebooking.submitPaymentReference({
        orderNumber,
        clientToken: String(body.clientToken ?? ""),
        reference: body.reference,
        baseUrl: getBaseUrl(request.headers),
      });
      return { order: toPublicOrder(order) };
    },
  );
}

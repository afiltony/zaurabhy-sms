import { handleJsonPost } from "@/lib/prebooking/http";
import { prebooking } from "@/lib/prebooking/server";
import { PrebookingError, toPublicOrder } from "@/lib/prebooking/service";

/** "Check Payment Status": reads the current status from the database. */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/prebooking/orders/[orderNumber]/status">,
) {
  const { orderNumber } = await ctx.params;
  return handleJsonPost(request, { name: "status", max: 30, windowMs: 60_000 }, async () => {
    const order = await prebooking.getOrder(orderNumber);
    if (!order) throw new PrebookingError("NOT_FOUND", "Order not found");
    return { order: toPublicOrder(order) };
  });
}

import { handleJsonPost } from "@/lib/prebooking/http";
import { prebooking } from "@/lib/prebooking/server";

export function POST(request: Request) {
  return handleJsonPost(request, { name: "quote", max: 60, windowMs: 60_000 }, (body) =>
    prebooking.quote({
      productId: body.productId,
      quantityKg: body.quantityKg,
      state: body.state,
    }),
  );
}

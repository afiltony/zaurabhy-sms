import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { getOrder } from "@/lib/orders";
import { getProductBySlug, getVariant } from "@/data/products";

export default async function OrderConfirmationPage(
  props: PageProps<"/order-confirmation/[orderId]">,
) {
  const { orderId } = await props.params;
  const order = await getOrder(orderId);
  if (!order) notFound();

  const isPaid = order.status === "paid";

  return (
    <div className="px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        {isPaid ? (
          <CheckCircle2 className="mx-auto h-12 w-12 text-teal" />
        ) : (
          <Clock className="mx-auto h-12 w-12 text-coral" />
        )}

        <h1 className="mt-4 font-heading text-2xl font-bold text-ink sm:text-3xl">
          {isPaid ? "Order confirmed!" : "Order received"}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {isPaid
            ? "Thank you for your order. We'll send a confirmation to your email shortly."
            : "Your order has been saved. We'll contact you shortly to confirm payment and delivery."}
        </p>
        <p className="mt-1 text-xs text-ink-muted">Order ID: {order.id}</p>

        <div className="mt-8 rounded-2xl border border-border bg-white p-6 text-left">
          <div className="space-y-2">
            {order.items.map((item) => {
              const product = getProductBySlug(item.slug);
              const variant = getVariant(item.slug, item.variantId);
              if (!product || !variant) return null;
              return (
                <div
                  key={`${item.slug}-${item.variantId}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ink-soft">
                    {product.name} ({variant.label}) &times; {item.quantity}
                  </span>
                  <span className="font-semibold text-ink">
                    &#8377;{variant.price * item.quantity}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">Subtotal</span>
              <span className="font-semibold text-ink">&#8377;{order.itemsSubtotal}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">Shipping ({order.courier})</span>
              <span className="font-semibold text-ink">&#8377;{order.shippingCost}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-bold text-ink">Total</span>
            <span className="text-lg font-bold text-ink">&#8377;{order.amount}</span>
          </div>
        </div>

        <Link
          href="/products"
          className="mt-8 inline-block rounded-full bg-coral px-6 py-3 text-sm font-bold text-white transition hover:bg-teal"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

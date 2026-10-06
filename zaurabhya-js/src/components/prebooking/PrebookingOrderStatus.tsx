import Link from "next/link";
import { CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react";
import { CheckStatusButton, RetryPayment } from "@/components/prebooking/OrderStatusActions";
import UpiPaymentPanel from "@/components/prebooking/UpiPaymentPanel";
import { formatInr } from "@/lib/prebooking/pricing";
import type { PublicOrder } from "@/lib/prebooking/service";
import type { UpiPaymentDetails } from "@/lib/prebooking/upi";

type Payable = { clientToken: string; upi: UpiPaymentDetails };

function Header({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: LucideIcon;
  tone: "teal" | "coral";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Icon className={`mx-auto h-14 w-14 ${tone === "teal" ? "text-teal" : "text-coral"}`} />
      <h1 className="mt-4 font-heading text-3xl font-bold text-ink">{title}</h1>
      <div className="mt-3 space-y-1.5 text-base text-ink-soft">{children}</div>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "font-bold text-ink" : "text-ink-soft"}>{label}</dt>
      <dd className={strong ? "text-xl font-bold text-ink" : "font-semibold text-ink"}>{value}</dd>
    </div>
  );
}

function OrderSummary({ order, totalLabel }: { order: PublicOrder; totalLabel: string }) {
  return (
    <dl className="mt-8 space-y-2.5 rounded-2xl border border-border bg-white p-5 text-left text-sm sm:p-6">
      <Row label="Order Number" value={order.orderNumber} />
      <Row label="Payment" value={order.paymentStatus.replace(/_/g, " ")} />
      <Row label="Product" value={order.productName} />
      <Row label="Quantity" value={`${order.quantityKg} KG`} />
      <Row label="Product Amount" value={formatInr(order.productAmountPaise)} />
      <Row label="Shipping" value={formatInr(order.shippingAmountPaise)} />
      {order.taxAmountPaise > 0 && <Row label="GST" value={formatInr(order.taxAmountPaise)} />}
      <Row label="Shipping Method" value={order.shippingMethod} />
      <div className="border-t border-border pt-3">
        <Row label={totalLabel} value={formatInr(order.grandTotalPaise)} strong />
      </div>
    </dl>
  );
}

const linkButton =
  "inline-block rounded-full bg-coral px-6 py-4 text-base font-bold text-white transition hover:bg-teal";

const NO_TOKEN_HELP =
  "To pay for this order, open this page on the device you placed it from, or use the link in the email we sent you.";

/** Customer-facing status of a pre-booking order. Only PAID is ever presented as confirmed. */
export default function PrebookingOrderStatus({
  order,
  payable,
}: {
  order: PublicOrder;
  /** Present only when the visitor holds this order's token and it can still be paid. */
  payable: Payable | null;
}) {
  const productUrl = `/products/${order.productId}`;
  const paymentProps = payable && {
    orderNumber: order.orderNumber,
    amountPaise: order.grandTotalPaise,
    clientToken: payable.clientToken,
    upi: payable.upi,
  };

  let body: React.ReactNode;

  switch (order.paymentStatus) {
    case "PAID":
      body = (
        <>
          <Header icon={CheckCircle2} tone="teal" title="Order Confirmed!">
            <p>Thank you for your pre-booking with Zaurabhya.</p>
            <p>Your order has been successfully received.</p>
          </Header>
          <OrderSummary order={order} totalLabel="Total Paid" />
          <p className="mt-6 text-sm text-ink-soft">
            {order.confirmationEmailSent
              ? "A confirmation email has been sent."
              : "Your confirmation email is on its way."}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            We will process your pre-booking and arrange dispatch through parcel service.
          </p>
          <Link href="/products" className={`mt-8 ${linkButton}`}>
            Continue Shopping
          </Link>
        </>
      );
      break;

    case "PAYMENT_INITIATED":
      body = (
        <>
          <Header icon={Clock} tone="coral" title="Payment Processing">
            <p>Your payment is still being verified.</p>
            <p>Please do not make another payment until the status is confirmed.</p>
          </Header>
          <OrderSummary order={order} totalLabel="Order Amount" />
          <p className="mt-6 text-sm text-ink-soft">
            Your order is not confirmed yet. We check every UPI payment against our account and
            will email you as soon as yours is verified.
          </p>
          <div className="mt-6">
            <CheckStatusButton orderNumber={order.orderNumber} />
          </div>
        </>
      );
      break;

    case "PENDING":
      body = (
        <>
          <Header icon={Clock} tone="coral" title="Complete Your Payment">
            <p>This pre-booking is waiting for payment and has NOT been confirmed.</p>
          </Header>
          {paymentProps ? (
            <div className="mt-8 rounded-2xl border border-border bg-white p-5 text-left sm:p-6">
              <UpiPaymentPanel {...paymentProps} />
            </div>
          ) : (
            <>
              <OrderSummary order={order} totalLabel="Order Amount" />
              <p className="mt-6 text-sm text-ink-soft">{NO_TOKEN_HELP}</p>
            </>
          )}
        </>
      );
      break;

    case "FAILED":
      body = (
        <>
          <Header icon={XCircle} tone="coral" title="Payment Failed">
            <p>Your payment could not be completed.</p>
          </Header>
          <OrderSummary order={order} totalLabel="Order Amount" />
          <p className="mt-6 text-base font-bold text-ink">Your order has NOT been confirmed.</p>
          <p className="mt-1 text-sm text-ink-soft">
            We could not find a payment matching the reference you submitted. If money was
            debited, contact us with your payment screenshot before paying again.
          </p>
          <div className="mt-6">
            {paymentProps ? (
              <RetryPayment {...paymentProps} />
            ) : (
              <p className="text-sm text-ink-soft">{NO_TOKEN_HELP}</p>
            )}
          </div>
        </>
      );
      break;

    case "REFUND_PENDING":
    case "REFUNDED":
      body = (
        <>
          <Header icon={Clock} tone="coral" title="Order Refund">
            <p>
              {order.paymentStatus === "REFUNDED"
                ? "This order has been refunded."
                : "A refund for this order is being processed."}
            </p>
          </Header>
          <OrderSummary order={order} totalLabel="Order Amount" />
        </>
      );
      break;

    default:
      body = (
        <>
          <Header
            icon={XCircle}
            tone="coral"
            title={order.paymentStatus === "EXPIRED" ? "Pre-Booking Expired" : "Order Cancelled"}
          >
            <p>This pre-booking was not paid for and is no longer active.</p>
            <p>Your order has NOT been confirmed.</p>
          </Header>
          <OrderSummary order={order} totalLabel="Order Amount" />
          <Link href={productUrl} className={`mt-8 ${linkButton}`}>
            Start a New Pre-Booking
          </Link>
        </>
      );
  }

  return (
    <div className="px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        {body}
        <p className="mt-10 text-xs text-ink-muted">
          Need help? Call +91 73567 96946 or email info@zaurabhya.com with your order number.
        </p>
      </div>
    </div>
  );
}

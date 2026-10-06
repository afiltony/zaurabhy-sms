import { saveSettingsAction } from "@/app/admin/actions";
import { AdminBanner, AdminHeader } from "@/components/admin/AdminChrome";
import { INDIAN_STATES } from "@/data/shipping";
import { requireAdmin } from "@/lib/prebooking/admin-auth";
import { PREBOOKING_PRODUCT_IDS, PREBOOKING_PRODUCTS } from "@/lib/prebooking/config";
import { computeQuote, formatInr } from "@/lib/prebooking/pricing";
import { prebooking } from "@/lib/prebooking/server";

const card = "rounded-2xl border border-border bg-white p-5";
const input =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";

const rupees = (paise: number | undefined) => (paise === undefined ? "" : String(paise / 100));

function Money({
  name,
  label,
  value,
  required = true,
}: {
  name: string;
  label: string;
  value: number | undefined;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-semibold text-ink-soft">
        {label}
      </label>
      <input
        id={name}
        name={name}
        inputMode="decimal"
        required={required}
        defaultValue={rupees(value)}
        className={input}
      />
    </div>
  );
}

function Quantity({ name, label, value }: { name: string; label: string; value: number }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-xs font-semibold text-ink-soft">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        min={1}
        step={1}
        required
        defaultValue={value}
        className={input}
      />
    </div>
  );
}

export default async function AdminSettingsPage(props: PageProps<"/admin/settings">) {
  await requireAdmin();
  const { notice, error } = await props.searchParams;
  const settings = await prebooking.getSettings();
  const { shipping } = settings;
  const examples = PREBOOKING_PRODUCT_IDS.flatMap((id) =>
    (["Kerala", "Tamil Nadu", "Delhi"] as const).map((state) => ({
      label: `${PREBOOKING_PRODUCTS[id].shortName}, ${settings.products[id].minQuantityKg} KG to ${state}`,
      quote: computeQuote(settings, id, settings.products[id].minQuantityKg, state),
    })),
  );

  return (
    <>
      <AdminHeader title="Pre-Booking Settings" />
      <AdminBanner notice={notice} error={error} />

      <form action={saveSettingsAction} className="space-y-5">
        <section className={card}>
          <h2 className="mb-3 text-base font-bold text-ink">Products</h2>
          <div className="space-y-4">
            {PREBOOKING_PRODUCT_IDS.map((id) => {
              const product = settings.products[id];
              return (
                <fieldset key={id} className="rounded-xl bg-cream p-3">
                  <legend className="px-1 text-sm font-bold text-ink">
                    {PREBOOKING_PRODUCTS[id].name}
                  </legend>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Money
                      name={`${id}__pricePerKg`}
                      label="Product price per KG (₹)"
                      value={product.pricePerKgPaise}
                    />
                    <Quantity
                      name={`${id}__minQuantityKg`}
                      label="Minimum quantity (KG)"
                      value={product.minQuantityKg}
                    />
                    <Quantity
                      name={`${id}__maxQuantityKg`}
                      label="Maximum quantity per order (KG)"
                      value={product.maxQuantityKg}
                    />
                  </div>
                </fieldset>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            UPI apps usually cap a single payment at ₹1,00,000, so keep each maximum order below
            that value.
          </p>
        </section>

        <section className={card}>
          <h2 className="mb-3 text-base font-bold text-ink">Shipping</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="shippingMethod" className="mb-1 block text-xs font-semibold text-ink-soft">
                Shipping method (shown to customers)
              </label>
              <input
                id="shippingMethod"
                name="shippingMethod"
                required
                defaultValue={settings.shippingMethod}
                className={input}
              />
            </div>
            <div>
              <label htmlFor="calculationType" className="mb-1 block text-xs font-semibold text-ink-soft">
                Shipping calculation
              </label>
              <select
                id="calculationType"
                name="calculationType"
                defaultValue={shipping.calculationType}
                className={input}
              >
                <option value="flat">Flat — one charge per order</option>
                <option value="weight">Weight based — base + per KG</option>
                <option value="state">State based — rate by destination</option>
              </select>
            </div>
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                name="shippingEnabled"
                defaultChecked={shipping.enabled}
                className="h-5 w-5 accent-teal"
              />
              Charge shipping
            </label>
          </div>

          <h3 className="mt-5 text-sm font-bold text-ink">Flat</h3>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <Money name="flatCharge" label="Flat shipping charge (₹)" value={shipping.flatChargePaise} />
          </div>

          <h3 className="mt-5 text-sm font-bold text-ink">Weight based</h3>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <Money name="weightBase" label="Base shipping (₹)" value={shipping.basePaise} />
            <Money name="weightPerKg" label="Per KG shipping (₹)" value={shipping.perKgPaise} />
          </div>

          <h3 className="mt-5 text-sm font-bold text-ink">State based — zones</h3>
          <p className="text-xs text-ink-muted">
            South = Tamil Nadu, Karnataka, Andhra Pradesh, Telangana, Puducherry. Rest of India
            covers every other state.
          </p>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            {(
              [
                ["kerala", "Kerala"],
                ["south", "South India"],
                ["national", "Rest of India"],
              ] as const
            ).map(([zone, name]) => (
              <div key={zone} className="space-y-2 rounded-xl bg-cream p-3">
                <p className="text-xs font-bold text-ink">{name}</p>
                <Money name={`${zone}Base`} label="Base (₹)" value={shipping.zoneRates[zone].basePaise} />
                <Money name={`${zone}PerKg`} label="Per KG (₹)" value={shipping.zoneRates[zone].perKgPaise} />
              </div>
            ))}
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-bold text-blue">
              State-wise rates (optional — overrides the zone rate for that state)
            </summary>
            <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {INDIAN_STATES.map((state, index) => (
                <div key={state} className="grid grid-cols-[1fr_84px_84px] items-center gap-2">
                  <span className="text-xs text-ink-soft">{state}</span>
                  <input
                    name={`state${index}Base`}
                    aria-label={`${state} base shipping in rupees`}
                    placeholder="Base"
                    inputMode="decimal"
                    defaultValue={rupees(shipping.stateRates[state]?.basePaise)}
                    className={input}
                  />
                  <input
                    name={`state${index}PerKg`}
                    aria-label={`${state} per KG shipping in rupees`}
                    placeholder="Per KG"
                    inputMode="decimal"
                    defaultValue={rupees(shipping.stateRates[state]?.perKgPaise)}
                    className={input}
                  />
                </div>
              ))}
            </div>
          </details>

          <div className="mt-5 rounded-xl bg-cream p-3 text-sm text-ink-soft">
            <p className="font-bold text-ink">
              With the saved settings, a minimum order costs:
            </p>
            {examples.map(({ label, quote }) => (
              <p key={label}>
                {label}: {formatInr(quote.productAmountPaise)} + {formatInr(quote.shippingAmountPaise)}{" "}
                shipping{quote.taxAmountPaise > 0 && ` + ${formatInr(quote.taxAmountPaise)} tax`} ={" "}
                <strong>{formatInr(quote.grandTotalPaise)}</strong>
              </p>
            ))}
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-3 text-base font-bold text-ink">Tax</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="taxPercent" className="mb-1 block text-xs font-semibold text-ink-soft">
                GST % on product + shipping (0 = no tax line)
              </label>
              <input
                id="taxPercent"
                name="taxPercent"
                type="number"
                min={0}
                max={28}
                step="0.01"
                required
                defaultValue={settings.taxPercent}
                className={input}
              />
            </div>
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-3 text-base font-bold text-ink">UPI payment (QR code)</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="upiVpa" className="mb-1 block text-xs font-semibold text-ink-soft">
                UPI ID that receives payments
              </label>
              <input id="upiVpa" name="upiVpa" required defaultValue={settings.upi.vpa} className={`${input} font-mono`} />
            </div>
            <div>
              <label htmlFor="upiPayeeName" className="mb-1 block text-xs font-semibold text-ink-soft">
                Name shown to the customer
              </label>
              <input
                id="upiPayeeName"
                name="upiPayeeName"
                required
                defaultValue={settings.upi.payeeName}
                className={input}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-coral">
            Customers pay directly to this UPI ID. Double-check it after any change.
          </p>
        </section>

        <button
          type="submit"
          className="w-full rounded-full bg-coral py-4 text-base font-bold text-white transition hover:bg-teal sm:w-auto sm:px-10"
        >
          Save settings
        </button>
      </form>
    </>
  );
}

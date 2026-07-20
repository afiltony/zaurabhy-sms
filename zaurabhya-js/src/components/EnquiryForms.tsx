import WholesaleForm from "@/components/WholesaleForm";
import ExportForm from "@/components/ExportForm";

export default function EnquiryForms() {
  return (
    <section className="grid gap-5 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8">
      <WholesaleForm />
      <ExportForm />
    </section>
  );
}

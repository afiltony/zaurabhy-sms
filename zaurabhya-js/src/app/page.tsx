import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import Products from "@/components/Products";
import WhyChooseUs from "@/components/WhyChooseUs";
import CustomerType from "@/components/CustomerType";
import EnquiryForms from "@/components/EnquiryForms";
import HealthBenefits from "@/components/HealthBenefits";
import ProcessSteps from "@/components/ProcessSteps";
import Testimonials from "@/components/Testimonials";
import DealerCta from "@/components/DealerCta";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Products />
      <WhyChooseUs />
      <CustomerType />
      <EnquiryForms />
      <HealthBenefits />
      <ProcessSteps />
      <Testimonials />
      <DealerCta />
    </>
  );
}

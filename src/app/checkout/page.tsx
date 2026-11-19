import type { Metadata } from "next";
import Checkout from "@/components/Checkout";
import BeanDivider from "@/components/BeanDivider";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Pay for your pickup order at Bing's Bake & Brew.",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="shell pb-24 pt-28 md:pt-36">
      <div className="section-head">
        <h1 className="display-lg">Checkout</h1>
        <BeanDivider />
      </div>
      <Checkout />
    </div>
  );
}

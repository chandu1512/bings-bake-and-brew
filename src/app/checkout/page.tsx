import type { Metadata } from "next";
import Checkout from "@/components/Checkout";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Pay for your pickup order at Bing's Bake & Brew.",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="shell pb-24 pt-28 md:pt-36">
      <h1 className="display-lg mb-8 md:mb-10">Checkout</h1>
      <Checkout />
    </div>
  );
}

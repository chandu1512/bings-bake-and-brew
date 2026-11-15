import type { Metadata } from "next";
import MenuBoard from "@/components/MenuBoard";
import OrderIntro from "@/components/OrderIntro";

export const metadata: Metadata = {
  title: "Order pickup",
  description:
    "Order pickup from Bing's Bake & Brew at Amstel Square or Elkton. Choose sizes, milks and flavors, pay online, and pick it up.",
};

export default function OrderPage() {
  return (
    <div className="shell pb-24 pt-[120px] md:pt-[150px]">
      <OrderIntro />
      <div className="mt-16 md:mt-20">
        <MenuBoard mode="tabs" />
      </div>
    </div>
  );
}

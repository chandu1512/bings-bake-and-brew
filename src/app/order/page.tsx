import type { Metadata } from "next";
import { TOWNS, pageMeta } from "@/lib/seo";
import MenuBoard from "@/components/MenuBoard";
import OrderIntro from "@/components/OrderIntro";

export const metadata: Metadata = pageMeta({
  title: "Order Online for Pickup",
  description: `Order coffee and Bing's Bakery pastries online, pay ahead, and pick up at our shop in ${TOWNS}.`,
  path: "/order",
});

export default function OrderPage() {
  return (
    <div className="shell pb-24 pt-[120px] md:pt-[150px]">
      <OrderIntro />
      {/* Paper, then white, then paper again down the page. */}
      <div className="band-white mt-16 py-14 md:mt-20 md:py-20">
        <MenuBoard mode="tabs" />
      </div>
    </div>
  );
}

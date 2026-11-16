import type { Metadata } from "next";
import { TOWNS } from "@/lib/seo";
import MenuBoard from "@/components/MenuBoard";
import OrderIntro from "@/components/OrderIntro";

export const metadata: Metadata = {
  title: `Order Online for Pickup in ${TOWNS}`,
  description: `Order coffee and Bing's Bakery pastries online, pay ahead, and pick up at our shop in ${TOWNS}.`,
  alternates: { canonical: "/order" },
  openGraph: { title: `Order Online for Pickup in ${TOWNS}`, description: `Order coffee and Bing's Bakery pastries online, pay ahead, and pick up at our shop in ${TOWNS}.`, url: "/order" },
  twitter: { title: `Order Online for Pickup in ${TOWNS}`, description: `Order coffee and Bing's Bakery pastries online, pay ahead, and pick up at our shop in ${TOWNS}.` },
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

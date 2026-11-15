import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import BagDrawer from "@/components/BagDrawer";
import ItemSheet from "@/components/ItemSheet";
import { Providers } from "@/components/providers";
import { SHOP_NAME } from "@/lib/site";
import { realMenuPhotos } from "@/lib/photos";

const description =
  "Coffee, espresso and Bing's Bakery pastries at two shops: Amstel Square in Newark, DE and West Main in Elkton, MD. See each shop's menu, prices and hours, and order pickup.";

export const metadata: Metadata = {
  title: {
    default: `${SHOP_NAME} | Coffee and Bing's pastries in Newark, DE and Elkton, MD`,
    template: `%s | ${SHOP_NAME}`,
  },
  description,
  openGraph: { title: SHOP_NAME, description, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#1a100c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen antialiased">
        <Providers localPhotos={realMenuPhotos()}>
          <SmoothScroll />
          <Nav />
          <main id="main">{children}</main>
          <Footer />
          <BagDrawer />
          <ItemSheet />
        </Providers>
      </body>
    </html>
  );
}

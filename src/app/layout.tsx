import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import BagDrawer from "@/components/BagDrawer";
import ItemSheet from "@/components/ItemSheet";
import { Providers } from "@/components/providers";
import { SHOP_NAME, SITE_URL } from "@/lib/site";
import { TOWNS, localBusinessJsonLd } from "@/lib/seo";
import { realMenuPhotos } from "@/lib/photos";

const description = `Coffee, espresso and Bing's Bakery pastries, baked since 1871, at two shops in ${TOWNS}. See each shop's menu, prices and hours, and order pickup online.`;
const ogImage = { url: "/photos/elkton/baked-goods--crumb-cake.jpg", width: 1200, height: 900, alt: `Crumb cake from ${SHOP_NAME}` };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SHOP_NAME} | Coffee Shop and Bakery in ${TOWNS}`,
    template: `%s | ${SHOP_NAME}`,
  },
  description,
  openGraph: {
    type: "website",
    siteName: SHOP_NAME,
    locale: "en_US",
    title: `${SHOP_NAME} | Coffee Shop and Bakery in ${TOWNS}`,
    description,
    url: "/",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SHOP_NAME} | Coffee Shop and Bakery in ${TOWNS}`,
    description,
    images: [ogImage.url],
  },
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
        <script
          type="application/ld+json"
          // Built only from src/lib/site.ts; no user input reaches it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()).replace(/</g, "\\u003c") }}
        />
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

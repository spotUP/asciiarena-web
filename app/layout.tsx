import type { Metadata } from "next";
import Script from "next/script";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/site.css";

export const metadata: Metadata = {
  title: "aSCIIaRENA",
  description: "A community for ascii artists by Up Rough and Divine Stylers",
  openGraph: {
    title: "aSCIIaRENA.se",
    description: "A community for ascii artists",
    images: ["https://www.asciiarena.se/assets/data/socialmedia.png"],
    url: "https://www.asciiarena.se",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="preload"
          href="/assets/fonts/TopazPlus_a1200.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/css/select2.min.css"
        />
        <link rel="stylesheet" href="/assets/css/bootstrap-colorselector.css" />
      </head>
      <body>
        {children}
        <Script
          src="https://code.jquery.com/jquery-3.5.1.min.js"
          integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0="
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <Script
          src="/bootstrap5.bundle.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="/bootstrap-colorselector-bs5.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Script from "next/script";
import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "https://asciiarena.se"),
  title: "aSCIIaRENA",
  description: "A community for ascii artists by Up Rough and Divine Stylers",
  openGraph: {
    title: "aSCIIaRENA.se",
    description: "A community for ascii artists",
    images: ["/assets/data/socialmedia.png"],
    url: "/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" title="aSCIIaRENA Latest Releases" />
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
        {/* Load CSS in the exact same order as the PHP site */}
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/bootstrap-colorselector.css" />
        <link rel="stylesheet" href="/assets/css/site.css" />
        <link rel="stylesheet" href="/assets/css/386.css" />
      </head>
      <body>
        {children}
        <Script
          src="https://code.jquery.com/jquery-3.5.1.min.js"
          integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0="
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          src="/assets/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="/assets/js/bootstrap-colorselector.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

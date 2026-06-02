import type { Metadata } from "next";
import ChatProvider from "@/components/chat/ChatProvider";
import { ChatContextProvider } from "@/components/chat/ChatContext";
import CaretOverlay from "@/components/ui/CaretOverlay";
import { ToastProvider } from "@/components/ui/ToastProvider";
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
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" />
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
        {/* Load CSS in the exact same order as the PHP site */}
        <link rel="stylesheet" href="/assets/css/bootstrap5.min.css" />
        <link rel="stylesheet" href="/assets/css/site.css" />
        <link rel="stylesheet" href="/assets/css/386.css" />
        <link rel="stylesheet" href="/assets/css/overrides.css" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff55ff" />
        {/* Bootstrap JS — plain <script> in <head> so it loads before any
            hydration, independent of Next.js Script strategy quirks. defer
            lets the DOM parse first; Bootstrap then attaches its global
            click listeners for dropdowns/modals before user interaction. */}
        <script src="/assets/js/bootstrap5.bundle.min.js" defer />
      </head>
      <body suppressHydrationWarning>
        <ToastProvider>
          <ChatContextProvider>
            {children}
            <ChatProvider />
          </ChatContextProvider>
        </ToastProvider>
        <CaretOverlay />
      </body>
    </html>
  );
}

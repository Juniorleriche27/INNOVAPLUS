// innova-frontend/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Space_Grotesk } from "next/font/google";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider, themeInitScript } from "@/components/theme/ThemeProvider";
import PWARegister from "@/components/util/PWARegister";
import RouteShell from "@/components/layout/RouteShell";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

const pwaResetScript = `
(() => {
  if (typeof window === "undefined") return;
  const unregister = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("innova-pwa")).map((key) => caches.delete(key)));
      }
    } catch {}
  };
  void unregister();
})();
`;

export const metadata: Metadata = {
  title: "KORYXA",
  description: "Moteur IA d’opportunités. Transparence · Équité · Impact.",
  applicationName: "KORYXA",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://innovaplus.africa"),
  openGraph: {
    title: "KORYXA",
    description: "Moteur IA d’opportunités. Transparence · Équité · Impact.",
    url: "/",
    siteName: "KORYXA",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "KORYXA",
    description: "Moteur IA d’opportunités. Transparence · Équité · Impact."
  }
};

export default function RootLayout(props: { children: ReactNode }) {
  const { children } = props;

  return (
    <html lang="fr" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: pwaResetScript }} />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 antialiased transition-colors duration-300">
        <a href="#page-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-16 z-50 rounded bg-sky-600 px-3 py-2 text-white">Aller au contenu</a>
        <ThemeProvider>
          <AuthProvider>
            <PWARegister />
            <RouteShell>{children}</RouteShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// innova-frontend/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import Headbar from "@/components/layout/headbar";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";
import PWARegister from "@/components/util/PWARegister";

export const metadata: Metadata = {
  title: "INNOVA+",
  description: "Moteur IA d’opportunités. Transparence · Équité · Impact.",
  applicationName: "INNOVA+",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "INNOVA+",
    description: "Moteur IA d’opportunités. Transparence · Équité · Impact.",
    url: "/",
    siteName: "INNOVA+",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "INNOVA+",
    description: "Moteur IA d’opportunités. Transparence · Équité · Impact."
  }
};

export default function RootLayout(props: { children: ReactNode }) {
  const { children } = props;

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-16 z-50 rounded bg-sky-600 px-3 py-2 text-white">Aller au contenu</a>
        <div className="relative flex min-h-screen flex-col">
          <Headbar />

          {/* Fixed sidebar on large screens aligned to container left */}
          <div className="hidden lg:block">
            {/* Fixed sidebar: keep visible while body scrolls */}
            <Sidebar
              className="z-20"
              style={{ position: "fixed", left: "calc((100vw - 1160px)/2 + 24px)", top: "7rem" }}
            />
          </div>

          <div className="flex-1 bg-transparent">
            <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:flex-row lg:px-8">
              {/* Spacer to reserve horizontal space for fixed sidebar */}
              <div className="hidden w-72 shrink-0 lg:block" />

              <div className="flex-1">
                <main id="content" className="min-w-0 pb-10 lg:pb-0">{children}</main>
              </div>
            </div>
          </div>

          <Footer />
        </div>
        <PWARegister />
      </body>
    </html>
  );
}

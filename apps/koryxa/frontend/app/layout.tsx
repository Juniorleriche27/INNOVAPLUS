// innova-frontend/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import Headbar from "@/components/layout/headbar";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";
import { AuthProvider } from "@/components/auth/AuthProvider";
import PWARegister from "@/components/util/PWARegister";

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
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 antialiased">
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-16 z-50 rounded bg-sky-600 px-3 py-2 text-white">Aller au contenu</a>
        <div className="relative flex min-h-screen flex-col">
          <AuthProvider>
            <PWARegister />
            <div className="sticky top-0 z-40">
              <Headbar />
            </div>
            <div
              className="grid flex-1 gap-0"
              style={{ gridTemplateColumns: "auto minmax(0,1fr)" }}
            >
              <div className="hidden h-full sm:block">
                <Sidebar />
              </div>
              <div className="min-w-0 flex min-h-0 flex-col">
                <main
                  id="content"
                  className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8"
                >
                  <div className="flex-1">{children}</div>
                  <Footer />
                </main>
              </div>
            </div>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}

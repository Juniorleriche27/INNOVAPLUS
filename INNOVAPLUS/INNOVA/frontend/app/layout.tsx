// innova-frontend/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import Headbar from "@/components/layout/headbar";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";
import PWARegister from "@/components/util/PWARegister";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "INNOVA+",
  description: "Moteur IA d’opportunités. Transparence · Équité · Impact.",
  applicationName: "INNOVA+",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://innovaplus.africa"),
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
        <div className="relative min-h-screen">
          <AuthProvider>
            <Headbar />
            {/* Grid wrapper: sidebar | main. No gap. */}
            <div
              className="grid w-full gap-0"
              style={{ gridTemplateColumns: "var(--sidebar-w) minmax(0,1fr)" }}
            >
              {/* Sidebar column: off-canvas on <640px via CSS var = 0 */}
              <div className="hidden sm:block">
                <Sidebar />
              </div>
              {/* Main column */}
              <div className="min-w-0">
                <main id="content" className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-6">
                  {children}
                </main>
                <Footer />
              </div>
            </div>
          </AuthProvider>
        </div>
        <PWARegister />
      </body>
    </html>
  );
}

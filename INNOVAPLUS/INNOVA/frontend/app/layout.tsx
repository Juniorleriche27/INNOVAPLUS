// innova-frontend/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import Headbar from "@/components/layout/headbar";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "INNOVA+",
  description: "Plateforme INNOVA+",
};

export default function RootLayout(props: { children: ReactNode }) {
  const { children } = props;

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="relative flex min-h-screen flex-col">
          <Headbar />

          <div className="flex-1 bg-transparent">
            <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:flex-row lg:px-8">
              <div className="hidden shrink-0 lg:block lg:self-start">
                <Sidebar />
              </div>

              <div className="flex-1">
                <main className="min-w-0 pb-10 lg:pb-0">{children}</main>
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </body>
    </html>
  );
}

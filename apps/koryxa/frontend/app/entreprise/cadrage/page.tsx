import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import EnterpriseFlowClient from "../EnterpriseFlowClient";

export const metadata: Metadata = {
  title: "Cadrage du besoin | KORYXA",
  description: "Qualifiez un besoin entreprise et ouvrez la bonne suite d'exécution.",
};

export default function EntrepriseCadragePage() {
  return (
    <main className="mx-auto max-w-[var(--marketing-max-w)] space-y-4 px-1 py-2 sm:px-2">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/entreprise" className="transition-colors hover:text-slate-900">
          Entreprise
        </Link>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
        <span className="font-medium text-slate-900">Cadrage du besoin</span>
      </nav>

      {/* Flow client */}
      <EnterpriseFlowClient />

      {/* Back */}
      <div className="pb-4">
        <Link
          href="/entreprise"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux services
        </Link>
      </div>

    </main>
  );
}

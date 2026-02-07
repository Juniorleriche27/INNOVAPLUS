"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { inferUserPlan } from "@/config/planFeatures";

export default function MyPlanningAutomationsPage() {
  const { user } = useAuth();
  const plan = useMemo(() => inferUserPlan(user), [user]);
  const isFree = plan === "free";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Automatisations</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Automatisations MyPlanning</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">Les scénarios sont prévus, l’activation réelle arrive après la phase MVP.</p>

        {isFree ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Pro uniquement.</p>
            <p className="mt-1 text-amber-800">Cette fonctionnalité t’aide à mieux exécuter. Disponible avec MyPlanning Pro.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/myplanning/pricing?upgrade=pro&feature=automations" className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
                Voir l’offre Pro
              </Link>
              <Link href="/myplanning/app" className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Plus tard
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Fonctionnalité en bêta.</p>
            <p className="mt-1 text-amber-800">La page est prête, le moteur d’automatisations réelles est en cours d’activation.</p>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {["Créer tâche récurrente", "Rappel intelligent", "Blocage automatique du focus", "Règles de priorité"].map((item) => (
          <div key={item} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{item}</p>
            <p className="mt-2 text-xs text-slate-500">Prévu, non actif pour le moment.</p>
          </div>
        ))}
      </section>
    </div>
  );
}

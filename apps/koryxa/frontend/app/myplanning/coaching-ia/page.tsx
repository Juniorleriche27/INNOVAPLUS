"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { inferUserPlan } from "@/config/planFeatures";

export default function MyPlanningCoachingIAPage() {
  const { user } = useAuth();
  const plan = useMemo(() => inferUserPlan(user), [user]);
  const isFree = plan === "free";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Coaching IA</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">L’IA t’aide à décider quoi faire aujourd’hui.</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          Pas à remplir des listes. MyPlanningAI utilise tes tâches, tes priorités et ton historique pour proposer un plan exécutable.
        </p>

        {isFree ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Disponible avec MyPlanningAI Pro.</p>
            <p className="mt-1 text-amber-800">Tu peux lire cette page, mais les actions IA sont bloquées en Free.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/myplanning/pricing?upgrade=pro&feature=coaching" className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
                Voir l’offre Pro
              </Link>
              <Link href="/myplanning/app" className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Ouvrir l’app
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Ce que l’IA fait</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• Suggestions de priorités</li>
            <li>• Ajustement du planning selon la réalité</li>
            <li>• Coaching léger sur l’exécution</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Ce que l’IA ne fait pas</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• Ne décide pas à ta place</li>
            <li>• Ne lance pas d’actions cachées</li>
            <li>• Ne remplace pas ton jugement</li>
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Données utilisées</p>
        <p className="mt-2 text-sm text-slate-700">Tâches, priorités, historique de complétion, contraintes de temps déclarées.</p>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { inferUserPlan } from "@/config/planFeatures";

export default function MyPlanningStatsPage() {
  const { user } = useAuth();
  const plan = useMemo(() => inferUserPlan(user), [user]);
  const isPro = plan !== "free";

  return (
    <div className="w-full space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI Pro</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Stats & graphiques</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          Les statistiques avancées servent à piloter la régularité, l’impact, le volume exécuté et les points de blocage.
          La page publique présente la valeur. L’usage réel se fait ensuite dans la plateforme connectée.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/myplanning/pricing?upgrade=pro&feature=stats" className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            Voir l’offre Pro
          </Link>
          <Link href="/myplanning/app/pro/stats" className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {isPro ? "Ouvrir la vue connectée" : "Voir un exemple de vue"}
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Plan actuel : <span className="font-semibold uppercase">{plan}</span>
        </p>
      </section>
    </div>
  );
}

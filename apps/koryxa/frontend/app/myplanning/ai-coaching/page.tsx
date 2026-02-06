"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

type PlanTier = "free" | "pro" | "team";

function inferPlanFromRoles(roles?: string[]): PlanTier {
  const normalized = new Set((roles || []).map((role) => String(role).toLowerCase()));
  if (normalized.has("admin") || normalized.has("myplanning_team") || normalized.has("team")) return "team";
  if (normalized.has("myplanning_pro") || normalized.has("pro")) return "pro";
  return "free";
}

export default function MyPlanningAiCoachingPage() {
  const { user } = useAuth();
  const plan = useMemo(() => {
    const raw = String(user?.plan || "").toLowerCase();
    if (raw === "free" || raw === "pro" || raw === "team") return raw as PlanTier;
    return inferPlanFromRoles(user?.roles);
  }, [user?.plan, user?.roles]);
  const isFree = plan === "free";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Coaching IA</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">L’IA t’aide à décider quoi faire aujourd’hui.</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          Pas à remplir des listes. MyPlanning utilise tes tâches, tes priorités et ton historique pour te proposer un plan exécutable.
        </p>

        {isFree ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Disponible avec MyPlanning Pro.</p>
            <p className="mt-1 text-amber-800">Tu peux lire cette page, mais les actions IA sont bloquées en Free.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/myplanning/pro" className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
                Passer à Pro
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
            <li>• Suggestions de priorités (impact réel, pas juste urgent)</li>
            <li>• Ajustement du planning selon la réalité (temps disponible, charge)</li>
            <li>• Coaching léger : focus, next step, simplification</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Ce que l’IA ne fait pas</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• Ne décide pas à ta place</li>
            <li>• Ne lance pas d’actions cachées</li>
            <li>• Ne “sur-optimise” pas : c’est toi qui choisis</li>
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Données utilisées</p>
        <p className="mt-2 text-sm text-slate-700">Tâches, priorités (Eisenhower), historique de complétion, et contraintes de temps déclarées.</p>
        <p className="mt-2 text-xs text-slate-500">Aucune promesse magique : l’objectif est d’améliorer la décision quotidienne et la régularité.</p>
      </section>
    </div>
  );
}

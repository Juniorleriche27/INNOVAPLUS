"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { inferUserPlan } from "@/config/planFeatures";

export default function MyPlanningProPage() {
  const { user } = useAuth();
  const plan = useMemo(() => inferUserPlan(user), [user]);

  return (
    <div className="w-full space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI Pro (bêta)</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">MyPlanningAI Pro — Passe du contrôle à la performance.</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          Pro débloque ce qui crée la valeur : IA utile, statistiques d’exécution, templates, automatisations progressives.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button disabled className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-600">
            Passer à Pro (bientôt)
          </button>
          <button disabled className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-800">
            Fonctionnalité en bêta
          </button>
          <Link href="/myplanning/pricing" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Voir les tarifs
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Statut actuel : <span className="font-semibold uppercase">{plan}</span>
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/myplanning/app/pro/coaching" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-sky-200">
          <p className="text-sm font-semibold text-slate-900">🤖 Coaching IA <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">BÊTA</span></p>
          <p className="mt-2 text-sm text-slate-600">Suggestions de priorités, réorganisation intelligente, feedback quotidien.</p>
        </Link>
        <Link href="/myplanning/app/pro/stats" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-sky-200">
          <p className="text-sm font-semibold text-slate-900">📊 Stats & graphiques <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">BÊTA</span></p>
          <p className="mt-2 text-sm text-slate-600">Progression, impact, régularité, focus pour piloter tes décisions.</p>
        </Link>
        <Link href="/myplanning/app/pro/templates" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-sky-200">
          <p className="text-sm font-semibold text-slate-900">📐 Templates universels</p>
          <p className="mt-2 text-sm text-slate-600">Étudiant, freelance, entrepreneur — templates prêts à personnaliser.</p>
        </Link>
        <Link href="/myplanning/app/pro/automations" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-sky-200">
          <p className="text-sm font-semibold text-slate-900">⚙️ Automatisations <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">BÊTA</span></p>
          <p className="mt-2 text-sm text-slate-600">Structure prête, activation progressive après la phase MVP.</p>
        </Link>
      </section>
    </div>
  );
}

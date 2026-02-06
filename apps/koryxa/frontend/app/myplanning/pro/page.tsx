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

export default function MyPlanningProPage() {
  const { user } = useAuth();
  const plan = useMemo(() => {
    const raw = String(user?.plan || "").toLowerCase();
    if (raw === "free" || raw === "pro" || raw === "team") return raw as PlanTier;
    return inferPlanFromRoles(user?.roles);
  }, [user?.plan, user?.roles]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanning Pro (bêta)</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">MyPlanning Pro - Passe du controle a la performance.</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          Pro débloque ce qui crée la valeur : une IA utile (pas décorative) et des stats d’exécution pour mesurer ton impact.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            disabled
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-600"
            title="Paiement non branché (bêta)"
          >
            Activer l’offre Pro (bientôt)
          </button>
          <button
            disabled
            className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-800"
            title="Fonctionnalité en bêta"
          >
            Fonctionnalité en bêta
          </button>
          <Link
            href="/myplanning/pricing"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Voir les tarifs
          </Link>
          <Link
            href="/myplanning/app"
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
          >
            Ouvrir l’app
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Statut actuel : <span className="font-semibold">{plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Team"}</span>
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">🤖 Coaching IA <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">BÊTA</span></p>
          <p className="mt-2 text-sm text-slate-600">
            Suggestions de priorités, réorganisation selon la réalité, feedback quotidien. Tu gardes le contrôle.
          </p>
          <div className="mt-4">
            <Link href="/myplanning/coaching-ia" className="text-sm font-semibold text-sky-700 hover:underline">
              Voir comment l’IA fonctionne →
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">📊 Stats & graphiques <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">BÊTA</span></p>
          <p className="mt-2 text-sm text-slate-600">
            Complétion, régularité, focus, impact. Pas pour “faire joli” : pour décider et ajuster.
          </p>
          <div className="mt-4">
            <Link href="/myplanning/stats" className="text-sm font-semibold text-sky-700 hover:underline">
              Voir les stats →
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">📐 Templates universels</p>
        <p className="mt-2 text-sm text-slate-600">Étudiant, freelance, entrepreneur : une base structurée pour démarrer vite.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Étudiant", "Freelance", "Entrepreneur"].map((t) => (
            <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {t}
            </span>
          ))}
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            Automatisations (bientôt)
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            BÊTA
          </span>
        </div>
        <div className="mt-4">
          <Link href="/myplanning/automatisations" className="text-sm font-semibold text-sky-700 hover:underline">
            Voir la page Automatisations →
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">Boutons visibles, fonctionnalités en bêta/à venir selon l’avancement.</p>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import MyPlanningClient from "../MyPlanningClient";

type PlanTier = "free" | "pro" | "team";

function inferPlanFromRoles(roles?: string[]): PlanTier {
  const normalized = new Set((roles || []).map((role) => String(role).toLowerCase()));
  if (normalized.has("admin") || normalized.has("myplanning_team") || normalized.has("team")) return "team";
  if (normalized.has("myplanning_pro") || normalized.has("pro")) return "pro";
  return "free";
}

export default function MyPlanningStatsPage() {
  const { user } = useAuth();
  const plan = useMemo(() => {
    const raw = String(user?.plan || "").toLowerCase();
    if (raw === "free" || raw === "pro" || raw === "team") return raw as PlanTier;
    return inferPlanFromRoles(user?.roles);
  }, [user?.plan, user?.roles]);

  if (plan === "free") {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanning Pro</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Stats & graphiques</h1>
          <p className="mt-3 text-sm text-slate-700">Les statistiques avancées sont disponibles en Pro.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/myplanning/pro" className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
              Voir l’offre Pro
            </Link>
            <Link href="/myplanning/app" className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Ouvrir l’app
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return <MyPlanningClient variant="product" initialSection="stats" />;
}

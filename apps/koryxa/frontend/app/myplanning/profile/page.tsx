"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { inferUserPlan } from "@/config/planFeatures";

export default function MyPlanningProfilePage() {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user?.email;
  const displayName = useMemo(() => {
    const full = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
    return full || user?.email || "Mon profil";
  }, [user]);
  const plan = useMemo(() => inferUserPlan(user), [user]);

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-700">Chargement du profil...</p>
        </section>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">Profil MyPlanning</h1>
          <p className="mt-2 text-sm text-slate-700">
            Connecte-toi pour accéder à ton profil MyPlanning et gérer ton espace de travail.
          </p>
          <div className="mt-5">
            <Link
              href="/myplanning/login?redirect=/myplanning/profile"
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Se connecter
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Mon profil MyPlanning</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-lg font-bold text-sky-700">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{displayName}</h1>
            <p className="text-sm text-slate-600">{user?.email}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Plan</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{plan.toUpperCase()}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Compte</p>
            <p className="mt-2 text-sm font-medium text-slate-900">Actif</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Produit</p>
            <p className="mt-2 text-sm font-medium text-slate-900">MyPlanningAI</p>
          </article>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/myplanning/app"
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Ouvrir mon espace
          </Link>
          <Link
            href="/myplanning/pricing"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Gérer mon plan
          </Link>
          <Link
            href="/account/role"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Profil KORYXA
          </Link>
        </div>
      </section>
    </div>
  );
}


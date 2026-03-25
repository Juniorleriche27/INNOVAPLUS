"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export default function MyPlanningSettingsPage() {
  const { user, loading } = useAuth();
  const isAuthenticated = Boolean(user?.email);

  if (loading) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Chargement des paramètres...</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Paramètres</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Connectez-vous pour gérer vos paramètres</h1>
        <div className="mt-6">
          <Link href="/myplanning/login?redirect=%2Fmyplanning%2Fsettings" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700">
            Se connecter
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Profil</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">Identité, rôle actif, readiness, rattachements et accès principaux.</p>
        <div className="mt-5">
          <Link href="/myplanning/profile" className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
            Ouvrir mon profil
          </Link>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Plan & accès</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">Gérer l’accès au moteur MyPlanningAI, les modules premium et les options d’activation.</p>
        <div className="mt-5">
          <Link href="/myplanning/pricing" className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
            Voir les plans
          </Link>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Intégrations</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">Connecter vos outils et garder les espaces d’exécution synchronisés.</p>
        <div className="mt-5">
          <Link href="/myplanning/app/integrations" className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
            Gérer les intégrations
          </Link>
        </div>
      </section>
    </div>
  );
}

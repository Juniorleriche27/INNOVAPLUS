"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export default function MyPlanningOpportunitiesPage() {
  const { user, loading } = useAuth();
  const isAuthenticated = Boolean(user?.email);

  if (loading) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Chargement des opportunités...</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Opportunités</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Connectez-vous pour ouvrir vos opportunités</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Les opportunités débloquées dépendent de votre progression KORYXA, de votre readiness et de vos validations.
        </p>
        <div className="mt-6">
          <Link href="/myplanning/login?redirect=/myplanning/opportunities" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700">
            Se connecter
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Opportunités KORYXA</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Choisissez le bon espace pour agir</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Les opportunités ne partent pas d’une liste brute. Elles se débloquent ou se priorisent selon votre trajectoire,
          vos preuves et votre niveau de préparation.
        </p>
        <div className="mt-6 grid gap-3">
          <Link href="/myplanning/app/koryxa" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-sky-200 hover:bg-sky-50/50">
            <p className="text-sm font-semibold text-slate-950">Trajectoire</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Voir les opportunités recommandées, débloquées ou priorisées selon votre progression.</p>
          </Link>
          <Link href="/myplanning/app/koryxa-enterprise" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-sky-200 hover:bg-sky-50/50">
            <p className="text-sm font-semibold text-slate-950">Entreprise</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Suivre les besoins structurés, les missions proposées et les publications éventuelles.</p>
          </Link>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Règle métier</p>
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          <p>Une opportunité visible n’est pas une annonce brute. C’est un débouché rattaché à un niveau réel de préparation.</p>
          <p>Le cockpit Trajectoire reste la source de vérité pour la readiness, les validations et le profil vérifié.</p>
          <p>Le cockpit Entreprise reste la source de vérité pour les besoins, les missions et les publications utiles.</p>
        </div>
      </section>
    </div>
  );
}

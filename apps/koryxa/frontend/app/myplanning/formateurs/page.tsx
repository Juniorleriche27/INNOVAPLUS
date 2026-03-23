"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

const LEARNERS = [
  { name: "Cohorte Data Analyst", load: "8 / 10", status: "Suivi actif", note: "3 preuves à revoir cette semaine" },
  { name: "Cohorte Data Engineer", load: "5 / 8", status: "Progression stable", note: "1 apprenant proche de la validation" },
  { name: "Cohorte ML / IA appliquée", load: "4 / 6", status: "Montée en charge", note: "1 besoin entreprise potentiellement compatible" },
];

const KPI = [
  { label: "Capacité mensuelle", value: "18 apprenants" },
  { label: "Validation moyenne", value: "91%" },
  { label: "Supervision entreprise", value: "Éligible" },
];

export default function TrainerPartnerDashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <section className="rounded-[30px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Chargement de l’espace partenaire…</section>;
  }

  if (!user?.email) {
    return (
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Espace partenaire</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Connectez-vous pour accéder à l’espace formateur</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Cet espace sert à suivre la capacité mensuelle, les cohortes, les validations et les éventuelles activations côté entreprise.
        </p>
        <Link href="/login?redirect=%2Fmyplanning%2Fformateurs" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700">
          Se connecter
        </Link>
      </section>
    );
  }

  return (
    <main className="grid gap-6">
      <section className="rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,247,255,0.95))] p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
          <div>
            <span className="inline-flex rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
              Partenaire formateur
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              L’espace de pilotage des capacités humaines KORYXA.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Le rôle du formateur ne se limite pas à l’accompagnement. Il s’agit aussi de gérer la charge, les validations,
              la qualité de progression et, dans certains cas, la supervision de besoins entreprise.
            </p>
          </div>
          <div className="grid gap-3">
            {KPI.map((item) => (
              <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white/90 px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Cohortes et charge</p>
          <div className="mt-5 grid gap-3">
            {LEARNERS.map((item) => (
              <div key={item.name} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.status}</p>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{item.load}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[30px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Actions prioritaires</p>
          <div className="mt-5 grid gap-3 text-sm leading-7 text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">Revoir les preuves soumises et accélérer les validations utiles.</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">Identifier les profils proches d’une affectation ou d’un stage crédible.</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">Rester disponible pour supervision sur un besoin entreprise si la demande l’exige.</div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/community/messages" className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-50">
              Ouvrir les messages
            </Link>
            <Link href="/community" className="inline-flex rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15">
              Voir le réseau IA
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}


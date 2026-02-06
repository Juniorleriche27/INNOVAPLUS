"use client";

import Link from "next/link";
import { useState } from "react";

export default function MyPlanningTeamPage() {
  const [open, setOpen] = useState(false);

  function openTeamModal() {
    setOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanning Team</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Pour les equipes (bientot).</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          L’architecture est prete, mais les actions sont bloquees : pas d’activation backend, pas d’assignation reelle pour le moment.
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">Fonctionnalite en preparation. Disponible bientot pour les equipes.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/myplanning/pricing" className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            Voir les tarifs
          </Link>
          <button
            onClick={openTeamModal}
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Fonctionnalite Team
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          { title: "Collaborateurs", desc: "Inviter et gerer les membres." },
          { title: "Assignation", desc: "Assigner des taches et suivre l’avancement." },
          { title: "Reporting", desc: "Vue globale et rapports d’execution." },
          { title: "Admin", desc: "Roles, permissions, parametres d’equipe." },
        ].map((item) => (
          <button
            key={item.title}
            onClick={openTeamModal}
            className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-sky-200 hover:bg-sky-50/40"
          >
            <p className="text-sm font-semibold text-slate-900">🔒 {item.title}</p>
            <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            <p className="mt-4 text-xs font-semibold text-slate-500">Fonctionnalite Team — Disponible prochainement</p>
          </button>
        ))}
      </section>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanning Team</p>
            <p className="mt-3 text-base font-semibold text-slate-900">Fonctionnalite Team — Disponible prochainement</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => setOpen(false)}
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Fermer
              </button>
              <Link href="/myplanning/pro" className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
                Voir l’offre Pro
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


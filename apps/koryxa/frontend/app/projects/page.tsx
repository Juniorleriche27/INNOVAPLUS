"use client";

import Link from "next/link";

export default function ProjectsLanding() {
  return (
    <div className="w-full px-4 py-8 sm:px-8 lg:px-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Opportunités</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Pipeline des opportunités</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Cette section regroupera bientôt toutes les opportunités publiées dans KORYXA. Vous pourrez
            suivre les besoins en cours, les offres déposées et transformer vos projets en fiches
            d&apos;action concrètes.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-5">
          <h2 className="text-base font-semibold text-slate-900">Que pouvez-vous faire en attendant ?</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Publiez un nouveau besoin depuis l’interface “Poster un besoin”.</li>
            <li>Déposez une offre détaillée via le formulaire projet.</li>
            <li>Contactez l’équipe KORYXA pour partager vos idées d’opportunités locales.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/missions/new"
              className="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              Poster un besoin
            </Link>
            <Link
              href="/projects/new"
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Créer une offre
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
          Vous souhaitez intégrer une opportunité existante ou suivre un pipeline spécifique ? Partagez le
          besoin à <a className="font-semibold text-sky-600" href="mailto:hello@koryxa.africa">hello@koryxa.africa</a> et nous l’ajouterons à la feuille de route.
        </div>
      </div>
    </div>
  );
}

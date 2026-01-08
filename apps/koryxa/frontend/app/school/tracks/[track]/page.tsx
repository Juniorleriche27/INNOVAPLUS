import Link from "next/link";

const TRACKS: Record<string, { title: string; focus: string; items: string[] }> = {
  "data-analyst": {
    title: "Data Analyst",
    focus: "Analyse et tableaux de bord pour la decision.",
    items: [
      "nettoyage et preparation des donnees",
      "analyse descriptive et exploratoire",
      "tableaux de bord clairs pour les equipes",
    ],
  },
  "data-engineer": {
    title: "Data Engineer",
    focus: "Pipelines fiables et preparation des donnees.",
    items: [
      "collecte et structuration des donnees",
      "pipelines et automatisation",
      "qualite et monitoring des flux",
    ],
  },
  "data-scientist": {
    title: "Data Scientist",
    focus: "Modeles et experimentation appliquee.",
    items: [
      "formulation des hypotheses",
      "modeles predictifs simples",
      "evaluation et interpretation",
    ],
  },
  "machine-learning-engineer": {
    title: "Machine Learning Engineer",
    focus: "Industrialisation des modeles ML.",
    items: [
      "mise en production des modeles",
      "performance et suivi des modeles",
      "collaboration avec les equipes data",
    ],
  },
};

export default function SchoolTrackPage({ params }: { params: { track: string } }) {
  const track = TRACKS[params.track];

  if (!track) {
    return (
      <main className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Track indisponible</h1>
          <p className="mt-2 text-sm text-slate-600">Ce parcours n'est pas encore publie.</p>
          <Link href="/school" className="btn-secondary mt-6 inline-flex">Retour a KORYXA School</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-12 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Specialisation</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{track.title}</h1>
          <p className="mt-2 text-base text-slate-600">{track.focus}</p>
          <Link href="/school" className="btn-secondary mt-6 inline-flex">Retour a KORYXA School</Link>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Ce que vous apprenez</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
            {track.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

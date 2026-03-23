import type { Metadata } from "next";
import EnterpriseFlowClient from "../EnterpriseFlowClient";

export const metadata: Metadata = {
  title: "Démarrer Entreprise | KORYXA",
  description:
    "Qualifiez un besoin IA/data avec KORYXA pour obtenir un cadrage, un mode de traitement et une entrée dans le cockpit entreprise.",
};

export default function EntrepriseDemarrerPage() {
  return (
    <main className="grid gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(238,247,255,0.98))] px-6 py-8 shadow-[0_26px_72px_rgba(15,23,42,0.08)] sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.16fr_0.84fr] lg:items-start">
          <div>
            <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
              Qualification entreprise
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Transformez un besoin IA flou en besoin structuré, actionnable et pilotable.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              KORYXA aide à cadrer l’objectif, qualifier le contexte, recommander un mode de traitement et préparer
              le cockpit d’exécution avant même qu’une mission ou un livrable soit engagé.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              "Analyse de données, modèles explicatifs, assistants intelligents et automatisation font partie du périmètre.",
              "La logique d’entrée est business et opérationnelle, pas d’abord RH.",
              "Le résultat attendu est un besoin qualifié, un résumé structuré et une prochaine action claire.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-slate-200/80 bg-white/88 px-4 py-4 text-sm leading-7 text-slate-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <EnterpriseFlowClient />
      </div>
    </main>
  );
}

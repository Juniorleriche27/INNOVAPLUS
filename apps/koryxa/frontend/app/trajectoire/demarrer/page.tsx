import type { Metadata } from "next";
import TrajectoryFlowClient from "../TrajectoryFlowClient";

export const metadata: Metadata = {
  title: "Démarrer Trajectoire | KORYXA",
  description:
    "Lancez le diagnostic KORYXA pour obtenir une orientation IA, un plan de progression et le bon matching formateur.",
};

export default function TrajectoireDemarrerPage() {
  return (
    <main className="grid gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(237,247,255,0.98))] px-6 py-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
          <div>
            <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
              Diagnostic Trajectoire
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Une entrée guidée pour choisir la bonne trajectoire IA et ouvrir le bon cockpit.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Ce diagnostic n’est pas un formulaire décoratif. Il sert à recommander une orientation crédible,
              cadrer la progression, préparer le matching formateur et poser les bases d’un profil vérifiable.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              "Data Analyst, Data Engineer et ML / IA appliquée sont ouverts dès la phase 1.",
              "Le résultat doit déboucher sur une orientation, des preuves attendues et une logique de validation.",
              "Le matching formateur intervient ensuite comme capacité structurée, pas comme gadget.",
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

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <TrajectoryFlowClient />
      </div>
    </main>
  );
}

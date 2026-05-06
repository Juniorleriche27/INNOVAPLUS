import type { Metadata } from "next";
import {
  BarChart3,
  CheckCircle2,
  Database,
  FileText,
  LineChart,
  PieChart,
  Rocket,
  Table2,
} from "lucide-react";
import {
  PublishedGradientBand,
  PublishedHero,
  PublishedSectionHeading,
} from "@/components/marketing/PublishedSiteSections";

export const metadata: Metadata = {
  title: "Parcours Data Analyst | KORYXA Formation IA",
  description:
    "Parcours Data Analyst KORYXA : Python, SQL, Excel avancé, analyse métier, visualisation, portfolio et validation par preuves.",
};

const MODULES = [
  {
    icon: Rocket,
    title: "Orientation Data Analyst",
    description: "Comprendre le métier, les objectifs du parcours et installer l'environnement de travail.",
  },
  {
    icon: Table2,
    title: "Python pour l'analyse",
    description: "Utiliser Python pour traiter des cas simples : variables, conditions, fonctions et logique métier.",
  },
  {
    icon: Database,
    title: "Manipulation de données",
    description: "Importer, filtrer, nettoyer, croiser et structurer des données avec Pandas.",
  },
  {
    icon: CheckCircle2,
    title: "Qualité des données",
    description: "Repérer les doublons, valeurs manquantes, incohérences et erreurs d'interprétation.",
  },
  {
    icon: BarChart3,
    title: "Visualisation",
    description: "Créer des graphiques clairs pour expliquer une situation, une tendance ou un problème.",
  },
  {
    icon: PieChart,
    title: "Analyse exploratoire",
    description: "Identifier des segments, comparer des indicateurs et faire ressortir les vrais signaux.",
  },
  {
    icon: FileText,
    title: "Rapport décisionnel",
    description: "Transformer une analyse en recommandations compréhensibles par un dirigeant ou une équipe.",
  },
  {
    icon: LineChart,
    title: "Projet portfolio",
    description: "Réaliser une analyse complète, présentable et exploitable comme preuve de compétence.",
  },
];

const OUTCOMES = [
  "Analyser un fichier de données réel avec Python et Pandas.",
  "Nettoyer les données avant de produire des conclusions.",
  "Créer des visualisations lisibles et utiles.",
  "Rédiger un rapport clair avec recommandations métier.",
  "Construire un premier portfolio Data Analyst.",
  "Préparer son profil pour les opportunités KORYXA.",
];

export default function DataAnalystTrackPage() {
  return (
    <main>
      <PublishedHero
        title="Parcours Data Analyst"
        description="Apprenez à analyser des données réelles avec Python, SQL, Excel avancé et une logique métier claire. L'objectif n'est pas seulement d'apprendre des outils, mais de produire des analyses utiles, visibles et exploitables."
        actions={[
          { href: "/trajectoire/demarrer", label: "Commencer le diagnostic" },
          { href: "#programme", label: "Voir le programme" },
        ]}
      />

      <section className="bg-[#020617] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[var(--marketing-max-w)]">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">Prix lancement</p>
              <p className="mt-4 text-4xl font-black text-white">29 000 FCFA</p>
              <p className="mt-2 text-sm text-slate-400">Accès au parcours Data Analyst avec progression guidée.</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">Niveau</p>
              <p className="mt-4 text-3xl font-black text-white">Débutant accepté</p>
              <p className="mt-2 text-sm text-slate-400">Le parcours part des bases et avance vers un projet portfolio.</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">Objectif</p>
              <p className="mt-4 text-3xl font-black text-white">Portfolio data</p>
              <p className="mt-2 text-sm text-slate-400">Vous terminez avec une preuve concrète de compétence.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="programme" className="bg-[#020617] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[var(--marketing-max-w)]">
          <PublishedSectionHeading
            title="8 modules pour devenir Data Analyst opérationnel"
            description="Un parcours progressif : apprendre, pratiquer, produire une analyse et construire une preuve."
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((module, index) => {
              const Icon = module.icon;
              return (
                <article key={module.title} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 transition hover:border-sky-400/50 hover:bg-white/[0.05]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Module {index + 1}</p>
                  <h3 className="mt-2 text-lg font-bold text-white">{module.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{module.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#020617] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[var(--marketing-max-w)] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">Résultat attendu</p>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
              À la fin, vous ne dites pas seulement “j'ai appris Python”.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-400">
              Vous montrez une analyse, un rapport, des graphiques, des recommandations et une logique métier. C'est cette preuve qui donne de la valeur au parcours.
            </p>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
            <div className="grid gap-4">
              {OUTCOMES.map((outcome) => (
                <div key={outcome} className="flex gap-3 rounded-2xl bg-white/[0.03] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-6 text-slate-300">{outcome}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PublishedGradientBand
        title="Prêt à commencer le parcours Data Analyst ?"
        description="Commencez par le diagnostic KORYXA pour cadrer votre niveau, votre objectif et votre trajectoire."
        actionHref="/trajectoire/demarrer"
        actionLabel="Commencer le diagnostic"
      />
    </main>
  );
}

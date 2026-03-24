import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Bot, CheckCircle2, Database, Gauge, Workflow } from "lucide-react";
import { PublishedCard, PublishedGradientBand, PublishedHero, PublishedSectionHeading } from "@/components/marketing/PublishedSiteSections";

export const metadata: Metadata = {
  title: "Entreprise | KORYXA",
  description: "KORYXA structure votre besoin métier avant de parler technologie. Analytics, prédiction, automatisation et assistants IA.",
};

const CASES = [
  { icon: <BarChart3 className="h-6 w-6" />, title: "Tableaux de bord & analytics métier", description: "Visualisez vos données, identifiez les tendances et prenez des décisions éclairées." },
  { icon: <Gauge className="h-6 w-6" />, title: "Modèles prédictifs & explicatifs", description: "Anticipez les comportements, optimisez les processus et comprenez les facteurs clés." },
  { icon: <Bot className="h-6 w-6" />, title: "Chatbots & assistants intelligents", description: "Automatisez le support client, la FAQ et les processus internes avec des agents IA." },
  { icon: <Workflow className="h-6 w-6" />, title: "Automatisation de workflows", description: "Gagnez en efficacité en automatisant les tâches répétitives et les processus métier." },
  { icon: <Database className="h-6 w-6" />, title: "Structuration de données", description: "Organisez, nettoyez et préparez vos données pour une exploitation optimale." },
];

const STEPS = [
  { step: "1", title: "Cadrage du besoin", description: "Objectif, contexte, données disponibles et résultat attendu." },
  { step: "2", title: "Qualification", description: "Clarification du besoin et recommandation de mode de traitement." },
  { step: "3", title: "Cockpit entreprise", description: "Accès à votre cockpit avec brief structuré et plan d'exécution." },
  { step: "4", title: "Exécution & livraison", description: "Suivi, activation de capacités et livraison des résultats." },
];

const DELIVERABLES = [
  { title: "Gouvernance & qualité", description: "Processus rigoureux, traçabilité et validation à chaque étape." },
  { title: "Activation de capacités", description: "Formateurs superviseurs et talents certifiés selon le besoin." },
  { title: "Résultats concrets", description: "Livrables opérationnels, pas de concepts abstraits." },
];

export default function EntreprisePage() {
  return (
    <main>
      <PublishedHero
        title="Vous avez un besoin IA ou data dans votre activité ?"
        description="KORYXA structure votre besoin métier avant de parler technologie. Analytics, prédiction, automatisation, chatbots : nous cadrons, qualifions et livrons."
        actions={[{ href: "/entreprise/demarrer", label: "Exprimer votre besoin" }]}
      />

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[var(--marketing-max-w)]">
          <PublishedSectionHeading
            title="Cas d'intervention"
            description="KORYXA vous accompagne sur une large gamme de besoins IA et data pour votre organisation."
          />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {CASES.map((item) => (
              <PublishedCard key={item.title} icon={item.icon} title={item.title} description={item.description} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[var(--marketing-max-w)]">
          <PublishedSectionHeading
            title="Du besoin à la livraison"
            description="Un processus clair et structuré pour garantir des résultats concrets."
          />
          <div className="grid gap-8 md:grid-cols-4">
            {STEPS.map((item, index) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{item.description}</p>
                {index < STEPS.length - 1 ? <div className="absolute left-full top-8 hidden h-0.5 w-full -translate-x-4 bg-sky-200 md:block" /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[var(--marketing-max-w)]">
          <PublishedSectionHeading title="Ce que vous recevez" />
          <div className="grid gap-8 md:grid-cols-3">
            {DELIVERABLES.map((item) => (
              <PublishedCard
                key={item.title}
                icon={<CheckCircle2 className="h-8 w-8" />}
                title={item.title}
                description={item.description}
                className="text-center"
              />
            ))}
          </div>
        </div>
      </section>

      <PublishedGradientBand
        title="Structurons votre besoin IA ensemble"
        description="Un diagnostic guidé de 5 minutes pour cadrer votre projet et recevoir une recommandation structurée."
        actionHref="/entreprise/demarrer"
        actionLabel="Démarrer le diagnostic"
      />

      <section className="bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[var(--marketing-max-w)]">
          <Link href="/entreprise/demarrer" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
            Aller directement au démarrage
          </Link>
        </div>
      </section>
    </main>
  );
}

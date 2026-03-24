import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Bot, CalendarRange, HeartPulse } from "lucide-react";
import { PublishedHero } from "@/components/marketing/PublishedSiteSections";

export const metadata: Metadata = {
  title: "Produits | KORYXA",
  description: "Un écosystème de solutions intelligentes pour orchestrer vos besoins IA et accompagner votre croissance.",
};

const PRODUCTS = [
  {
    id: "myplanningai",
    name: "MyPlanningAI",
    icon: <CalendarRange className="h-8 w-8 text-sky-600" />,
    tagline: "Moteur d'exécution intelligent",
    description: "Planification, suivi et exécution de projets IA avec intelligence artificielle intégrée.",
    features: ["Gestion de tâches", "Suivi automatisé", "Insights AI"],
    bg: "bg-sky-100",
  },
  {
    id: "chatlaya",
    name: "ChatLAYA",
    icon: <Bot className="h-8 w-8 text-emerald-600" />,
    tagline: "Assistant conversationnel KORYXA",
    description: "Assistant intelligent pour cadrer besoins, comprendre trajectoires et découvrir opportunités.",
    features: ["Conversations contextuelles", "Recommandations", "Multi-usage"],
    bg: "bg-emerald-100",
  },
  {
    id: "sante",
    name: "KORYXA Santé & Bien-être",
    icon: <HeartPulse className="h-8 w-8 text-rose-600" />,
    tagline: "Accompagnement santé intelligent",
    description: "Plateforme de suivi et accompagnement santé avec IA pour le bien-être.",
    features: ["Suivi personnalisé", "Recommandations santé", "Prévention"],
    bg: "bg-rose-100",
  },
  {
    id: "plusbooks",
    name: "PlusBooks",
    icon: <BookOpen className="h-8 w-8 text-amber-600" />,
    tagline: "Gestion comptable intelligente",
    description: "Solution de gestion comptable et financière assistée par IA pour TPE et PME.",
    features: ["Comptabilité automatisée", "Tableaux de bord", "Conformité"],
    bg: "bg-amber-100",
  },
];

export default function ProductsPage() {
  return (
    <main>
      <PublishedHero
        title="Produits KORYXA"
        description="Un écosystème de solutions intelligentes pour orchestrer vos besoins IA et accompagner votre croissance."
      />

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[var(--marketing-max-w)] gap-8 md:grid-cols-2">
          {PRODUCTS.map((product) => (
            <article key={product.id} className="rounded-[30px] border border-slate-200/80 bg-white p-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
              <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${product.bg}`}>{product.icon}</div>
              <h2 className="text-2xl font-bold text-slate-950">{product.name}</h2>
              <p className="mt-2 text-sm font-semibold text-sky-600">{product.tagline}</p>
              <p className="mt-4 text-sm leading-7 text-slate-600">{product.description}</p>
              <ul className="mt-6 space-y-2">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href={`/produits/${product.id}`} className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700">
                En savoir plus
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

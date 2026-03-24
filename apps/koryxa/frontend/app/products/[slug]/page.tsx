import type { Metadata } from "next";
import { CalendarRange, Bot, HeartPulse, BookOpen, CheckCircle2 } from "lucide-react";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const PRODUCTS = {
  myplanningai: {
    name: "MyPlanningAI",
    tagline: "Moteur d'exécution intelligent",
    description: "Planifiez, suivez et exécutez vos projets IA avec un moteur intelligent qui s'adapte à vos besoins.",
    features: ["Gestion intelligente de tâches", "Suivi automatisé", "Insights pilotés par IA", "Intégration KORYXA"],
    icon: <CalendarRange className="h-8 w-8 text-white" />,
  },
  chatlaya: {
    name: "ChatLAYA",
    tagline: "Assistant conversationnel KORYXA",
    description: "Assistant intelligent pour cadrer besoins, comprendre trajectoires et découvrir opportunités.",
    features: ["Conversations contextuelles", "Recommandations", "Découverte produit", "Aide orientée parcours"],
    icon: <Bot className="h-8 w-8 text-white" />,
  },
  sante: {
    name: "KORYXA Santé & Bien-être",
    tagline: "Accompagnement santé intelligent",
    description: "Plateforme de suivi et accompagnement santé avec IA pour le bien-être.",
    features: ["Suivi personnalisé", "Recommandations santé", "Prévention", "Parcours assistés"],
    icon: <HeartPulse className="h-8 w-8 text-white" />,
  },
  plusbooks: {
    name: "PlusBooks",
    tagline: "Gestion comptable intelligente",
    description: "Solution de gestion comptable et financière assistée par IA pour TPE et PME.",
    features: ["Comptabilité automatisée", "Tableaux de bord", "Conformité", "Pilotage financier"],
    icon: <BookOpen className="h-8 w-8 text-white" />,
  },
} as const;

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const product = PRODUCTS[slug as keyof typeof PRODUCTS];
  return {
    title: `${product?.name ?? slug} | KORYXA`,
    description: product?.description ?? "Produit KORYXA",
  };
}

export default async function ProductPage(props: ProductPageProps) {
  const { slug } = await props.params;
  const product = PRODUCTS[slug as keyof typeof PRODUCTS] ?? PRODUCTS.myplanningai;

  return (
    <main>
      <section className="relative left-1/2 w-screen -translate-x-1/2 bg-[linear-gradient(135deg,#0d8fda_0%,#0d6aa8_100%)] py-20 text-white">
        <div className="mx-auto max-w-[var(--marketing-max-w)] px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">{product.icon}</div>
            <div>
              <h1 className="text-4xl font-bold md:text-5xl">{product.name}</h1>
              <p className="mt-2 text-lg text-sky-100">{product.tagline}</p>
            </div>
          </div>
          <p className="max-w-3xl text-xl text-sky-100">{product.description}</p>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[var(--marketing-max-w)] gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-slate-950">Fonctionnalités principales</h2>
            <div className="mt-6 space-y-4">
              {product.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
                  <p className="text-lg text-slate-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>
          <article className="rounded-[30px] border border-slate-200/80 bg-slate-50 p-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <h3 className="text-xl font-bold text-slate-950">Commencer avec {product.name}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Découvrez comment ce produit peut transformer votre façon de travailler.
            </p>
            <button type="button" className="mt-6 w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
              Demander une démo
            </button>
          </article>
        </div>
      </section>
    </main>
  );
}

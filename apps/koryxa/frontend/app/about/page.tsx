import type { Metadata } from "next";
import { Globe2, Target, Trophy, Users } from "lucide-react";
import { PublishedCard, PublishedHero } from "@/components/marketing/PublishedSiteSections";

export const metadata: Metadata = {
  title: "À propos | KORYXA",
  description: "Plateforme premium d'orchestration IA qui connecte besoins entreprise, trajectoires talent et missions.",
};

const VALUES = [
  { icon: <Trophy className="h-8 w-8" />, title: "Excellence", description: "Standards élevés dans tout ce que nous faisons" },
  { icon: <Users className="h-8 w-8" />, title: "Écosystème", description: "Connexion entre entreprises, talents et formateurs" },
  { icon: <Target className="h-8 w-8" />, title: "Impact", description: "Résultats concrets et mesurables" },
  { icon: <Globe2 className="h-8 w-8" />, title: "Afrique & Monde", description: "Enraciné en Afrique, crédible internationalement" },
];

export default function AboutPage() {
  return (
    <main>
      <PublishedHero
        title="À propos de KORYXA"
        description="Plateforme premium d'orchestration IA qui connecte besoins entreprise, trajectoires talent, formateurs partenaires et missions dans un écosystème d'excellence."
      />

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[var(--marketing-max-w)]">
          <div className="mx-auto mb-16 max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-950">Notre mission</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              KORYXA structure les besoins IA des entreprises et bâtit les carrières IA des talents avec rigueur,
              validation et excellence. Nous ne sommes ni une agence générique, ni une école pure, ni une
              marketplace de recrutement. Nous sommes une plateforme stratégique d'orchestration.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((item) => (
              <PublishedCard key={item.title} icon={item.icon} title={item.title} description={item.description} className="text-center" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export type ProductInfo = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  highlights: string[];
  heroImage: string;
  stats: { label: string; value: string }[];
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  contact?: string;
  useCases: string[];
};

export const productCatalog: Record<string, ProductInfo> = {
  "myplanning": {
    slug: "myplanning",
    name: "MyPlanningAI",
    tagline: "Assistant temps & priorités pour équipes africaines.",
    summary:
      "MyPlanning orchestre Eisenhower, MoSCoW, Kanban, Pomodoro et suggestions IA Llama pour aider étudiants, entrepreneurs et équipes à structurer leurs journées.",
    heroImage:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=60",
    highlights: [
      "Kanban 3 colonnes + vues Aujourd'hui / Semaine",
      "Mode simple vs avancé (objectifs, énergie, Pomodoro, collaborateurs)",
      "Boutons IA : génération de tâches, plan du jour, replanification express",
      "Connecté au backend KORYXA (auth, profils, Llama interne)",
    ],
    stats: [
      { label: "Méthodes couvertes", value: "5" },
      { label: "IA intégrée", value: "Llama" },
      { label: "Temps de prise en main", value: "<10 min" },
    ],
    primaryCta: { label: "Ouvrir MyPlanning", href: "/myplanning" },
    secondaryCta: {
      label: "Documentation produit",
      href: "https://github.com/innovaplus/KORYXA/tree/main/products",
    },
    contact: "myplanning@koryxa.africa",
    useCases: [
      "Incubateurs souhaitant coacher leurs cohortes",
      "Equipes projet cherchant un cockpit frugal",
      "Entrepreneurs solos voulant ritualiser leurs semaines",
    ],
  },
  "chatlaya": {
    slug: "chatlaya",
    name: "ChatLAYA",
    tagline: "Copilote conversationnel pour cadrer, produire et faire avancer l'exécution.",
    summary:
      "ChatLAYA aide à clarifier une demande, structurer une réponse utile, générer des pistes d'action et accompagner l'exécution dans un cadre conversationnel plus lisible.",
    heroImage:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=60",
    highlights: [
      "Clarification rapide d'un besoin, d'une trajectoire ou d'un cas d'usage métier",
      "Réponses structurées avec résumé, plan d'action, KPIs et points de vigilance",
      "Accès conversationnel simple pour accompagner orientation, cadrage et exécution",
      "Intégré à l'écosystème KORYXA pour relier produit, progression et opportunités",
    ],
    stats: [
      { label: "Mode d'interaction", value: "Conversation guidée" },
      { label: "Usage cible", value: "Clarifier et produire" },
      { label: "Accès", value: "Web" },
    ],
    primaryCta: { label: "Ouvrir ChatLAYA", href: "/chatlaya" },
    contact: "chatlaya@koryxa.africa",
    useCases: [
      "Clarifier un besoin avant de lancer Trajectoire ou Entreprise",
      "Produire une première réponse structurée sur un sujet métier",
      "Aider une équipe à transformer une idée floue en plan d'action exploitable",
    ],
  },
};

export const productList = Object.values(productCatalog);

export const removedProductSlugs = new Set(["plusbook", "plusbooks", "koryxa-sante", "sante"]);

export const productSlugAliases: Record<string, string> = {
  myplanningai: "myplanning",
};

export function resolveProductSlug(slug: string): string {
  return productSlugAliases[slug] || slug;
}

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
  "service-ia": {
    slug: "service-ia",
    name: "Service IA",
    tagline: "Studio d'execution IA pour les besoins entreprise.",
    summary:
      "Service IA transforme un besoin metier en execution complete: cadrage, devis, equipe, production, livrables et suivi.",
    heroImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=60",
    highlights: [
      "10 offres structurees: data, automation, applications, systemes et securite",
      "Workflow clair: demande, qualification, devis, acceptance, execution, livraison",
      "Pilotage KORYXA de bout en bout avec suivi client",
      "Organisation des equipes talent + supervision selon chaque mission",
    ],
    stats: [
      { label: "Offres actives", value: "10 services" },
      { label: "Mode operationnel", value: "Projet pilote" },
      { label: "Acces", value: "Web + espace client" },
    ],
    primaryCta: { label: "Decouvrir Service IA", href: "/services-ia" },
    contact: "services@koryxa.africa",
    useCases: [
      "Structurer une demande entreprise et recevoir une proposition exploitable",
      "Lancer un projet data, IA, automation ou digital avec equipe dediee",
      "Suivre avancement, livrables et priorites depuis un espace client",
    ],
  },
};

export const productList = Object.values(productCatalog);

export const removedProductSlugs = new Set(["plusbook", "plusbooks", "koryxa-sante", "sante"]);

export const productSlugAliases: Record<string, string> = {
  chatlaya: "service-ia",
};

export function resolveProductSlug(slug: string): string {
  return productSlugAliases[slug] || slug;
}

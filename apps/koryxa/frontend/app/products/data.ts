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
    name: "MyPlanning",
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
  "koryxa-sante": {
    slug: "koryxa-sante",
    name: "KORYXA Santé & Bien-être",
    tagline: "Plateforme IA pour la prévention, l'analyse et l'assistance médicale intelligente.",
    summary:
      "Suite d'outils d'analytique santé avec datasets spécialisés, modèles prédictifs, chatbot RAG médical et interface Streamlit prête à déployer pour les ministères, ONG et hôpitaux.",
    heroImage:
      "https://images.unsplash.com/photo-1580281657521-6c798d38b577?auto=format&fit=crop&w=1200&q=60",
    highlights: [
      "10 datasets santé (hôpitaux, nutrition, environnement, santé mentale…) avec pipeline d'analyse",
      "Modèles prédictifs : risques sanitaires, recommandations nutritionnelles, détection d'anomalies et épidémio",
      "Chatbot RAG médical pour interpréter les résultats et générer des rapports en langage naturel",
      "Interface Streamlit + API FastAPI pour intégration rapide dans vos programmes publics ou privés",
    ],
    stats: [
      { label: "Datasets intégrés", value: "10+" },
      { label: "Modèles IA prêts", value: "6" },
      { label: "Délai de déploiement", value: "48h" },
    ],
    primaryCta: { label: "Tester la démo Streamlit", href: "/contact?product=koryxa-sante" },
    secondaryCta: {
      label: "Lire la documentation",
      href: "https://github.com/innovaplus/KORYXA/tree/main/products/koryxa-sante",
    },
    contact: "sante@koryxa.africa",
    useCases: [
      "Ministères de la Santé et équipes épidémiologiques",
      "Clinique privée souhaitant un cockpit IA prédictif",
      "Laboratoires et ONG santé publique",
    ],
  },
  "pie-agency": {
    slug: "pie-agency",
    name: "PieAgency",
    tagline: "Chatbot marketing RAG pour convertir les prospects étudiants et partenaires.",
    summary:
      "Stack complète pour construire un assistant commercial multicanal : backend FastAPI orchestrant RAG + CTA, intégrations Groq/Mistral et CRM, expérience front intégrée dans KORYXA.",
    heroImage:
      "https://images.unsplash.com/photo-1529333166-07dea310048f?auto=format&fit=crop&w=1200&q=60",
    highlights: [
      "Backend FastAPI avec pipelines marketing, gestion CTA et paiements",
      "Corpus marketing/FAQ structuré, évaluations conversationnelles et monitoring Groq/Mistral",
      "Parcours front intégré dans KORYXA pour les offres & partenaires",
      "CI/CD, intégrations Qdrant, scripts d'ingestion et données nettoyées",
    ],
    stats: [
      { label: "Sources RAG", value: "50+" },
      { label: "Intégrations LLM", value: "Groq · Mistral" },
      { label: "Objectif conversion", value: "+30%" },
    ],
    primaryCta: { label: "Demander une présentation", href: "/contact?product=pieagency" },
    secondaryCta: {
      label: "Voir l'architecture",
      href: "https://github.com/innovaplus/KORYXA/tree/main/products/pie-agency",
    },
    contact: "pieagency@koryxa.africa",
    useCases: [
      "Universités et écoles voulant automatiser l'orientation",
      "Agences marketing cherchant un RAG pour leurs offres internes",
      "Programmes d'incubation souhaitant suivre les prospects",
    ],
  },
  plusbook: {
    slug: "plusbook",
    name: "PlusBooks",
    tagline: "Plateforme numérique pour publier, lire et partager des e-books locaux.",
    summary:
      "Expérience livrée dans le frontend KORYXA + API FastAPI pour créer une bibliothèque numérique communautaire : publication d'ebooks, recommandations IA, communauté de lecteurs et créateurs.",
    heroImage:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=60",
    highlights: [
      "Interface Next intégrée (Home, Explorer, Publication, communauté)",
      "Backend PlusBook (FastAPI) déjà intégré à l'API KORYXA",
      "Compatibilité mobile, dark mode, SEO optimisé",
      "Idéal pour bibliothèques numériques, écoles, éditeurs indépendants",
    ],
    stats: [
      { label: "E-books pris en charge", value: "PDF · EPUB" },
      { label: "Modules", value: "Publication · Lecture · Communauté" },
      { label: "Déploiement", value: "On-premise ou cloud" },
    ],
    primaryCta: { label: "Découvrir la démo", href: "/contact?product=plusbook" },
    // Pas de repo frontend dédié : parcours intégré dans le Next KORYXA
    contact: "plusbook@koryxa.africa",
    useCases: [
      "Bibliothèques numériques africaines",
      "Écoles / campus souhaitant un portail e-books",
      "Communautés d'auteurs indépendants",
    ],
  },
};

export const productList = Object.values(productCatalog);

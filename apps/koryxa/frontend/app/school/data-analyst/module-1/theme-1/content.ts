import type { ThemeVideo, ThemeArticle } from "../content";

export type ThemePageSection = {
  heading: string;
  body: string[];
};

export type ThemePage = {
  title: string;
  sections: ThemePageSection[];
};

export const theme1Meta = {
  title: "Theme 1 — Parties prenantes & matrice Pouvoir/Interet",
  module: "Module 1 — Cadrage & KPIs",
  readingTime: "45–60 min",
};

export const theme1Pages: ThemePage[] = [
  {
    title: "Pourquoi ce theme est critique en Data Analysis",
    sections: [
      {
        heading: "Le risque numero 1 n'est pas technique",
        body: [
          "Beaucoup de projets data echouent sans que la technique soit en cause. La cause la plus frequente est humaine : mauvais sponsor, besoins flous, attentes contradictoires, ou decision impossible a cause des conflits de definition.",
          "En Data Analysis, tu n'analyses pas \"des donnees\". Tu analyses un probleme de decision, porte par des acteurs. Si tu ignores ces acteurs, tu risques de produire un resultat vrai mais inutile.",
        ],
      },
      {
        heading: "Definition pratique",
        body: [
          "Une partie prenante est un individu ou une organisation qui est implique dans le projet ou dont les interets peuvent etre affectes positivement ou negativement par le projet.",
          "Cette definition est largement utilisee en gestion de projet et sert de base aux pratiques de stakeholder analysis.",
        ],
      },
    ],
  },
  {
    title: "Le probleme de decision avant les donnees",
    sections: [
      {
        heading: "Revenir a la decision",
        body: [
          "Le data analyst doit ramener la discussion vers la decision a prendre : qui decide, quelle action change, quel cout d'erreur est acceptable.",
          "Sans cette clarte, tu analyses tout et tu livres rien.",
        ],
      },
      {
        heading: "Symptome vs cause",
        body: [
          "Exemple e-commerce : symptome \"les ventes baissent\". Les causes possibles sont multiples : trafic, conversion, panier moyen, rupture stock, prix, bug paiement.",
          "Le cadrage permet de choisir la cause a tester, pas de tout mesurer sans priorite.",
        ],
      },
    ],
  },
  {
    title: "Parties prenantes internes",
    sections: [
      {
        heading: "Acteurs souvent sous-estimes",
        body: [
          "Sponsor (direction / finance) : celui qui possede le succes ou l'echec.",
          "Owner metier : responsable du processus (ex : Head of Sales).",
          "Utilisateurs finaux : ceux qui vont regarder un dashboard ou appliquer une recommandation.",
          "Data owners (IT / data engineering) : ceux qui donnent l'acces aux donnees.",
          "Securite / conformite : ceux qui peuvent interdire certaines donnees.",
          "Support / Ops : ceux qui doivent maintenir le systeme.",
        ],
      },
      {
        heading: "Pourquoi ils comptent",
        body: [
          "Un sponsor absent peut tuer un projet meme si le modele est parfait.",
          "Un data owner indisponible peut bloquer l'acces a la source cle.",
        ],
      },
    ],
  },
  {
    title: "Parties prenantes externes",
    sections: [
      {
        heading: "Acteurs externes a impact direct",
        body: [
          "Clients ou apprenants (si KORYXA School).",
          "Partenaires : entreprises, ONG, institutions.",
          "Regulateurs si donnees sensibles.",
          "Communaute si impact social.",
        ],
      },
      {
        heading: "Trois effets possibles",
        body: [
          "Une partie prenante peut bloquer, accelerer ou changer les objectifs.",
          "Ne pas les cartographier revient a piloter un projet a l'aveugle.",
        ],
      },
    ],
  },
  {
    title: "Methode en 5 etapes",
    sections: [
      {
        heading: "Une approche simple et robuste",
        body: [
          "1) Brainstorming : liste la totalite des acteurs concernes.",
          "2) Role et attentes : pour chacun, note ce qu'il attend.",
          "3) Pouvoir : capacite a influencer la decision ou les ressources.",
          "4) Interet : niveau d'attention ou d'impact.",
          "5) Positionnement : strategie d'engagement par quadrant.",
        ],
      },
      {
        heading: "Pourquoi cette methode marche",
        body: [
          "Elle est coherente avec les pratiques de stakeholder analysis et power/interest grid.",
          "Elle force une priorisation claire avant de collecter des donnees.",
        ],
      },
    ],
  },
  {
    title: "Matrice Pouvoir / Interet",
    sections: [
      {
        heading: "Definir pouvoir et interet",
        body: [
          "Pouvoir : capacite a imposer, bloquer ou financer.",
          "Interet : degre auquel la personne se sent concernee et va suivre le projet.",
          "Important : pouvoir et interet ne sont pas des qualites morales, ce sont des facteurs d'influence.",
        ],
      },
      {
        heading: "Pourquoi la matrice aide",
        body: [
          "Elle evite d'investir trop de temps sur des acteurs qui ne decident pas.",
          "Elle assure que les decisionnaires clefs sont impliques au bon moment.",
        ],
      },
    ],
  },
  {
    title: "Quadrant A — Gerer de pres",
    sections: [
      {
        heading: "Fort pouvoir / fort interet",
        body: [
          "Ce sont les key players.",
          "Reunions regulieres, validation frequente, transparence sur limites et risques.",
        ],
      },
      {
        heading: "Actions concretes",
        body: [
          "Definition des KPIs validee par ecrit.",
          "Rendez-vous court hebdomadaire pour ajuster le scope.",
        ],
      },
    ],
  },
  {
    title: "Quadrant B — Satisfaire",
    sections: [
      {
        heading: "Fort pouvoir / faible interet",
        body: [
          "Ils peuvent bloquer mais ne veulent pas perdre du temps.",
          "Messages courts, focus sur benefices business, pas de details techniques.",
        ],
      },
      {
        heading: "Actions concretes",
        body: [
          "Synthese executive mensuelle.",
          "Alerte uniquement si risque ou depassement budget.",
        ],
      },
    ],
  },
  {
    title: "Quadrant C — Informer",
    sections: [
      {
        heading: "Faible pouvoir / fort interet",
        body: [
          "Ils sont concernes mais ne decident pas.",
          "Newsletter projet, demos, feedback structure.",
        ],
      },
      {
        heading: "Actions concretes",
        body: [
          "Tableau de bord partage.",
          "Session de questions reponses a chaque jalon.",
        ],
      },
    ],
  },
  {
    title: "Quadrant D — Surveiller",
    sections: [
      {
        heading: "Faible pouvoir / faible interet",
        body: [
          "Minimum de communication.",
          "Garder un oeil au cas ou leur pouvoir change.",
        ],
      },
      {
        heading: "Actions concretes",
        body: [
          "Mise a jour trimestrielle.",
          "Point rapide si changement d'organisation.",
        ],
      },
    ],
  },
  {
    title: "Noter Pouvoir / Interet",
    sections: [
      {
        heading: "Echelle recommandee",
        body: [
          "Power : 1 (aucun) a 5 (decideur final).",
          "Interest : 1 (indifferent) a 5 (tres concerne).",
        ],
      },
      {
        heading: "Regles de notation",
        body: [
          "Power = 5 si la personne peut arreter le budget ou refuser l'acces aux donnees.",
          "Interest = 5 si la personne subit l'impact direct ou utilise le livrable chaque semaine.",
        ],
      },
    ],
  },
  {
    title: "Exemple KORYXA School",
    sections: [
      {
        heading: "Probleme",
        body: ["Augmenter le taux de completion du Module 1."],
      },
      {
        heading: "Stakeholders et notes",
        body: [
          "Sponsor : Power=5, Interest=4.",
          "DevOps : Power=4, Interest=3.",
          "Marketing : Power=3, Interest=4.",
          "Apprenants : Power=2, Interest=5.",
          "Support : Power=2, Interest=4.",
          "Mentor : Power=2, Interest=4.",
        ],
      },
      {
        heading: "Conclusion",
        body: [
          "Sponsor = gerer de pres.",
          "Apprenants/Support/Mentor = informer (et ecouter).",
          "DevOps = satisfaire + gerer de pres selon l'architecture.",
        ],
      },
    ],
  },
  {
    title: "Exemple municipal",
    sections: [
      {
        heading: "Probleme",
        body: ["Reduire le temps d'attente aux points d'eau."],
      },
      {
        heading: "Stakeholders",
        body: [
          "Mairie (power eleve).",
          "Gestionnaires de points d'eau (power moyen, interet eleve).",
          "Habitants (interet eleve, power faible individuellement).",
          "Police / autorites locales (power moyen).",
          "ONG (power variable).",
        ],
      },
      {
        heading: "Lecon",
        body: [
          "La donnee seule ne suffit pas : sans engagement de la mairie, aucune action ne sortira.",
        ],
      },
    ],
  },
  {
    title: "Livrables professionnels",
    sections: [
      {
        heading: "Stakeholder Register",
        body: [
          "Champs minimaux : nom/role, type interne/externe, attentes, power, interest, quadrant, strategie, canal, frequence, risques.",
          "C'est un livrable vendable qui montre ta rigueur.",
        ],
      },
      {
        heading: "Plan d'engagement",
        body: [
          "Qui voir chaque semaine ? Qui informer ? Qui satisfaire ? Qui surveiller ?",
          "Quel message cle pour chaque groupe ?",
        ],
      },
    ],
  },
  {
    title: "Erreurs classiques et checklist",
    sections: [
      {
        heading: "Erreurs classiques",
        body: [
          "Confondre personnes bruyantes et personnes puissantes.",
          "Sous-estimer le data owner (si acces donnees = 0, projet = 0).",
          "Oublier le support (les tickets revelent la verite terrain).",
          "Ne pas documenter les decisions.",
        ],
      },
      {
        heading: "Checklist",
        body: [
          "Liste des stakeholders complete (>= 10).",
          "Notation Power/Interest justifiee.",
          "Matrice produite + strategie par quadrant.",
          "Exports notebook generes et soumis.",
        ],
      },
    ],
  },
  {
    title: "Exercices et notebook",
    sections: [
      {
        heading: "Exercice A",
        body: [
          "Choisis un projet (KORYXA School ou un business local) et liste 10 stakeholders.",
          "Positionne-les dans la matrice.",
        ],
      },
      {
        heading: "Exercice B (notebook)",
        body: [
          "Charge stakeholders_input.csv, calcule le quadrant, la strategie et un score de priorite.",
          "Exporte theme1_stakeholder_register.csv et theme1_engagement_plan.md.",
        ],
      },
    ],
  },
  {
    title: "Resume a retenir",
    sections: [
      {
        heading: "La valeur d'un data analyst",
        body: [
          "La valeur ne vient pas seulement des calculs, mais de la capacite a produire des resultats utilises.",
          "Les parties prenantes determinent l'usage reel des resultats.",
          "La matrice Pouvoir/Interet est un outil simple pour structurer l'engagement.",
        ],
      },
    ],
  },
];

export const theme1Videos: ThemeVideo[] = [
  { title: "Parties prenantes et matrice Pouvoir-Interet", youtubeId: "fbxZAHgAxi8", lang: "fr" },
  { title: "Stakeholder Analysis: Winning Support for Your Projects (MindTools)", youtubeId: "9Fzfrcqqv5o", lang: "en" },
];

export const theme1Articles: ThemeArticle[] = [
  { label: "MindTools — Stakeholder Analysis + Power/Interest Grid", url: "https://www.mindtools.com/aol0rms/stakeholder-analysis/" },
  { label: "ProjectManagement.com — Power/Interest grid", url: "https://www.projectmanagement.com/articles/295438/Power-Interest-Grid" },
  { label: "Improvement Service — Power/Interest grid", url: "https://www.improvementservice.org.uk/products-and-services/impact-and-learning/how-to/analyse-stakeholders" },
  { label: "PMI — Stakeholders: definition & importance", url: "https://www.pmi.org/learning/library/stakeholder-management-project-success-8680" },
];

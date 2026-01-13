import type { ThemeArticle, ThemeVideo } from "../content";

export type ThemePageSection = {
  heading: string;
  body: string[];
};

export type ThemePage = {
  title: string;
  sections: ThemePageSection[];
};

export const theme2Meta = {
  title: "Thème 2 — Objectifs SMART & questions d’analyse",
  module: "Module 1 — Cadrage & KPIs",
  readingTime: "60–90 min",
};

export const theme2Videos: ThemeVideo[] = [
  { title: "Methode SMART : definir des objectifs clairs", youtubeId: "sD_dyR76KNM", lang: "fr" },
  { title: "How to Set SMART Goals (MindTools)", youtubeId: "OXA6gfzFA24", lang: "en" },
];

export const theme2Articles: ThemeArticle[] = [
  { label: "SMART criteria (historique + variations)", url: "https://en.wikipedia.org/wiki/SMART_criteria" },
  { label: "How to write SMART goals (Atlassian)", url: "https://www.atlassian.com/blog/productivity/how-to-write-smart-goals" },
];

export const theme2Pages: ThemePage[] = [
  {
    title: "Pourquoi ce thème est central (et pourquoi beaucoup de projets échouent)",
    sections: [
      {
        heading: "Lecture (Page 1)",
        body: [
          "La cause la plus fréquente d’échec n’est pas toujours la “mauvaise donnée”. Très souvent, le projet échoue parce que l’objectif est flou : l’analyse n’a pas de direction, pas de fin, et surtout pas d’impact.",
          "Quand une organisation dit “on veut un dashboard”, “on veut analyser les ventes”, “on veut comprendre l’abandon”, elle exprime une inquiétude ou une ambition, mais pas un objectif opérationnel.",
          "Ce thème sert à transformer une demande vague en objectifs clairs + questions d’analyse testables : tu choisis ensuite les données, les KPI prioritaires, les segmentations utiles, et même la forme du livrable final.",
          "Un KPI sans objectif, c’est du décor. Un objectif sans KPI, c’est un slogan. Un objectif sans délai, c’est une intention. Un objectif sans responsable, c’est une rumeur.",
          "Résultat attendu : un objectif SMART complet (baseline + cible + délai + périmètre) + un garde-fou qualité + 3–6 questions d’analyse + 2 hypothèses testables + un plan simple de baseline via notebook.",
        ],
      },
    ],
  },
  {
    title: "Besoin, objectif, KPI : ne pas confondre",
    sections: [
      {
        heading: "Lecture (Page 2)",
        body: [
          "Besoin = la douleur (“les ventes baissent”, “les apprenants abandonnent”). Objectif = le résultat attendu (“augmenter la complétion”, “réduire les retards”). KPI = la mesure (“taux de complétion”, “% de retards”).",
          "Chaîne saine : Besoin → Objectif → KPI → Action → Suivi.",
          "Mesure sans objectif = reporting décoratif. Objectif sans mesure = slogan. Donc : fixer une définition KPI (formule + source + fréquence + limites) dès le départ.",
          "Exemple KORYXA School : “Je veux un dashboard” doit devenir un choix d’objectif (complétion module 1, abandon thème 2, réussite mini-projet…), car chaque objectif implique des KPI et analyses différents.",
        ],
      },
    ],
  },
  {
    title: "La question qui révèle tout : la décision",
    sections: [
      {
        heading: "Lecture (Page 3)",
        body: [
          "La question centrale : “Quelle décision va changer si on a la réponse ?” Si la réponse est “aucune”, l’analyse est inutile ou juste du reporting.",
          "Décision ≠ KPI. Un KPI dit “où tu en es”. Une décision dit “ce que tu fais”. Une vraie décision suppose des options A/B/C, sinon c’est une plainte.",
          "Exemple KORYXA School : de “dashboard” à “décider quelles leçons du module 1 simplifier/enrichir pour augmenter la complétion”.",
          "Validation rapide : une phrase claire envoyée au sponsor (“objectif = aider à décider X sur Y d’ici Z, en mesurant A, et en testant B”).",
        ],
      },
    ],
  },
  {
    title: "SMART : utile, mais pas magique",
    sections: [
      {
        heading: "Lecture (Page 4)",
        body: [
          "SMART sert à éviter les objectifs slogans (“améliorer la performance”). Un objectif solide contient : action, KPI, baseline, cible, délai, périmètre, responsable, et un garde-fou.",
          "Le garde-fou est crucial : “augmenter la complétion… sans augmenter les tickets support de plus de 10%”, ou “réduire les retards… sans augmenter le coût carburant de plus de 5%”.",
          "Objectif SMART vendable : “Augmenter/Réduire [KPI] de [baseline] à [cible] d’ici [délai], sur [périmètre], sans dégrader [garde-fou]”.",
        ],
      },
    ],
  },
  {
    title: "Méthode robuste en 6 étapes",
    sections: [
      {
        heading: "Lecture (Page 5)",
        body: [
          "Étape 1 — Scope : préciser sur quoi, sur qui, où, quand (sinon tu analyses le monde).",
          "Étape 2 — Objectif en 1 phrase (template).",
          "Étape 3 — Baseline obligatoire : mesurer l’état actuel sur une période cohérente.",
          "Étape 4 — Fixer une cible réaliste : historique + leviers + ressources + délai.",
          "Étape 5 — Contrainte qualité (anti-triche).",
          "Étape 6 — Définir 3–6 questions d’analyse testables : descriptive, diagnostic, segmentation, parcours, leviers.",
        ],
      },
    ],
  },
  {
    title: "Exemple complet 1 : KORYXA School (formation)",
    sections: [
      {
        heading: "Lecture (Page 6)",
        body: [
          "Besoin : “Les apprenants abandonnent le Module 1.” Décision : décider quelles leçons simplifier/enrichir pour augmenter la complétion sans surcharger support/mentors.",
          "Périmètre : nouveaux inscrits, Togo + Bénin, baseline 8 semaines, suivi 8 semaines. Baseline : completion_rate_m1 (ex. 35%).",
          "Objectif SMART : “Augmenter la complétion de 35% à 50% d’ici 8 semaines… sans +10% tickets support”.",
          "Questions : où décrochent-ils (thème/étape) ? notebook <48h aide-t-il ? quels canaux amènent les meilleurs apprenants ? variation par pays/appareil/langue ? temps médian jusqu’au mini-projet ?",
        ],
      },
    ],
  },
  {
    title: "Exemple complet 2 : Business local (vente & livraison)",
    sections: [
      {
        heading: "Lecture (Page 7)",
        body: [
          "Besoin : “On a trop de retards de livraison.” Décision : prioriser les actions opérationnelles (tournées, zones, préparation, charge) pour réduire les retards sans dépasser +5% coût carburant.",
          "Périmètre : livraisons intra-ville, baseline 6 semaines, objectif 6 semaines, définition du “retard” fixée. Baseline : % retards (ex. 22%).",
          "Objectif SMART : “Réduire les retards de 22% à 12% en 6 semaines… sans +5% carburant”.",
        ],
      },
    ],
  },
  {
    title: "Attention : objectifs et KPI peuvent être manipulés",
    sections: [
      {
        heading: "Lecture (Page 8)",
        body: [
          "Un KPI peut être amélioré sans améliorer la réalité (Goodhart). Exemple : fermer des tickets sans résoudre, promettre plus tard pour réduire “retard”, rendre la validation trop facile.",
          "Solution : KPI principal + KPI garde-fou + KPI de cohérence + définitions verrouillées + segmentation + suivi avant/après.",
        ],
      },
    ],
  },
  {
    title: "Exercices + Notebook obligatoire",
    sections: [
      {
        heading: "Lecture (Page 9)",
        body: [
          "Exercice A : écrire 2 objectifs SMART complets (KORYXA School + un business).",
          "Exercice B : notebook obligatoire : calcul baseline + export JSON (objectifs_smart.json) avec périmètre, baseline, cible, délai, garde-fou, questions, hypothèses.",
        ],
      },
    ],
  },
  {
    title: "Checklist + mini-projet à soumettre",
    sections: [
      {
        heading: "Lecture (Page 10)",
        body: [
          "Livrables : 2 objectifs SMART, notebook (baseline + définitions KPI + segmentation), export objectifs_smart.json.",
          "Checklist : objectif complet, garde-fou, 5 questions, 2 hypothèses, baseline calculé, JSON exporté, décision claire.",
        ],
      },
    ],
  },
];


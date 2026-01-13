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
  { title: "Méthode SMART : définir des objectifs clairs", youtubeId: "sD_dyR76KNM", lang: "fr" },
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
        heading: "Pourquoi ce thème est central",
        body: [
          "Un projet de Data Analysis ne se casse pas toujours sur un problème de “mauvaises données”. Bien sûr, des données incomplètes, mal saisies, ou non fiables peuvent ralentir ou limiter une analyse. Mais, dans la pratique, ce n’est pas la première cause d’échec.",
          "La cause la plus fréquente est plus simple : l’objectif est flou, donc l’analyse n’a pas de direction, pas de fin, et surtout pas d’impact. Le projet devient une suite de graphiques, de KPI, de tableaux… qui ne change rien sur le terrain.",
          "Ce thème est central parce qu’il met une structure là où beaucoup d’équipes fonctionnent à l’instinct. Quand une organisation dit “on veut un dashboard”, “on veut analyser les ventes”, “on veut comprendre l’abandon”, elle exprime souvent une inquiétude ou une ambition, mais pas un objectif opérationnel.",
        ],
      },
      {
        heading: "Ce que tu vas apprendre",
        body: [
          "Transformer une demande vague en objectifs clairs + questions d’analyse testables.",
          "En pratique : distinguer la douleur (besoin) du résultat attendu (objectif), relier l’objectif à une décision réelle, écrire un objectif précis et mesurable dans un périmètre clair avec un délai, ajouter un garde-fou qualité (anti-triche), puis traduire l’objectif en 3 à 6 questions d’analyse testables.",
          "Exemple : “On a trop de retards de livraison” → “Réduire le % de livraisons en retard de 22% à 12% en 6 semaines, sur les livraisons intra-ville, sans augmenter les coûts carburant de plus de 5%.”",
        ],
      },
      {
        heading: "Pourquoi un objectif flou tue l’impact",
        body: [
          "Problème A — Tout devient prioritaire : sans but clair, l’équipe demande “un peu de tout”, tu produis beaucoup sans savoir ce qui compte, et le projet perd sa valeur.",
          "Problème B — Les KPI deviennent un jeu : on regarde des chiffres, mais aucune action n’est attachée. Le reporting tourne en boucle.",
          "Problème C — Personne n’est responsable : si l’objectif n’a pas de propriétaire (qui assume l’action) et pas de délai, alors le projet devient une discussion permanente.",
          "À retenir : Un KPI sans objectif, c’est du décor. Un objectif sans KPI, c’est un slogan. Un objectif sans délai, c’est une intention. Un objectif sans responsable, c’est une rumeur.",
        ],
      },
      {
        heading: "Résultat attendu à la fin du thème",
        body: [
          "Un objectif SMART complet (baseline + cible + délai + périmètre) + un garde-fou qualité, 3 à 6 questions d’analyse testables, 2 hypothèses testables, et un plan simple de calcul du baseline dans un notebook.",
        ],
      },
    ],
  },
  {
    title: "Besoin, objectif, KPI : ne pas confondre (sinon tu fais du reporting décoratif)",
    sections: [
      {
        heading: "Besoin",
        body: [
          "Le besoin décrit une douleur. Exemples : “Les ventes baissent.” “Les apprenants abandonnent.” “On a trop de retards de livraison.”",
          "Erreur classique : croire que le besoin est déjà un objectif. Non : le besoin est une alarme, pas une direction.",
        ],
      },
      {
        heading: "Objectif",
        body: [
          "L’objectif décrit le résultat attendu. Exemples : “Augmenter la complétion du Module 1.” “Réduire les retards de livraison.” “Augmenter la conversion au paiement.”",
          "Erreur classique : un objectif slogan (“améliorer l’expérience”). Sans mesure, délai, périmètre, tu ne pilotes rien.",
        ],
      },
      {
        heading: "KPI",
        body: [
          "Le KPI est la mesure chiffrée qui te permet de suivre le progrès vers un objectif.",
          "Erreur classique : choisir un KPI sans objectif → reporting décoratif (des chiffres sans action).",
        ],
      },
      {
        heading: "La chaîne logique",
        body: [
          "Besoin (douleur) → Objectif (résultat attendu) → KPI (mesure) → Action (levier) → Suivi (impact).",
          "Sans cette chaîne, tu mesures beaucoup… mais tu n’améliores rien.",
        ],
      },
    ],
  },
  {
    title: "La question qui révèle tout : la décision (sinon l’analyse est inutile)",
    sections: [
      {
        heading: "La question centrale",
        body: [
          "“Quelle décision va changer si on a la réponse ?”",
          "Cette question élimine les analyses curiosité (“juste pour voir”), décoratives (“pour le reporting”), et celles qui ne débouchent sur aucune action.",
        ],
      },
      {
        heading: "Décision ≠ KPI",
        body: [
          "Un KPI dit “où tu en es”. Une décision dit “ce que tu fais”.",
          "Exemples : simplifier une leçon, renforcer un canal, changer un horaire, réorganiser des tournées, recruter des mentors, supprimer une étape inutile.",
        ],
      },
      {
        heading: "Validation rapide",
        body: [
          "Tu reformules la décision en 1 phrase et tu fais valider : “L’objectif est d’aider à décider X, sur Y, d’ici Z, en mesurant A, et en testant B.”",
        ],
      },
    ],
  },
  {
    title: "SMART : utile, mais pas magique (comment l’utiliser sans tomber dans la théorie)",
    sections: [
      {
        heading: "Pourquoi SMART existe",
        body: [
          "SMART évite les objectifs slogans (“améliorer la performance”, “optimiser l’expérience”).",
          "Ce qui compte n’est pas de réciter les lettres : c’est de construire un objectif qui guide réellement l’analyse et l’action.",
        ],
      },
      {
        heading: "Version pratique",
        body: [
          "Un objectif solide contient : action, KPI, baseline, cible, délai, périmètre, responsable, et idéalement un garde-fou qualité.",
          "Le garde-fou empêche d’améliorer un KPI en cassant autre chose (ex : complétion ↑ mais tickets support explosent).",
        ],
      },
      {
        heading: "Phrase SMART vendable",
        body: [
          "“Augmenter / Réduire [KPI] de [baseline] à [cible] d’ici [délai], sur [périmètre], sans dégrader [garde-fou].”",
        ],
      },
    ],
  },
  {
    title: "Méthode robuste en 6 étapes : de la demande vague à des questions testables",
    sections: [
      {
        heading: "Étapes 1 → 3 : scope, objectif, baseline",
        body: [
          "Étape 1 — Définir le périmètre (scope) : sur quoi, sur qui, où, quand, et éventuellement canal/segment.",
          "Étape 2 — Écrire l’objectif (template) : “Augmenter/Réduire [mesure] de [baseline] à [cible] d’ici [délai], sur [périmètre], en agissant sur [leviers]”.",
          "Étape 3 — Mesurer le baseline (obligatoire) : le baseline est le point de départ. Sans baseline, la cible devient une invention.",
        ],
      },
      {
        heading: "Étapes 4 → 6 : cible, garde-fou, questions testables",
        body: [
          "Étape 4 — Fixer la cible : assez ambitieuse pour changer quelque chose, mais réaliste selon les leviers disponibles et le délai.",
          "Étape 5 — Ajouter une contrainte qualité (anti-triche).",
          "Étape 6 — Définir 3 à 6 questions d’analyse testables (descriptive, diagnostic, segmentation, parcours, leviers).",
        ],
      },
    ],
  },
  {
    title: "Exemple complet 1 : KORYXA School (objectif SMART “vendable”)",
    sections: [
      {
        heading: "Besoin → décision → périmètre",
        body: [
          "Besoin : “Les apprenants abandonnent le Module 1.”",
          "Décision : “Décider quelles leçons du Module 1 doivent être simplifiées, enrichies, ou restructurées pour augmenter la complétion, sans augmenter la charge du support/mentors.”",
          "Périmètre (exemple) : nouveaux inscrits au Module 1, Togo + Bénin, baseline 8 semaines + suivi 8 semaines.",
        ],
      },
      {
        heading: "Baseline + objectif SMART",
        body: [
          "Exemple baseline : Completion_Rate_M1 = 35%.",
          "Objectif SMART : “Augmenter le taux de complétion du Module 1 de 35% à 50% d’ici 8 semaines, sur les nouveaux inscrits (Togo + Bénin), sans augmenter de plus de 10% le volume de tickets support.”",
        ],
      },
      {
        heading: "Questions d’analyse (orientées action)",
        body: [
          "À quel thème les apprenants décrochent-ils le plus ?",
          "À quelle étape précise la chute est-elle maximale ?",
          "Notebook dans les 48h : est-ce un levier réel ?",
          "Quels canaux amènent les apprenants qui complètent le plus ?",
          "Variations par pays / appareil / langue vidéo (FR vs EN).",
          "Temps médian entre inscription et soumission mini-projet.",
        ],
      },
    ],
  },
  {
    title: "Exemple complet 2 : Business local (vente & livraison)",
    sections: [
      {
        heading: "Objectif SMART (retards + garde-fou)",
        body: [
          "Baseline (exemple) : 22% de retards sur livraisons intra-ville.",
          "Objectif SMART : “Réduire le % de livraisons en retard de 22% à 12% en 6 semaines, sur les livraisons intra-ville, sans augmenter les coûts carburant de plus de 5%.”",
        ],
      },
      {
        heading: "Questions d’analyse (orientées action)",
        body: [
          "Quelles zones ont le plus de retards ?",
          "Quels jours/heures concentrent les retards ?",
          "Lien surcharge → retard ?",
          "Retards stock (préparation) vs route (transport) ?",
        ],
      },
    ],
  },
  {
    title: "Objectifs et KPI peuvent être “manipulés” (et comment éviter ça)",
    sections: [
      {
        heading: "Le danger",
        body: [
          "Dès qu’une mesure devient une cible, tu risques un effet pervers : améliorer le chiffre sans améliorer la réalité.",
          "Solution : KPI principal + KPI garde-fou + KPI de cohérence (optionnel), définitions stables, segmentation, et suivi avant/après propre.",
        ],
      },
    ],
  },
  {
    title: "Exercices + Notebook obligatoire + validation",
    sections: [
      {
        heading: "Exercices (avant le quiz)",
        body: [
          "Écris 2 objectifs SMART complets : un pour KORYXA School, un pour un business réel. Pour chacun : besoin, périmètre, baseline (ou “à mesurer”), cible, délai, garde-fou, 5 questions d’analyse, 2 hypothèses testables.",
        ],
      },
      {
        heading: "Notebook (obligatoire)",
        body: [
          "Calculer un baseline sur un dataset, documenter les définitions KPI, finaliser l’objectif SMART, écrire questions + hypothèses, puis exporter un fichier `objectifs_smart.json`.",
        ],
      },
      {
        heading: "Mini-projet à soumettre",
        body: [
          "Titre : Objectifs SMART + questions d’analyse (cas formation + cas business).",
          "Rendu : README (objectifs finalisés) + notebook.ipynb + objectifs_smart.json. Bonus : risques + mitigation (5 risques, 1 action chacun).",
        ],
      },
    ],
  },
];


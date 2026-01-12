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
  title: "Theme 2 — Objectifs SMART & questions d’analyse",
  module: "Module 1 — Cadrage & KPIs",
  readingTime: "45–60 min",
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
        heading: "Pourquoi les projets échouent (souvent) avant les données",
        body: [
          "Un projet de Data Analysis ne se casse pas toujours sur un problème de “mauvaises données”. Bien sûr, des données incomplètes, mal saisies, ou non fiables peuvent ralentir ou limiter une analyse.",
          "Mais, dans la pratique, ce n’est pas la première cause d’échec. La cause la plus fréquente est plus simple : l’objectif est flou, donc l’analyse n’a pas de direction, pas de fin, et surtout pas d’impact.",
          "Le projet devient une suite de graphiques, de KPI, de tableaux… qui ne change rien sur le terrain.",
        ],
      },
      {
        heading: "1) Ce que tu vas apprendre ici",
        body: [
          "Le but de ce thème est simple et puissant : transformer une demande vague en objectifs clairs + questions d’analyse testables.",
          "En termes très concrets, tu vas apprendre à :",
          "• distinguer la douleur (besoin) du résultat attendu (objectif),",
          "• relier l’objectif à une décision réelle (sinon l’analyse est décorative),",
          "• écrire un objectif précis, mesurable, dans un périmètre clair, avec un délai,",
          "• ajouter un garde-fou qualité (anti-triche),",
          "• traduire l’objectif en 3 à 6 questions d’analyse testables.",
          "Exemple : “On a trop de retards de livraison” → “Réduire le % de livraisons en retard de 22% à 12% en 6 semaines, sur les livraisons intra-ville, sans augmenter les coûts carburant de plus de 5%.”",
        ],
      },
      {
        heading: "2) Pourquoi un objectif flou tue l’impact",
        body: [
          "Un objectif flou produit presque toujours trois problèmes :",
          "Problème A — Tout devient prioritaire : sans but clair, tu produis beaucoup sans savoir ce qui compte.",
          "Problème B — Les KPI deviennent un jeu : on observe des chiffres sans action attachée.",
          "Problème C — Personne n’est responsable : sans owner et sans délai, on commente mais on n’agit pas.",
          "À retenir :",
          "• Un KPI sans objectif, c’est du décor.",
          "• Un objectif sans KPI, c’est un slogan.",
          "• Un objectif sans délai, c’est une intention.",
          "• Un objectif sans responsable, c’est une rumeur.",
        ],
      },
      {
        heading: "3) L’objectif doit être relié à une décision",
        body: [
          "Une analyse est utile seulement si elle change une décision.",
          "Avant même d’écrire un objectif, pose la question : “Quelle décision va changer si on a la réponse ?”",
          "Si la réponse est “aucune”, alors l’objectif est mal posé, ou la demande est du monitoring/reporting (ce qui peut être utile, mais doit être assumé).",
          "Exemple KORYXA School : “Je veux un dashboard” cache souvent une vraie décision (leçons à améliorer, exercices à simplifier, canal d’acquisition à prioriser…).",
        ],
      },
      {
        heading: "4) Objectif clair = périmètre clair",
        body: [
          "Un objectif utile a un périmètre. Sans périmètre, tu analyses “le monde” et tu sors des conclusions vagues.",
          "Le périmètre répond à : Sur quoi ? Sur qui ? Où ? Quand ?",
          "Exemples : “Nouveaux inscrits au Module 1, Togo et Bénin, sur 8 semaines.” ; “Livraisons intra-ville uniquement, sur les 6 dernières semaines.”",
          "Un bon périmètre protège le projet et évite les débats interminables.",
        ],
      },
      {
        heading: "5) Ce thème transforme ton rôle d’analyste",
        body: [
          "Tu passes de “la personne qui fait des graphiques” à quelqu’un qui clarifie le problème, structure l’objectif, impose une logique mesurable, et guide vers des décisions.",
          "C’est ce qui change la confiance qu’on accorde à ton travail.",
        ],
      },
      {
        heading: "6) Résultat attendu à la fin de ce thème",
        body: [
          "À la fin, tu dois pouvoir produire :",
          "• un objectif SMART complet (baseline + cible + délai + périmètre),",
          "• une contrainte qualité (garde-fou),",
          "• 3 à 6 questions d’analyse (testables),",
          "• 2 hypothèses testables,",
          "• un plan simple de calcul du baseline dans un notebook.",
        ],
      },
    ],
  },
  {
    title: "Besoin, objectif, KPI : ne pas confondre",
    sections: [
      {
        heading: "1) Le besoin : la douleur",
        body: [
          "Le besoin décrit un problème ressenti (souvent formulé comme une alarme). Exemples : “Les ventes baissent.” “Les apprenants abandonnent.” “On a trop de retards de livraison.”",
          "Un besoin ne dit pas encore ce qu’il faut mesurer ni quoi faire. Il dit : “il y a un feu quelque part”.",
        ],
      },
      {
        heading: "2) L’objectif : le résultat attendu",
        body: [
          "L’objectif décrit ce qu’on veut atteindre, orienté “résultat”. Exemples : “Augmenter la complétion du Module 1.” “Réduire les retards de livraison.”",
          "Un objectif peut rester vague s’il n’est pas mesurable, sans délai, sans périmètre.",
        ],
      },
      {
        heading: "3) Le KPI : la mesure",
        body: [
          "Un KPI est une mesure chiffrée qui permet d’observer le progrès : taux, volume, durée, fréquence, score.",
          "Erreur classique : choisir un KPI sans objectif → reporting décoratif.",
        ],
      },
      {
        heading: "4) La chaîne logique (saine)",
        body: [
          "Besoin (douleur) → Objectif (résultat attendu) → KPI (mesure) → Action (levier) → Suivi (impact).",
          "Exemple formation : Besoin “abandon” → Objectif “augmenter complétion” → KPI “taux de complétion” + garde-fou “tickets support” → actions (exemples guidés, clarifier projet…) → suivi avant/après sur 8 semaines.",
        ],
      },
      {
        heading: "5) Mesure sans objectif = piège",
        body: [
          "Signes : “On veut juste voir les chiffres.” “On veut un dashboard complet.” “On verra après ce qu’on décide.”",
          "Réaction pro : ramener au concret : “Quel KPI vous inquiète le plus ? Quelle décision ce mois-ci ? Si le KPI bouge, que faites-vous ?”.",
        ],
      },
      {
        heading: "6) Objectif sans mesure = slogan",
        body: [
          "Exemple : “Réduire l’abandon” sans définir “abandon” produit des interprétations différentes. Tu dois fixer la définition.",
        ],
      },
      {
        heading: "7) Dictionnaire KPI (même simple)",
        body: [
          "Pour chaque KPI : définition, formule, source, fréquence, limites. Exemple : “Taux de complétion = #terminés / #ayant commencé”.",
        ],
      },
      {
        heading: "8) Exemple KORYXA School : dashboard vs objectif",
        body: [
          "Demande : “Je veux un dashboard.” → tu proposes 3 objectifs possibles (et tu fais choisir) : augmenter complétion, réduire abandon au thème 2, augmenter réussite mini-projet.",
          "Chaque objectif implique des KPI et des décisions différents. Conclusion : avant d’ouvrir Power BI, tu dois savoir quel objectif pilote le projet.",
        ],
      },
    ],
  },
  {
    title: "La question qui révèle tout : la décision",
    sections: [
      {
        heading: "1) La question centrale (toujours)",
        body: [
          "“Quelle décision va changer si on a la réponse ?”",
          "Cette question élimine les analyses curiosité, décoratives, ou sans action.",
          "Elle force à clarifier : qui décide, quoi décider, quand décider, et quelles actions sont possibles.",
        ],
      },
      {
        heading: "2) Décision ≠ KPI",
        body: [
          "Un KPI dit “où tu en es”. Une décision dit “ce que tu fais”.",
          "Décisions : simplifier une leçon, renforcer un canal, changer un horaire, réorganiser des tournées, recruter des mentors, supprimer une étape inutile…",
        ],
      },
      {
        heading: "3) Faire apparaître la décision quand la demande est floue",
        body: [
          "Souvent, on exprime un format (“dashboard”, “rapport”). Ton rôle : creuser.",
          "Questions : “Qu’est-ce qui vous inquiète le plus ? Quel résultat voulez-vous améliorer ? Quelles actions sont possibles si on découvre X ? Quelle deadline ?”",
          "Puis reformuler en décision et faire valider.",
        ],
      },
      {
        heading: "4) Exemple KORYXA School : de “dashboard” à décision",
        body: [
          "Demande : “Je veux un dashboard.” → en creusant : abandon au module 1, surtout thème 2, et besoin de savoir quoi modifier.",
          "Décision révélée : “Décider quelles leçons raccourcir/enrichir/restructurer pour augmenter la complétion du Module 1.”",
        ],
      },
      {
        heading: "5) Exemple business : de “ventes baissent” à décision",
        body: [
          "“Ventes baissent” peut cacher plusieurs décisions : quel produit pousser, ajuster les prix, renforcer quel canal, stock vs demande…",
          "Si tu ne clarifies pas, tu pars dans tous les sens.",
        ],
      },
      {
        heading: "6) Une décision doit avoir des options",
        body: [
          "Une vraie décision suppose au moins deux options (A/B/C).",
          "Si aucune action n’est possible, l’analyse devient un constat : il faut être lucide sur les limites.",
        ],
      },
      {
        heading: "7) Décision → questions d’analyse",
        body: [
          "Une fois la décision claire, tu écris des questions qui la servent : où ça chute, qui décroche, signaux avant abandon, variations qui améliorent…",
        ],
      },
      {
        heading: "8) Validation rapide",
        body: [
          "Fais valider une phrase claire : “L’objectif est d’aider à décider X, sur Y, d’ici Z, en mesurant A, et en testant B.”",
        ],
      },
    ],
  },
  {
    title: "SMART : utile, mais pas magique",
    sections: [
      {
        heading: "1) Pourquoi SMART existe",
        body: [
          "SMART évite les objectifs slogans (“améliorer la performance”, “optimiser l’expérience”).",
          "Il force l’objectif à devenir opérationnel : combien, pour qui, quand, avec quelle mesure et responsabilité.",
        ],
      },
      {
        heading: "2) Version pratique",
        body: [
          "Un objectif solide contient : action, KPI, baseline, cible, délai, périmètre, responsable, et idéalement un garde-fou qualité.",
        ],
      },
      {
        heading: "3) S : spécifique",
        body: [
          "Spécifique sur quoi : module, cohorte, période, définition. Le spécifique vient du périmètre.",
        ],
      },
      {
        heading: "4) M : mesurable",
        body: [
          "Choisir un KPI qui reflète réellement l’objectif. Souvent 1 KPI principal + 1–2 complémentaires (explication / garde-fou).",
        ],
      },
      {
        heading: "5) A : atteignable (leviers)",
        body: [
          "Atteignable si tu as des leviers. Exemples formation : exemples, découpage page, clarifier mini-projet, vidéo, feedback…",
        ],
      },
      {
        heading: "6) R : pertinent (décision réelle)",
        body: [
          "Pertinent si relié à une décision importante et à une douleur réelle, aligné avec les priorités du moment.",
        ],
      },
      {
        heading: "7) T : temporel",
        body: [
          "Le délai donne la fin et le rythme : période d’analyse, période de suivi, profondeur, fréquence de reporting.",
        ],
      },
      {
        heading: "8) Le garde-fou",
        body: [
          "Évite d’améliorer artificiellement un KPI en cassant autre chose (tickets support, coûts, satisfaction…).",
        ],
      },
      {
        heading: "9) Phrase vendable",
        body: [
          "“Augmenter [KPI] de [baseline] à [cible] d’ici [délai], sur [périmètre], sans dégrader [garde-fou].”",
        ],
      },
    ],
  },
  {
    title: "Méthode robuste en 6 étapes : de la demande vague à des questions testables",
    sections: [
      {
        heading: "Étape 1 — Définir le périmètre (scope)",
        body: [
          "Préciser : sur quoi, sur qui, où, quand, et éventuellement canal/segment.",
          "Règle : si tu n’arrives pas à écrire le périmètre en une phrase, c’est trop large.",
        ],
      },
      {
        heading: "Étape 2 — Objectif en 1 phrase (template)",
        body: [
          "Template : “Augmenter/Réduire [mesure] de [baseline] à [cible] d’ici [délai], sur [périmètre], en agissant sur [leviers].”",
          "Même si la baseline est inconnue, tu écris la phrase avec “à mesurer”.",
        ],
      },
      {
        heading: "Étape 3 — Mesurer le baseline (obligatoire)",
        body: [
          "Le baseline est le point de départ. Sans baseline, la cible devient une invention.",
          "Prévoir données, période de référence, et définition exacte (ex : “retard” = après date promise).",
        ],
      },
      {
        heading: "Étape 4 — Fixer la cible",
        body: [
          "Choisir une cible ambitieuse mais réaliste selon leviers, ressources, délai, variation historique.",
        ],
      },
      {
        heading: "Étape 5 — Contrainte qualité (anti-triche)",
        body: [
          "Exemples : “sans augmenter les tickets support > 10%”, “sans augmenter coûts carburant > 5%”, “sans dégrader satisfaction”.",
        ],
      },
      {
        heading: "Étape 6 — 3 à 6 questions d’analyse (testables)",
        body: [
          "Structurer : Descriptive (où en est-on), Diagnostic (pourquoi), Segmentation (qui), Parcours (où ça bloque), Leviers (qu’est-ce qui change si on fait X).",
          "Résultat final : périmètre + baseline + objectif vendable + garde-fou + questions + hypothèses.",
        ],
      },
    ],
  },
];


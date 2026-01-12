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
  {
    title: "Exemple complet 1 : KORYXA School (cas formation vendue)",
    sections: [
      {
        heading: "1) Contexte (ce qui se passe)",
        body: [
          "KORYXA School vend une formation structurée en modules et thèmes. Une partie importante des apprenants commence le Module 1, mais n’arrive pas au bout.",
          "Le symptôme visible est : “les apprenants abandonnent”. Mais cette phrase ne suffit pas pour agir. L’équipe doit répondre à des questions concrètes :",
          "• Où exactement ils abandonnent ?",
          "• Pourquoi ils abandonnent ?",
          "• Qu’est-ce qu’on peut changer sans casser la qualité ?",
          "• Qu’est-ce qu’on peut changer sans surcharger les mentors ?",
          "• Comment vérifier que ça marche ?",
        ],
      },
      {
        heading: "2) Besoin (la douleur)",
        body: [
          "“Les apprenants abandonnent le Module 1.”",
          "Le besoin exprime une inquiétude et une perte :",
          "• perte de revenus (moins de renouvellement, moins de recommandation),",
          "• perte d’impact (moins de personnes formées),",
          "• perte d’image (formation jugée trop dure ou mal expliquée),",
          "• surcharge support (questions répétitives, tickets),",
          "• difficulté à vendre la suite (si Module 1 déçoit, personne n’achète Module 2).",
        ],
      },
      {
        heading: "3) Décision à changer (la question qui révèle tout)",
        body: [
          "Avant de parler d’objectif, il faut clarifier la décision : “Qu’est-ce qu’on va décider si on a l’analyse ?”",
          "Décision réaliste dans ce cas :",
          "“Décider quelles leçons du Module 1 doivent être simplifiées, enrichies, ou restructurées pour augmenter la complétion, sans augmenter la charge du support/mentors.”",
          "Cette décision impose une logique : on ne cherche pas juste “où ça baisse”, on cherche “quoi changer” dans le contenu, le parcours et les supports.",
        ],
      },
      {
        heading: "4) Périmètre (scope) : indispensable",
        body: [
          "Le périmètre évite la confusion.",
          "Exemple de périmètre :",
          "• Population : nouveaux inscrits au Module 1",
          "• Zone : Togo + Bénin",
          "• Période : cohorte des 8 dernières semaines (baseline) + 8 prochaines semaines (suivi)",
          "• Format : parcours standard (même plan de cours)",
          "• Contrainte : pas de changement majeur d’offre en plein test (sinon l’impact est mélangé)",
          "Pourquoi c’est important ? Parce que “tous les apprenants depuis 2 ans” mélange des versions de cours, des périodes marketing différentes, des changements de plateforme, etc. Tu perds la clarté.",
        ],
      },
      {
        heading: "5) Baseline (obligatoire) : mesurer l’état actuel",
        body: [
          "Tu dois figer un chiffre de départ. Ici, le baseline principal est la complétion du Module 1.",
          "Définition simple (à adapter selon votre logique interne) : “Compléter le Module 1” = atteindre la dernière étape définie (dernière page / dernier quiz / mini-projet soumis / validation finale).",
          "Exemple baseline (à calculer via notebook) : Completion_Rate_M1 = 0,35 (35%).",
          "Baselines secondaires utiles : taux de complétion par thème, point de chute le plus fréquent, temps médian entre inscription et dernière action, taux de soumission mini-projet.",
          "Le baseline doit être calculé sur une période cohérente (ex. 8 semaines) pour éviter un chiffre trompeur.",
        ],
      },
      {
        heading: "6) Objectif SMART (version vendable)",
        body: [
          "Objectif SMART complet (avec garde-fou) :",
          "“Augmenter le taux de complétion du Module 1 de 35% à 50% d’ici 8 semaines, sur les nouveaux inscrits (Togo + Bénin), sans augmenter de plus de 10% le volume de tickets support.”",
          "Pourquoi cet objectif fonctionne : il est mesurable, a un point de départ, une cible, un délai, un périmètre, et une contrainte qualité.",
          "Second garde-fou possible : “sans faire baisser le taux de réussite au mini-projet” ou “sans diminuer le score moyen aux évaluations”.",
        ],
      },
      {
        heading: "7) Questions d’analyse (3 à 6, testables, orientées action)",
        body: [
          "Les questions doivent servir la décision “quoi changer”. Exemples recommandés :",
          "• À quel thème les apprenants décrochent-ils le plus ?",
          "• À quelle étape précise (page, exercice, notebook, mini-projet) la chute est-elle maximale ?",
          "• Exécuter le notebook dans les 48h après inscription augmente-t-il la probabilité de compléter ?",
          "• Quels canaux d’acquisition amènent les apprenants qui complètent le plus ?",
          "• La complétion varie-t-elle selon pays / appareil / langue de la vidéo (FR vs EN) ?",
          "• Quel est le temps médian entre inscription et soumission mini-projet ?",
          "Ces questions couvrent : descriptive (où), parcours (à quelle étape), segmentation (qui), leviers (qu’est-ce qui change si X).",
        ],
      },
      {
        heading: "8) Hypothèses testables (2 exemples solides)",
        body: [
          "H1 : “Les apprenants qui exécutent le notebook dans les 48h ont un taux de complétion plus élevé.”",
          "Mesure : comparer complétion entre “notebook_48h = oui” et “non”, en contrôlant si possible par cohorte/pays.",
          "H2 : “Le point de chute principal est lié au manque d’exemples concrets dans le Thème 2.”",
          "Mesure : repérer pages à forte sortie + signaux (temps long, retours, tickets), puis tester un correctif (exemple guidé) et mesurer avant/après.",
        ],
      },
      {
        heading: "9) Données minimales à collecter",
        body: [
          "Tu n’as pas besoin de 200 colonnes. Tu as besoin du minimum fiable :",
          "• user_id, cohort_id, country, device, acquisition_channel",
          "• module_id / theme_id / step_id, event_type, timestamp",
          "• notebook_executed + notebook_first_exec_time",
          "• support_ticket_count, project_submitted + project_submit_time",
          "Avec ça, tu peux calculer : complétion, points de chute, durées, segmentations, effets de leviers simples.",
        ],
      },
      {
        heading: "10) Plan d’action (ce que l’analyse doit permettre de décider)",
        body: [
          "Le livrable final n’est pas “des graphes”. Il doit proposer des actions priorisées, par exemple :",
          "• Découper une page trop dense du Thème 2 en 2 pages + ajouter un exemple guidé",
          "• Clarifier le mini-projet avec un template de rendu + exemple",
          "• Ajouter une mini-checklist “ce que tu dois retenir” à la fin de chaque sous-partie",
          "• Rendre le notebook plus guidé (exécution étape par étape)",
          "• Ajuster l’acquisition vers des canaux qui apportent des cohortes plus stables",
          "Puis mesurer : impact complétion, impact tickets support, et éventuellement réussite mini-projet.",
        ],
      },
      {
        heading: "11) Résumé de l’exemple",
        body: [
          "Besoin : abandon · Décision : quoi changer dans le contenu/parcours · Baseline : 35%",
          "Objectif SMART : 35% → 50% en 8 semaines, garde-fou tickets +10% max",
          "Questions : 6 · Hypothèses : 2 · Données : événements + segments + support",
          "Résultat attendu : plan d’action priorisé + suivi avant/après.",
        ],
      },
    ],
  },
  {
    title: "Exemple complet 2 : Business local (vente & livraison)",
    sections: [
      {
        heading: "1) Contexte",
        body: [
          "Un business vend des produits et livre en ville. Les clients se plaignent des retards. Les retards entraînent : baisse de satisfaction, annulations, baisse de réachat, stress opérationnel, réputation négative.",
          "L’équipe dit : “On a trop de retards.” Pour agir, il faut répondre : où les retards se concentrent-ils ? stock vs trajet ? livreurs ? jours/heures ? actions efficaces sans exploser les coûts ?",
        ],
      },
      {
        heading: "2) Besoin",
        body: ["“On a trop de retards de livraison.”"],
      },
      {
        heading: "3) Décision",
        body: [
          "Décision réaliste : “Décider quelles actions opérationnelles prioriser (tournées, zones, préparation, charge, horaires) pour réduire le % de retards intra-ville, sans dépasser une limite de coût carburant.”",
        ],
      },
      {
        heading: "4) Périmètre (scope)",
        body: [
          "Exemple : livraisons intra-ville uniquement, baseline sur 6 dernières semaines, objectif sur 6 semaines.",
          "Exclure les livraisons exceptionnelles. Définir “retard” explicitement (après l’heure promise / après le jour promis).",
        ],
      },
      {
        heading: "5) Baseline",
        body: [
          "Exemple : % retards = 22%. Mesurer aussi : retards par zone, par livreur, par tranche horaire, par volume/jour.",
        ],
      },
      {
        heading: "6) Objectif SMART",
        body: [
          "“Réduire le % de livraisons en retard de 22% à 12% en 6 semaines, sur les livraisons intra-ville, sans augmenter les coûts carburant de plus de 5%.”",
          "Garde-fou optionnel : sans augmenter les annulations ou sans réduire la productivité au-delà de X%.",
        ],
      },
      {
        heading: "7) Questions d’analyse (orientées action)",
        body: [
          "• Quelles zones ont le plus de retards ?",
          "• Quels jours/heures concentrent les retards ?",
          "• Quel livreur/transporteur est le plus associé aux retards (à volume comparable) ?",
          "• Lien charge (livraisons/jour) → retard ?",
          "• Stock (préparation) vs trajet (transport) : où se crée le retard ?",
          "• Quel type de commande est le plus associé aux retards ?",
        ],
      },
      {
        heading: "8) Hypothèses testables",
        body: [
          "H1 : “Les retards augmentent fortement au-delà de N livraisons/jour/livreur.”",
          "H2 : “Les retards sont concentrés sur 2 zones à cause du trafic et d’un mauvais découpage de tournée.”",
          "H3 : “Une part importante des retards vient de la préparation stock (commande prête trop tard).”",
        ],
      },
      {
        heading: "9) Données minimales",
        body: [
          "order_id, customer_zone, promised_time/date, dispatch_time, pickup_time, delivered_time, courier_id, distance (si possible), fuel_cost (ou proxy), charge/jour, type commande, annulation.",
          "Avec ces champs, tu calcules : retard, durées, segmentation zone/livreur/jour/heure, effet charge, estimation coût.",
        ],
      },
      {
        heading: "10) Sorties attendues (actionnables)",
        body: [
          "Plan en 3 niveaux : Quick wins (semaine 1–2), optimisation tournées (semaine 2–4), stabilisation (semaine 4–6).",
          "Mesurer : % retards (objectif), coût carburant (garde-fou), annulations/satisfaction (si dispo).",
        ],
      },
    ],
  },
  {
    title: "Attention : objectifs et KPI peuvent être “manipulés”",
    sections: [
      {
        heading: "1) Deux formes de manipulation (souvent involontaires)",
        body: [
          "A) Contournement : on améliore le chiffre en changeant la mesure, pas la réalité (tickets fermés vite, complétion “cliquable”, retards réduits en promettant plus tard…).",
          "B) Dégradation ailleurs : on améliore un KPI au prix d’un autre (retards ↓ mais coût carburant ↑, complétion ↑ mais compétence ↓, conversion ↑ mais marge ↓…).",
        ],
      },
      {
        heading: "2) Pourquoi ça arrive",
        body: [
          "Les équipes sont sous pression et cherchent le chemin le plus facile. Sans garde-fou, tu crées une route directe vers un résultat artificiel.",
        ],
      },
      {
        heading: "3) La solution : KPI principal + garde-fou + cohérence",
        body: [
          "KPI principal : ce que tu veux améliorer (complétion, % retards).",
          "KPI garde-fou : ce que tu refuses de dégrader (tickets support, coût carburant, satisfaction…).",
          "KPI de cohérence : confirme que l’amélioration est réelle (réussite mini-projet, annulations, productivité…).",
        ],
      },
      {
        heading: "4) Clarifier les définitions",
        body: [
          "Beaucoup de manipulations viennent de définitions floues. Fixe : définition, formule, source, période, exclusions.",
          "Exemple : “retard” par rapport à quoi ? “complétion” = dernier clic ou validation réelle ?",
        ],
      },
      {
        heading: "5) Ajouter des contraintes anti-triche dans l’objectif",
        body: [
          "Exemples : “sans réduire la réussite au mini-projet”, “sans augmenter coût carburant > 5%”, “sans réduire la marge sous X”, “sans augmenter le taux de réouverture tickets”.",
        ],
      },
      {
        heading: "6) Vérifier la cohérence par segmentation",
        body: [
          "Une amélioration globale peut cacher une dégradation locale. Vérifie : pays/zone, canal, appareil, cohorte, type commande.",
        ],
      },
      {
        heading: "7) Contrôle avant/après",
        body: [
          "Comparer proprement : même définition KPI, même périmètre, période comparable, attention aux événements exceptionnels. Suivre semaine par semaine aide à éviter les fausses victoires.",
        ],
      },
      {
        heading: "8) Résumé",
        body: [
          "Un KPI peut être amélioré sans améliorer la réalité. Solution : garde-fou + cohérence + définitions + segmentation + suivi avant/après.",
        ],
      },
    ],
  },
  {
    title: "Exercices + notebook obligatoire (structure complète)",
    sections: [
      {
        heading: "Exercice A — 2 objectifs SMART complets",
        body: [
          "Écrire 2 objectifs SMART : un pour KORYXA School et un pour un business réel.",
          "Pour chaque objectif : besoin, périmètre, baseline (ou “à mesurer”), cible, délai, garde-fou, 5 questions d’analyse, 2 hypothèses testables.",
        ],
      },
      {
        heading: "Exercice B — Notebook obligatoire (baseline + export JSON)",
        body: [
          "Objectif : calculer un baseline sur un dataset et générer un fichier JSON contenant tes objectifs SMART finalisés.",
          "Structure recommandée du notebook :",
          "1) Contexte + objectif",
          "2) Chargement des données",
          "3) Nettoyage minimal",
          "4) Définition des KPI (formules + fonctions)",
          "5) Baseline (KPI principal + garde-fou + secondaires)",
          "6) Analyse rapide (points de chute + segmentation + 1–2 visus)",
          "7) Finalisation objectif SMART (baseline réel + cible justifiée)",
          "8) Questions + hypothèses",
          "9) Export JSON (objectifs_smart.json)",
        ],
      },
      {
        heading: "Exemple de format JSON attendu",
        body: [
          "projet, periode_baseline, objectif, baseline, cible, delai, perimetre, garde_fou, questions[], hypotheses[].",
          "Le but est de structurer : même si ton dataset n’a pas tout, tu remplis ce qui est possible.",
        ],
      },
      {
        heading: "Critères de réussite",
        body: [
          "Objectifs lisibles en 1 phrase vendable, baselines calculés (ou “à mesurer”), questions testables, hypothèses mesurables, JSON généré proprement.",
        ],
      },
      {
        heading: "Erreurs à éviter",
        body: [
          "Objectif sans baseline, baseline sur période incohérente, questions trop vagues, hypothèse non mesurable, garde-fou oublié, périmètre absent.",
        ],
      },
    ],
  },
  {
    title: "Checklist + mini-projet à soumettre (validation du thème)",
    sections: [
      {
        heading: "1) Livrables obligatoires",
        body: [
          "A) 2 objectifs SMART complets (KORYXA School + business) avec baseline/cible/délai/périmètre/garde-fou/questions/hypothèses.",
          "B) Notebook : chargement dataset, nettoyage minimal, baselines, segmentation, finalisation objectif SMART, export JSON.",
          "C) Export : objectifs_smart.json (obligatoire). Optionnel : baseline_summary.csv.",
        ],
      },
      {
        heading: "2) Checklist de validation",
        body: [
          "• 2 objectifs SMART complets",
          "• garde-fou pour chaque objectif",
          "• 5 questions par objectif",
          "• 2 hypothèses par objectif",
          "• baseline calculé via notebook",
          "• définitions KPI dans notebook",
          "• export JSON propre",
          "• objectifs reliés à une décision claire",
          "• questions testables avec les données disponibles",
        ],
      },
      {
        heading: "3) Mini-projet à soumettre",
        body: [
          "Titre : Objectifs SMART + questions d’analyse (cas formation + cas business).",
          "Dossier de rendu : README.md (objectifs finalisés) + notebook.ipynb + objectifs_smart.json.",
          "Bonus : risques + mitigation (5 risques, 1 action chacun).",
        ],
      },
      {
        heading: "4) Barème (optionnel)",
        body: [
          "Objectifs SMART (30%), questions testables (20%), hypothèses mesurables (10%), notebook + baseline (30%), export JSON (10%).",
        ],
      },
      {
        heading: "5) Résultat final attendu",
        body: [
          "Après validation : tu sais refuser un objectif flou, imposer un périmètre, calculer baseline, fixer une cible réaliste, protéger l’objectif (garde-fou), écrire des questions orientées action, structurer un notebook propre, livrer une sortie réutilisable (JSON).",
        ],
      },
    ],
  },
];

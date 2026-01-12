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
    title: "Pourquoi ce thème est critique en Data Analysis",
    sections: [
      {
        heading: "Le besoin réel avant les données",
        body: [
          "La Data Analysis n’est pas un concours de graphiques, ni une course au “dashboard le plus joli”. Une analyse vaut uniquement par sa capacité à aider une organisation à prendre de meilleures décisions, plus vite, avec moins de risques, et avec un impact réel sur le terrain.",
          "C’est pour ça que ce thème est critique : il remet la Data Analysis à sa vraie place, au début du projet, avant les données, avant Excel, avant SQL, avant Python.",
          "Beaucoup de projets data échouent pour une raison simple : on commence par les données (ou par un outil) au lieu de commencer par le besoin réel. On télécharge un fichier, on crée des graphiques, on calcule des KPI, puis à la fin… personne ne change rien.",
          "Ce n’est pas un problème technique. C’est un problème de cadrage.",
        ],
      },
      {
        heading: "Les 3 clarifications d’un bon analyste",
        body: [
          "Un bon analyste ne se définit pas par sa capacité à manipuler un dataset, mais par sa capacité à clarifier trois choses :",
          "• Quelle décision on cherche à améliorer",
          "• Qui va utiliser le résultat (et qui peut bloquer le projet)",
          "• Comment on va mesurer que l’analyse a vraiment servi",
          "Ce thème te donne une compétence rare : transformer une demande floue (“fais-moi un reporting”) en un objectif clair (“on doit réduire le temps d’attente”, “on doit augmenter la conversion”, “on doit diminuer les abandons”, “on doit mieux cibler nos bénéficiaires”).",
          "Ensuite seulement, tu choisis les indicateurs, les données, et les méthodes.",
        ],
      },
      {
        heading: "1) L’analyse n’existe pas pour “faire parler les chiffres”",
        body: [
          "L’objectif n’est pas de produire des chiffres. L’objectif est de réduire l’incertitude qui bloque une action.",
          "Par exemple :",
          "• Une équipe hésite entre deux offres : tu analyses pour orienter le choix.",
          "• Un service observe une chute de performance : tu analyses pour identifier les causes probables et prioriser les actions.",
          "• Une direction veut investir mais ne sait pas où : tu analyses pour comparer des options et estimer le gain.",
          "Dans tous ces cas, les données sont un moyen, pas une finalité.",
        ],
      },
      {
        heading: "2) Pourquoi on perd du temps quand on néglige ce thème",
        body: [
          "Piège A — “On veut tout mesurer” : sans décision claire, on multiplie les KPI, on ouvre dix dashboards, on fait des rapports longs… et personne ne sait quoi regarder en priorité. Résultat : fatigue, confusion, et perte de confiance.",
          "Piège B — “On ne sait pas qui est le vrai client” : le demandeur n’est pas toujours celui qui décide. À la fin, le décideur dit “ce n’est pas ça que je voulais”.",
          "Piège C — “On découvre les contraintes trop tard” : données inaccessibles, conformité, intégration IT impossible, terrain incapable d’appliquer la recommandation. Ces contraintes auraient dû être identifiées au début avec les bonnes personnes.",
          "Piège D — “Le projet n’est pas adopté” : si les utilisateurs finaux ne comprennent pas le résultat ou ne lui font pas confiance, ils ne l’utiliseront pas. Et si le résultat n’est pas utilisé, le projet n’a pas de valeur.",
        ],
      },
      {
        heading: "3) Ce que ce thème te force à faire",
        body: [
          "Ce thème te force à répondre, dès le départ, à des questions que beaucoup évitent :",
          "• Pourquoi on fait cette analyse ?",
          "• Pour qui on la fait ?",
          "• Quelle décision elle doit éclairer ?",
          "• Quels comportements on veut changer ?",
          "• Quels KPI prouvent que ça marche ?",
          "Un analyste professionnel doit être capable de tenir une discussion structurée, même si le besoin est flou au départ. Tu ne dois pas “subir” la demande. Tu dois la transformer en problème analysable.",
        ],
      },
      {
        heading: "4) Exemple concret (simple) : KORYXA School",
        body: [
          "Imaginons une plateforme de formation. Une équipe dit : “On veut un dashboard sur les cours.”",
          "Si tu acceptes tel quel, tu risques de faire : nombre d’inscrits, temps passé, notes moyennes, taux de complétion, et quelques graphes.",
          "Mais la question est : quelle décision doit être améliorée ? Voici des décisions possibles :",
          "• Décision 1 : “Quels modules doivent être améliorés en priorité ?”",
          "• Décision 2 : “Pourquoi les apprenants abandonnent au thème 2 ?”",
          "• Décision 3 : “Quel canal d’acquisition apporte les meilleurs apprenants ?”",
          "• Décision 4 : “Quel type d’exercice augmente la réussite au mini-projet ?”",
          "“Faire un dashboard” n’est pas une décision. C’est un format. Ce thème t’apprend à remonter au besoin réel.",
        ],
      },
      {
        heading: "5) Les deux résultats attendus après ce thème",
        body: [
          "Résultat 1 — Un cadrage orienté décision : une phrase simple qui décrit la décision, le contexte, l’objectif, la contrainte principale, et l’indicateur de succès.",
          "Exemple : “Nous devons réduire le taux d’abandon au Thème 2 de 30% à 20% d’ici 8 semaines, sans augmenter la charge des mentors, en identifiant les points de friction et en testant deux améliorations.”",
          "Résultat 2 — Une première cartographie des parties prenantes : qui décide, qui utilise, qui fournit les données, qui peut bloquer, qui subit l’impact.",
          "Sans cette cartographie, tu travailles dans le noir.",
        ],
      },
      {
        heading: "6) Ce que tu dois retenir (en une idée)",
        body: [
          "Si tu ne sais pas qui veut quoi et quelle décision est en jeu, tu fais de la technique. Si tu le sais, tu fais de la Data Analysis utile.",
          "Mini-checklist (à appliquer dès aujourd’hui) :",
          "• Quelle décision veut-on améliorer ?",
          "• Qui prend cette décision ?",
          "• Qui va utiliser le résultat au quotidien ?",
          "• Quel est l’impact attendu si on réussit ?",
          "• Quel indicateur prouve le succès ?",
          "• Quelles contraintes peuvent bloquer (accès data, délai, conformité, IT, terrain) ?",
        ],
      },
    ],
  },
  {
    title: "Le problème de décision avant les données",
    sections: [
      {
        heading: "Pourquoi tout commence par la décision",
        body: [
          "Beaucoup de gens pensent que la Data Analysis commence quand on récupère les données. En réalité, le vrai départ d’un projet data, c’est le problème de décision.",
          "Tant que ce problème est flou, les données ne peuvent pas “sauver” le projet. Tu peux avoir le meilleur dataset du monde : si la décision n’est pas claire, tu produiras un résultat confus, ou non actionnable.",
        ],
      },
      {
        heading: "1) C’est quoi un “problème de décision” ?",
        body: [
          "Un problème de décision, c’est une situation où une personne (ou une organisation) doit choisir une action parmi plusieurs options, mais manque d’informations fiables pour choisir correctement.",
          "Exemples :",
          "• Faut-il augmenter le prix ou pas ?",
          "• Faut-il recruter plus de mentors ou améliorer le contenu ?",
          "• Faut-il cibler les campagnes sur Facebook ou sur LinkedIn ?",
          "• Faut-il renforcer la sécurité d’un service A ou d’un service B ?",
          "• Faut-il ouvrir un nouveau point de service dans telle zone ?",
          "L’analyse sert à réduire l’incertitude : elle n’élimine pas tous les risques, mais elle rend la décision plus solide.",
        ],
      },
      {
        heading: "2) Demande ≠ besoin",
        body: [
          "Une demande fréquente : “Fais-moi une analyse des ventes.” Ce n’est pas un besoin. C’est un thème.",
          "Le besoin réel est plutôt : “Pourquoi les ventes baissent ?”, “Quel produit doit-on mettre en avant ?”, “Quel segment client rapporte le plus ?”, “Quelle action marketing donne le meilleur ROI ?”",
          "Technique simple : la question “Et alors ?”",
          "• Et alors, on fera quoi avec ce chiffre ?",
          "• Si ce KPI baisse, quelle action on prend ?",
          "• Qui va agir ? et comment ?",
          "Si personne ne sait quoi faire avec le résultat, l’analyse n’a pas de destination.",
        ],
      },
      {
        heading: "3) Formule pratique pour cadrer le problème",
        body: [
          "Décision à prendre : quel choix concret ?",
          "Objectif : qu’est-ce qu’on veut améliorer ?",
          "Indicateur : comment mesurer l’amélioration ?",
          "Périmètre : sur quoi exactement ? (produit, zone, période, segment)",
          "Contraintes : délai, budget, ressources, conformité, terrain",
          "Actions possibles : options A/B/C (au minimum deux)",
          "Exemple (formation) :",
          "• Décision : améliorer quel thème en priorité ?",
          "• Objectif : augmenter le taux de complétion",
          "• Indicateur : % d’apprenants qui terminent chaque thème",
          "• Périmètre : cohorte des 3 derniers mois",
          "• Contraintes : pas d’augmentation de coût mentors",
          "• Actions : revoir contenu, ajouter exercices guidés, simplifier projet, tutoriels vidéo, etc.",
          "Ici, les données à collecter deviennent évidentes.",
        ],
      },
      {
        heading: "4) “Question intéressante” ≠ “question utile”",
        body: [
          "Une question peut être intéressante mais inutile si elle ne débouche sur aucune action.",
          "Exemple : “Quel est le jour où les apprenants se connectent le plus ?” — intéressant, mais quelle décision ça change ?",
          "Une question utile ressemble plutôt à :",
          "• “Quel moment d’envoi de rappel augmente le retour sur la plateforme ?”",
          "• “Quel type d’exercice réduit l’abandon après la page 3 ?”",
          "Parce que là, tu peux tester, agir, mesurer.",
        ],
      },
      {
        heading: "5) Le cadrage du succès",
        body: [
          "Un projet data sans critère de succès est un projet qui ne finit jamais. Tu dois définir un succès mesurable, même si ce n’est pas parfait.",
          "Exemples : réduire le temps d’attente moyen de 15% en 2 mois ; augmenter la conversion de 2 points ; réduire les erreurs de saisie de 30% ; augmenter la complétion d’un module de 10 points.",
          "Sans ça, tu ne peux pas dire si ton travail a servi.",
        ],
      },
      {
        heading: "6) Exemple municipal (service public, file d’attente)",
        body: [
          "Demande : “Analyse la situation des points d’eau.”",
          "Besoin décisionnel :",
          "• Décision : “où intervenir en priorité ?”",
          "• Objectif : “réduire la durée d’attente et les ruptures”",
          "• Indicateurs : temps d’attente moyen, % de jours en panne, nombre d’usagers impactés",
          "• Périmètre : quartiers à forte densité",
          "• Contraintes : budget limité, délais courts",
          "• Actions : réparer, installer un nouveau point, renforcer la maintenance, redistribuer l’accès",
          "L’analyse devient actionnable : tu classes les zones, tu proposes un plan priorisé, tu estimes l’impact.",
        ],
      },
      {
        heading: "7) Le livrable attendu de cette page",
        body: [
          "À la fin de cette page, tu dois savoir produire un texte court, que tu peux envoyer à ton sponsor.",
          "Format recommandé : Contexte (1–2 phrases) ; Décision (1 phrase) ; Objectif (1 phrase) ; Indicateur(s) ; Périmètre ; Contraintes ; Actions envisagées (A/B/C).",
          "C’est ton contrat de compréhension.",
          "Exercice rapide : choisis un sujet (formation, commerce, municipal, santé) et écris ton problème en 7 lignes : Contexte, Décision, Objectif, KPI, Périmètre, Contraintes, Actions possibles.",
        ],
      },
    ],
  },
  {
    title: "Parties prenantes internes",
    sections: [
      {
        heading: "Pourquoi les internes comptent",
        body: [
          "Un projet de Data Analysis se déroule dans une organisation. Et une organisation, ce sont des équipes, des responsabilités, des objectifs, et parfois des tensions.",
          "Les parties prenantes internes sont toutes les personnes ou équipes à l’intérieur de la structure qui influencent ton projet, qui l’utilisent, ou qui peuvent le bloquer.",
          "Ignorer les parties prenantes internes, c’est prendre un risque : tu peux avoir un résultat techniquement correct, mais impossible à déployer, impossible à valider, ou non aligné avec la stratégie.",
        ],
      },
      {
        heading: "1) Les catégories internes les plus fréquentes",
        body: [
          "a) Sponsor / Direction : objectif business, deadline, tolérance au risque, arbitrages possibles, niveau d’exigence (prototype vs livrable final).",
          "b) Responsable métier (owner du problème) : réalité opérationnelle, causes suspectées, limites du process, actions réalistes.",
          "c) Utilisateurs internes : besoins concrets, langage/définitions, habitudes, décisions du quotidien.",
          "d) Équipe Data / BI / Analytics : standards (définitions KPI), outils, bonnes pratiques, contraintes de production.",
          "e) IT / Dev / Infra : accès aux bases, permissions, sécurité, déploiement dashboards, intégration dans une app.",
          "f) Data owners : où sont les données, comment elles sont collectées, colonnes fiables, manquants, changements historiques.",
          "g) Conformité / Juridique / Sécurité : anonymisation, limitations d’usage, restrictions d’accès, règles de conservation.",
        ],
      },
      {
        heading: "2) Ce que tu dois collecter auprès d’une partie prenante interne",
        body: [
          "Tu ne dois pas seulement demander “qu’est-ce que vous voulez”. Tu dois structurer l’échange.",
          "Questions essentielles :",
          "• Quelle décision prenez-vous avec cette analyse ?",
          "• Qu’est-ce qui vous bloque aujourd’hui ?",
          "• Quels KPI utilisez-vous déjà ? et pourquoi ?",
          "• Quelles actions sont possibles si on découvre X ?",
          "• Quels sont les risques si on se trompe ?",
          "• Qui doit valider ? et à quel moment ?",
          "• Quelles contraintes (délai, budget, outils, conformité) ?",
        ],
      },
      {
        heading: "3) Rôles vs personnes (important)",
        body: [
          "Ne fais pas une liste de noms uniquement. Fais une liste de rôles, parce que les personnes peuvent changer.",
          "Exemple : Sponsor (Directeur programme), Owner métier (Responsable pédagogique), Data owner (Admin plateforme), Utilisateurs (Mentors/support), Validation (Direction + conformité).",
        ],
      },
      {
        heading: "4) Livrable : registre interne (modèle simple)",
        body: [
          "Tu peux créer un mini registre (même dans un Google Doc) : Rôle ; Objectif ; Attentes ; Risques ; Ce que je dois lui demander ; Fréquence d’échange.",
          "Ce document te protège : si on te reproche “vous n’avez pas compris”, tu peux montrer ce qui a été dit/validé.",
        ],
      },
      {
        heading: "5) Exemple interne (plateforme de formation)",
        body: [
          "Sponsor : veut un impact rapide et mesurable (taux d’abandon).",
          "Responsable pédagogique : veut comprendre où les apprenants bloquent (contenu trop dur, manque d’exemples).",
          "Mentors : veulent des exercices plus guidés et des consignes claires.",
          "IT : veut éviter une surcharge serveur et limiter les changements urgents.",
          "Data owner : sait que certaines données de progression sont parfois incomplètes.",
          "Conformité : impose de ne pas exposer les données personnelles dans les dashboards.",
        ],
      },
      {
        heading: "6) Erreurs classiques avec les internes",
        body: [
          "• Ne parler qu’au sponsor et ignorer les utilisateurs (adoption faible).",
          "• Ne parler qu’aux utilisateurs et ignorer le sponsor (pas de décision).",
          "• Découvrir IT/conformité à la fin (blocage).",
          "• Ne pas aligner les définitions KPI (conflits).",
          "• Promettre un livrable sans valider les contraintes d’accès aux données.",
          "Check rapide : 1 sponsor identifié, 1 owner métier, 1 data owner, 1 groupe d’utilisateurs, 1 circuit de validation.",
        ],
      },
    ],
  },
  {
    title: "Parties prenantes externes",
    sections: [
      {
        heading: "Les externes : impact, confiance, conformité",
        body: [
          "Les parties prenantes externes sont les personnes, organisations ou groupes qui ne font pas partie de ton équipe interne, mais qui sont impactés par le projet, ou qui influencent sa réussite.",
          "Dans beaucoup de projets, elles sont ignorées parce qu’on pense “c’est un projet interne”. Pourtant, elles déterminent souvent la valeur réelle : satisfaction, confiance, conformité, réputation, adoption, impact social.",
        ],
      },
      {
        heading: "1) Les principaux types de parties prenantes externes",
        body: [
          "a) Clients / utilisateurs finaux : clients payants, apprenants, citoyens/usagers, patients, bénéficiaires. Leur pouvoir est indirect : partir, se plaindre, recommander…",
          "b) Partenaires : écoles, entreprises, ONG, mairies, institutions. Ils peuvent imposer des contraintes ou des exigences de reporting.",
          "c) Fournisseurs / prestataires : hébergeur, paiement, CRM, audit. Ils influencent données, disponibilité, qualité, déploiement.",
          "d) Régulateurs / autorités / normes : protection des données, transparence, archivage, consentement, sécurité.",
          "e) Communauté / médias : perception, réputation, confiance (projets publics ou sensibles).",
        ],
      },
      {
        heading: "2) Intégrer les externes sans compliquer le projet",
        body: [
          "Tu n’es pas obligé de faire une enquête lourde. Mais tu dois prévoir un minimum : externes concernés, besoins principaux, risques de frustration, mesure d’impact.",
          "Exemples simples : lire les tickets support/feedback, analyser les commentaires, faire 5–10 mini entretiens, utiliser des sondages courts, observer des parcours utilisateurs.",
        ],
      },
      {
        heading: "3) Cas concret : apprenants (plateforme de formation)",
        body: [
          "Si ton analyse vise l’abandon, les apprenants sont externes (selon la structure).",
          "À clarifier : où ils abandonnent (page/exercice/projet/quiz/paiement/connexion) et les motifs (difficulté, manque d’exemple, manque de temps, incompréhension, bug, absence de mentor).",
          "Tu peux récupérer ça via données de progression, messages support, retours mentors, mini questionnaires.",
        ],
      },
      {
        heading: "4) Cas municipal : citoyens/usagers",
        body: [
          "Les citoyens n’ont pas de pouvoir “hiérarchique”, mais un pouvoir politique et social.",
          "Si tu optimises uniquement un KPI interne (ex : coût), tu peux dégrader l’accès pour certains quartiers. Prévois au minimum : mesure d’équité, mesure d’impact, communication simple (transparence).",
        ],
      },
      {
        heading: "5) Erreurs classiques",
        body: [
          "• Ne pas distinguer “client payant” et “utilisateur réel”.",
          "• Se baser uniquement sur des opinions internes sans vérifier un minimum.",
          "• Optimiser un KPI unique et créer un effet négatif ailleurs (conversion ↑ mais satisfaction ↓).",
          "• Oublier les contraintes externes (partenaire, conformité).",
        ],
      },
      {
        heading: "6) Livrable simple : liste externe + risques",
        body: [
          "Exemples :",
          "• Externe : apprenants — attente : comprendre/progresser/réussir — risque : abandon si trop complexe — mesure : complétion/retours/réussite mini-projet.",
          "• Externe : entreprises partenaires — attente : profils compétents — risque : formation trop théorique — mesure : réussite projet/feedback entreprise.",
          "• Externe : régulateur (si concerné) — attente : respect règles — risque : exposition données — mesure : contrôle accès/anonymisation.",
        ],
      },
    ],
  },
  {
    title: "Méthode en 5 étapes (de l’identification à l’action)",
    sections: [
      {
        heading: "Une méthode pour éviter le chaos",
        body: [
          "Cette méthode te sert de route. Elle évite le chaos au début d’un projet data.",
          "L’objectif est simple : identifier les bonnes personnes, comprendre leurs objectifs, prioriser ton engagement, et garder tout le monde aligné jusqu’au livrable final.",
        ],
      },
      {
        heading: "Étape 1 — Identifier les parties prenantes",
        body: [
          "Tu fais une liste large, sans filtrer trop tôt : décideurs, demandeurs, utilisateurs finaux (internes/externes), propriétaires de données, experts métier, équipes d’exécution, équipes de contrôle (conformité, sécurité).",
          "Questions utiles : Qui utilise ? Qui valide ? Qui peut dire non ? Qui subit l’impact si on se trompe ? Qui connaît le mieux le process réel ?",
        ],
      },
      {
        heading: "Étape 2 — Comprendre objectifs, attentes, contraintes",
        body: [
          "Tu organises des mini échanges structurés (15 à 30 minutes) avec des questions ciblées.",
          "Tu cherches des informations actionnables : objectifs, craintes, contraintes (délai/budget/règles), actions possibles, définitions.",
          "Piège : croire qu’une personne dit tout. Souvent, une partie des contraintes est cachée. D’où l’intérêt de parler à plusieurs rôles.",
        ],
      },
      {
        heading: "Étape 3 — Évaluer avec Pouvoir / Intérêt",
        body: [
          "Pour chaque partie prenante :",
          "• Pouvoir : peut-elle influencer ou bloquer ?",
          "• Intérêt : est-elle directement concernée ?",
          "Tu n’as pas besoin d’être parfait. Tu as besoin d’être cohérent : le but est de choisir où investir ton temps.",
        ],
      },
      {
        heading: "Étape 4 — Définir une stratégie d’engagement",
        body: [
          "Fort pouvoir + fort intérêt : réunions régulières, validations fréquentes, décisions rapides.",
          "Fort pouvoir + faible intérêt : points courts, messages orientés risques/valeur, pas de surcharge.",
          "Faible pouvoir + fort intérêt : informer, tester, recueillir feedback, faciliter l’adoption.",
          "Faible pouvoir + faible intérêt : surveiller, communication minimale.",
        ],
      },
      {
        heading: "Étape 5 — Suivre et ajuster",
        body: [
          "Le contexte change : une personne est remplacée, une priorité business change, une donnée devient indisponible, un partenaire arrive, un risque apparaît.",
          "Tu dois mettre à jour ta carte des parties prenantes et ton plan de communication.",
        ],
      },
      {
        heading: "Livrables minimum + exemple de déroulé (1 semaine)",
        body: [
          "Livrables minimum : liste des parties prenantes (rôles + objectifs), matrice Pouvoir/Intérêt, énoncé du problème orienté décision, critère de succès (KPI), plan de validation (qui valide quoi, quand).",
          "Exemple : Jour 1 (décision+KPI), Jour 2 (métier+utilisateurs), Jour 3 (data owner+IT), Jour 4 (conformité+matrice), Jour 5 (doc cadrage+validation+lancement).",
          "Erreurs à éviter : sauter directement à l’analyse sans validation ; ne pas définir le succès ; oublier le circuit de validation ; ne pas planifier l’usage réel du résultat.",
          "Exercice final : choisis un projet. Liste 8 parties prenantes (rôles), objectif + contrainte, classe-les, puis écris un plan d’engagement en 10 lignes.",
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

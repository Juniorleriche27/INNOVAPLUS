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
        heading: "Lecture (Page 1)",
        body: [
          "La Data Analysis n’est pas un concours de graphiques, ni une course au “dashboard le plus joli”. Une analyse vaut uniquement par sa capacité à aider une organisation à prendre de meilleures décisions, plus vite, avec moins de risques, et avec un impact réel sur le terrain. C’est pour ça que ce thème est critique : il remet la Data Analysis à sa vraie place, au début du projet, avant les données, avant Excel, avant SQL, avant Python.",
          "Beaucoup de projets data échouent pour une raison simple : on commence par les données (ou par un outil) au lieu de commencer par le besoin réel. On télécharge un fichier, on crée des graphiques, on calcule des KPI, puis à la fin… personne ne change rien. Ou bien le manager dit : “c’est intéressant”, mais aucune action ne suit. Ce n’est pas un problème technique. C’est un problème de cadrage.",
          "Un bon analyste ne se définit pas par sa capacité à manipuler un dataset, mais par sa capacité à clarifier trois choses :",
          "• Quelle décision on cherche à améliorer",
          "• Qui va utiliser le résultat (et qui peut bloquer le projet)",
          "• Comment on va mesurer que l’analyse a vraiment servi",
          "Ce thème te donne une compétence rare : transformer une demande floue (“fais-moi un reporting”) en un objectif clair (“on doit réduire le temps d’attente”, “on doit augmenter la conversion”, “on doit diminuer les abandons”, “on doit mieux cibler nos bénéficiaires”). Ensuite seulement, tu choisis les indicateurs, les données, et les méthodes.",
          "1. L’analyse n’existe pas pour “faire parler les chiffres”",
          "L’objectif n’est pas de produire des chiffres. L’objectif est de réduire l’incertitude qui bloque une action. Par exemple : une équipe hésite entre deux offres : tu analyses pour orienter le choix. Un service observe une chute de performance : tu analyses pour identifier les causes probables et prioriser les actions. Une direction veut investir mais ne sait pas où : tu analyses pour comparer des options et estimer le gain. Dans tous ces cas, les données sont un moyen, pas une finalité.",
          "2. Pourquoi on perd du temps quand on néglige ce thème",
          "Piège A — “On veut tout mesurer” : sans décision claire, on multiplie les KPI, on ouvre dix dashboards, on fait des rapports longs… et personne ne sait ce qu’il faut regarder en priorité. Résultat : fatigue, confusion, et perte de confiance.",
          "Piège B — “On ne sait pas qui est le vrai client” : le demandeur n’est pas toujours celui qui décide. Si tu travailles uniquement avec le demandeur, tu risques une situation très fréquente : à la fin, le décideur dit “ce n’est pas ça que je voulais”.",
          "Piège C — “On découvre les contraintes trop tard” : tu peux produire une analyse parfaite, puis apprendre à la fin que les données ne sont pas accessibles, que la conformité interdit un usage, que l’équipe IT ne peut pas intégrer le dashboard, ou que le terrain ne peut pas appliquer la recommandation.",
          "Piège D — “Le projet n’est pas adopté” : l’adoption est la frontière entre une analyse utile et une analyse décorative. Si les utilisateurs finaux ne comprennent pas le résultat, ou ne lui font pas confiance, ils ne l’utiliseront pas. Et si le résultat n’est pas utilisé, le projet n’a pas de valeur.",
          "3. Ce que ce thème te force à faire (et c’est une bonne chose)",
          "Ce thème te force à répondre, dès le départ, à des questions que beaucoup évitent : Pourquoi on fait cette analyse ? Pour qui on la fait ? Quelle décision elle doit éclairer ? Quels comportements on veut changer ? Quels KPI prouvent que ça marche ?",
          "4. Exemple concret (simple) : KORYXA School",
          "Une équipe dit : “On veut un dashboard sur les cours.” La question est : quelle décision doit être améliorée ? Décision 1 : “Quels modules doivent être améliorés en priorité ?” Décision 2 : “Pourquoi les apprenants abandonnent au thème 2 ?” Décision 3 : “Quel canal d’acquisition apporte les meilleurs apprenants ?” Décision 4 : “Quel type d’exercice augmente la réussite au mini-projet ?”",
          "Tu vois le point : “faire un dashboard” n’est pas une décision. C’est un format. Ce thème t’apprend à remonter au besoin réel.",
          "5. Les deux résultats attendus après ce thème",
          "Résultat 1 — Un cadrage orienté décision : une phrase simple qui décrit la décision, le contexte, l’objectif, la contrainte principale, et l’indicateur de succès.",
          "Exemple : “Nous devons réduire le taux d’abandon au Thème 2 de 30% à 20% d’ici 8 semaines, sans augmenter la charge des mentors, en identifiant les points de friction et en testant deux améliorations.”",
          "Résultat 2 — Une première cartographie des parties prenantes : tu sais qui décide, qui utilise, qui fournit les données, qui peut bloquer, et qui subit l’impact. Sans cette cartographie, tu travailles dans le noir.",
          "6. Ce que tu dois retenir (en une idée)",
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
        heading: "Lecture (Page 2)",
        body: [
          "Beaucoup de gens pensent que la Data Analysis commence quand on récupère les données. En réalité, le vrai départ d’un projet data, c’est le problème de décision. Tant que ce problème est flou, les données ne peuvent pas “sauver” le projet.",
          "1. C’est quoi un “problème de décision” ?",
          "Un problème de décision, c’est une situation où une personne (ou une organisation) doit choisir une action parmi plusieurs options, mais manque d’informations fiables pour choisir correctement.",
          "Exemples : faut-il augmenter le prix ? recruter plus de mentors ou améliorer le contenu ? cibler Facebook ou LinkedIn ? ouvrir un nouveau point de service ?",
          "2. Demande ≠ Besoin (et c’est là que les projets se cassent)",
          "Une demande fréquente : “Fais-moi une analyse des ventes.” Ce n’est pas un besoin. C’est un thème. Le besoin réel ressemble plutôt à : “Pourquoi les ventes baissent ? Quel segment rapporte le plus ? Quelle action marketing donne le meilleur ROI ?”",
          "Technique simple : la question “Et alors ?” Si personne ne sait quoi faire avec le résultat, l’analyse n’a pas de destination.",
          "3. Formule pratique pour cadrer le problème",
          "Décision à prendre ; Objectif ; Indicateur ; Périmètre ; Contraintes ; Actions possibles (A/B/C).",
          "4. “Question intéressante” ≠ “question utile”",
          "Une question utile est une question qui débouche sur une action testable. Exemple : “Quel moment d’envoi de rappel augmente le retour sur la plateforme ?”",
          "5. Le cadrage du succès",
          "Un projet data sans critère de succès est un projet qui ne finit jamais. Tu dois définir un succès mesurable (même imparfait).",
          "6. Exemple municipal (service public, file d’attente)",
          "Demande : “Analyse la situation des points d’eau.” Besoin décisionnel : décider où intervenir en priorité, avec indicateurs (temps d’attente, pannes, usagers impactés), contraintes (budget/délais), actions (réparer, installer, renforcer).",
          "7. Livrable attendu",
          "Énoncé du problème (format recommandé) : Contexte ; Décision ; Objectif ; Indicateur(s) ; Périmètre ; Contraintes ; Actions envisagées (A/B/C).",
          "Exercice rapide : choisis un sujet et écris ton problème en 7 lignes : Contexte, Décision, Objectif, KPI, Périmètre, Contraintes, Actions possibles.",
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
    title: "Matrice Pouvoir / Intérêt (le cœur du cadrage)",
    sections: [
      {
        heading: "Pourquoi cette matrice existe",
        body: [
          "La matrice Pouvoir / Intérêt est un outil simple qui évite des problèmes très coûteux : travailler avec les mauvaises personnes, ignorer un bloqueur, ou livrer un résultat qui ne sera jamais utilisé.",
          "Son but n’est pas de “faire joli” dans un document. Son but est de décider, dès le départ, où tu mets ton temps et comment tu communiques.",
          "Dans un projet Data Analysis, ton temps est limité. Tu ne peux pas faire des réunions longues avec tout le monde. Tu dois choisir : qui impliquer fortement, qui rassurer, qui informer, et qui surveiller.",
          "La matrice te donne une logique claire pour faire ces choix.",
        ],
      },
      {
        heading: "1) Définition simple des deux axes",
        body: [
          "A. Pouvoir",
          "Le pouvoir, c’est la capacité réelle d’une personne (ou d’une équipe) à influencer le projet. Ça peut être : valider/refuser le projet, donner/retirer des ressources (temps, budget, accès), bloquer l’accès aux données, imposer des règles (sécurité, conformité), imposer des priorités (stratégie, roadmap), orienter la décision finale.",
          "Le pouvoir n’est pas seulement “être chef”. Parfois une personne technique, un gestionnaire de base, ou un responsable de process a un pouvoir de blocage énorme, même sans titre prestigieux.",
          "B. Intérêt",
          "L’intérêt, c’est à quel point la personne est concernée par le résultat, ou veut vraiment suivre le projet. L’intérêt est élevé quand : le résultat change son travail, ses KPI, ses décisions, peut l’aider (ou le mettre en difficulté), impacte directement ses objectifs.",
          "Une personne peut avoir un intérêt élevé même si elle n’a pas de pouvoir. Par exemple : une équipe terrain qui souffre d’un problème chaque jour.",
        ],
      },
      {
        heading: "2) Comment remplir une matrice sans se tromper",
        body: [
          "Le piège, c’est d’évaluer au feeling. Pour être plus solide, tu peux utiliser une logique rapide :",
          "Indices de pouvoir (questions) :",
          "• Peut-elle dire “oui/non” au projet ?",
          "• Contrôle-t-elle l’accès à une ressource critique ?",
          "• Peut-elle imposer une règle ou un veto ?",
          "• Son avis influence-t-il le décideur final ?",
          "• Peut-elle ralentir le projet par simple non-collaboration ?",
          "Indices d’intérêt (questions) :",
          "• Le résultat change-t-il son quotidien ?",
          "• Le résultat change-t-il ses KPI ?",
          "• Le sujet est-il urgent pour elle ?",
          "• Le sujet touche-t-il sa responsabilité ?",
          "• Est-elle prête à donner du temps pour suivre ?",
          "Tu ne cherches pas la perfection. Tu cherches une classification utile.",
        ],
      },
      {
        heading: "3) Pourquoi cette matrice est indispensable",
        body: [
          "Parce qu’un projet data échoue souvent pour une raison humaine : tu n’as pas parlé au vrai décideur, tu n’as pas impliqué les utilisateurs, tu as ignoré un bloqueur (IT / conformité / data owner), tu as communiqué trop ou pas assez.",
          "Avec la matrice, tu anticipes ces problèmes et tu sécurises ton projet.",
        ],
      },
      {
        heading: "4) Exemple rapide (formation / plateforme)",
        body: [
          "Objectif : réduire l’abandon au Thème 2.",
          "Sponsor (direction programme) : fort pouvoir, fort intérêt (car il veut un résultat rapide).",
          "Responsable pédagogique : fort intérêt, pouvoir moyen/fort (il influence les décisions contenu).",
          "Mentors : intérêt élevé, pouvoir faible (ils subissent et remontent les difficultés).",
          "IT : pouvoir fort, intérêt parfois faible (peut bloquer, mais ne suit pas le contenu).",
          "Data owner (admin plateforme) : pouvoir moyen/fort (accès / tracking), intérêt moyen.",
          "Apprenants : intérêt élevé, pouvoir faible (mais impact indirect via abandon / réputation).",
          "Tu vois déjà comment ton plan doit s’organiser.",
        ],
      },
      {
        heading: "5) Livrable attendu (format texte prêt)",
        body: [
          "Liste des parties prenantes.",
          "Pour chacune : Pouvoir (faible/moyen/fort) et Intérêt (faible/moyen/fort).",
          "Positionnement dans la matrice.",
          "Implication recommandée.",
          "Ce livrable doit être court, clair, actionnable.",
        ],
      },
      {
        heading: "6) Mini-exercice",
        body: [
          "Prends un projet réel. Fais une liste de 10 parties prenantes.",
          "Puis classe chaque personne avec : Pouvoir (1 à 5) et Intérêt (1 à 5).",
          "Ensuite, place-les mentalement dans la matrice.",
          "Tu verras souvent une surprise : une personne que tu croyais “secondaire” est en réalité un bloqueur, ou un utilisateur essentiel que tu avais oublié.",
        ],
      },
    ],
  },
  {
    title: "Quadrant A : Gérer de près (Fort pouvoir + fort intérêt)",
    sections: [
      {
        heading: "Pourquoi ce quadrant est le plus critique",
        body: [
          "Ce quadrant est le plus critique. C’est ici que se trouvent les personnes qui peuvent faire avancer le projet très vite, ou le faire échouer si elles ne sont pas satisfaites.",
          "Dans un projet de Data Analysis, “gérer de près” ne signifie pas faire des réunions inutiles. Cela signifie : valider rapidement les décisions clés, éviter les surprises, obtenir des arbitrages et protéger le projet.",
        ],
      },
      {
        heading: "1) Qui se trouve généralement dans ce quadrant ?",
        body: [
          "Sponsor / direction directement concernée.",
          "Responsable métier avec autorité.",
          "Product owner ou responsable du service.",
          "Chef de programme.",
          "Parfois conformité / sécurité si le sujet est sensible.",
          "Parfois data owner si l’accès est complexe et critique.",
        ],
      },
      {
        heading: "2) Comment travailler avec eux (stratégie)",
        body: [
          "A. Clarifier le contrat dès le départ : valider la décision à améliorer, le succès mesurable, le périmètre, la deadline, les actions possibles, les limites acceptables. Sinon tu risques d’entendre à la fin : “ce n’est pas ce que je voulais”.",
          "B. Réduire le bruit, augmenter la valeur : garder le focus sur ce qui bloque la décision, ce qui change le résultat, ce qui change l’action.",
          "C. Obtenir des arbitrages rapidement : quand il y a un obstacle (données manquantes, conflit de définition KPI, priorités contradictoires), remonter au sponsor pour arbitrer vite.",
        ],
      },
      {
        heading: "3) Formats de communication efficaces",
        body: [
          "• Un point hebdomadaire très court (15–20 min).",
          "• Un document “1 page” : décisions, risques, prochaines étapes.",
          "• Un prototype rapide (ex : premier tableau de bord) pour valider la direction.",
          "• Un message clair quand il y a blocage : “Voici 2 options, choisissez”.",
        ],
      },
      {
        heading: "4) Exemple concret (KORYXA School)",
        body: [
          "Objectif : augmenter la complétion du Module 1.",
          "Sponsor (Quadrant A) veut : savoir où ça bloque, savoir quoi changer, voir un plan d’action simple.",
          "Toi, tu dois livrer : les étapes où l’abandon explose, les hypothèses principales (difficulté, manque d’exemples, charge du projet), 2–3 actions testables, et la mesure d’impact attendue.",
          "Le sponsor n’a pas besoin d’un rapport de 30 pages. Il veut une décision claire.",
        ],
      },
      {
        heading: "5) Erreurs classiques",
        body: [
          "• Attendre la fin pour présenter un résultat “final” → surprise, rejet, perte de temps.",
          "• Présenter trop de détails techniques → le sponsor se déconnecte.",
          "• Ne pas proposer d’options d’action → le sponsor reste bloqué.",
          "• Confondre validation “polie” (“ok intéressant”) et validation réelle (“on décide X”).",
        ],
      },
      {
        heading: "6) Checklist Quadrant A",
        body: [
          "Le sponsor a validé l’objectif et le KPI.",
          "La décision à prendre est claire.",
          "Les options d’action sont explicites.",
          "Les risques et limites sont partagés.",
          "Il y a un rythme de validation simple.",
        ],
      },
    ],
  },
  {
    title: "Quadrant B : Satisfaire (Fort pouvoir + faible intérêt)",
    sections: [
      {
        heading: "Le but : éviter un veto tardif",
        body: [
          "Ce quadrant est souvent sous-estimé. Les personnes ici peuvent bloquer ton projet, mais elles n’ont pas envie d’y passer du temps.",
          "Ton objectif n’est pas de les transformer en fans du projet. Ton objectif est d’éviter qu’elles deviennent un obstacle tardif.",
        ],
      },
      {
        heading: "1) Qui se trouve généralement dans ce quadrant ?",
        body: [
          "DSI / IT très occupé, pas focus sur ton sujet.",
          "Finance / contrôle de gestion (si pas directement concerné).",
          "Direction générale (si ce n’est pas un projet stratégique).",
          "Responsable sécurité / conformité (si la contrainte est standard).",
          "Partenaires internes qui doivent valider un point précis.",
        ],
      },
      {
        heading: "2) La règle d’or : communication courte, orientée risques/valeur",
        body: [
          "Ces personnes n’ont pas le temps. Si tu envoies des messages longs, elles ne lisent pas.",
          "Ton message doit répondre à : qu’est-ce que vous devez valider ? quel est le risque si on ne valide pas ? quel est le délai ? qu’est-ce que vous gagnez à dire oui ?",
        ],
      },
      {
        heading: "3) Exemple (IT)",
        body: [
          "Tu dois déployer un dashboard, mais IT s’en fiche du contenu. Ce que IT veut savoir : sécurité, permissions, charge serveur, compatibilité, effort technique.",
          "Donc tu envoies : objectif (1 phrase), données utilisées (1 ligne), besoin d’accès (liste), fréquence de mise à jour, effort estimé. Puis tu demandes une validation claire.",
        ],
      },
      {
        heading: "4) Stratégie pratique : “demande minimale”",
        body: [
          "Ne leur demande pas d’assister à tous les ateliers.",
          "Demande : une validation sur l’accès, une validation sur la sécurité, une validation sur l’intégration, et un point contact si problème.",
        ],
      },
      {
        heading: "5) Erreurs classiques",
        body: [
          "• Les ignorer complètement → veto final.",
          "• Les sur-solliciter → ils deviennent opposants.",
          "• Ne pas documenter la demande → confusion, lenteur.",
          "• Arriver trop tard → “on n’a pas de créneau”, projet bloqué.",
        ],
      },
      {
        heading: "6) Checklist Quadrant B",
        body: [
          "Tu sais exactement ce qu’ils doivent valider.",
          "Tu as préparé un message court.",
          "Tu as un délai et un rappel.",
          "Tu as documenté la décision.",
        ],
      },
    ],
  },
  {
    title: "Quadrant C : Informer (Faible pouvoir + fort intérêt)",
    sections: [
      {
        heading: "Le quadrant de l’adoption",
        body: [
          "Ce quadrant est celui de l’adoption. Les personnes ici ne peuvent pas bloquer ton projet par un veto officiel, mais elles peuvent faire échouer ton projet dans la réalité : si elles n’utilisent pas le résultat, si elles ne comprennent pas, si elles ne font pas confiance, ou si le livrable n’est pas adapté à leur travail.",
          "C’est souvent ici que se trouve le “terrain”.",
        ],
      },
      {
        heading: "1) Qui se trouve généralement dans ce quadrant ?",
        body: [
          "Utilisateurs opérationnels (support, terrain, agents, mentors).",
          "Analysts métiers juniors.",
          "Coordinateurs sans pouvoir de décision final.",
          "Groupes d’utilisateurs finaux (si externes consultés via feedback).",
        ],
      },
      {
        heading: "2) Objectif : compréhension + utilité + confiance",
        body: [
          "Pour ce quadrant, ton travail est de : comprendre leurs besoins concrets, tester la lisibilité de tes indicateurs, vérifier que tes recommandations sont réalisables, améliorer la forme du livrable (clarté, simplicité, actions).",
        ],
      },
      {
        heading: "3) Méthodes efficaces",
        body: [
          "A. Prototypes rapides : montre un premier tableau/graphique/segmentation tôt, et demande : “qu’est-ce que vous comprenez ? qu’est-ce qui manque ?”",
          "B. Définitions communes : standardiser les termes (“abandon”, “actif”, etc.) pour éviter les conflits.",
          "C. Feedback sur les actions : le terrain dira ce qui est faisable, ce qui ne l’est pas, et ce qui est irréaliste.",
        ],
      },
      {
        heading: "4) Exemple (mentors dans une formation)",
        body: [
          "Si ton analyse dit : “ajoutez 3 devoirs supplémentaires”, les mentors vont dire : “impossible, on est déjà saturés”.",
          "Donc tu dois intégrer une contrainte réelle : améliorer la réussite sans augmenter la charge.",
          "Le terrain protège ton projet contre les recommandations irréalistes.",
        ],
      },
      {
        heading: "5) Erreurs classiques",
        body: [
          "• Les informer uniquement à la fin → rejet.",
          "• Faire des KPI complexes → incompréhension.",
          "• Ne pas expliquer les changements → perte de confiance.",
          "• Ignorer leurs retours → adoption faible.",
        ],
      },
      {
        heading: "6) Checklist Quadrant C",
        body: [
          "Tu as au moins 1 session de feedback.",
          "Tes KPI sont compris sans interprétation.",
          "Tu as validé la faisabilité des actions.",
          "Tu as prévu une mini documentation / guide.",
        ],
      },
    ],
  },
  {
    title: "Quadrant D : Surveiller (Faible pouvoir + faible intérêt)",
    sections: [
      {
        heading: "Surveiller sans surinvestir",
        body: [
          "Ce quadrant ne doit pas absorber ton énergie. Mais il ne doit pas être ignoré complètement.",
          "Certaines parties prenantes sont aujourd’hui peu concernées, mais peuvent devenir importantes demain : changement d’organisation, incident, nouvelle priorité, crise, audit, arrivée d’un partenaire.",
          "Ton objectif ici : garder un œil, sans surinvestir.",
        ],
      },
      {
        heading: "1) Qui se trouve généralement dans ce quadrant ?",
        body: [
          "Équipes éloignées du périmètre.",
          "Partenaires internes non concernés.",
          "Certains prestataires hors scope.",
          "Acteurs “informés par défaut” mais non impliqués.",
        ],
      },
      {
        heading: "2) Stratégie : communication minimale mais intelligente",
        body: [
          "Un message de lancement (si nécessaire).",
          "Un point à mi-parcours (si impact potentiel).",
          "Une note finale (résultats + actions).",
          "Tu veux éviter : “je découvre ça maintenant” alors qu’il aurait dû être vaguement au courant.",
        ],
      },
      {
        heading: "3) Quand ce quadrant devient dangereux",
        body: [
          "Si le sujet devient sensible (données personnelles), si une crise arrive (bug/incident), si un audit externe démarre, si le projet change de périmètre.",
          "Dans ces cas, certains acteurs du Quadrant D peuvent passer en Quadrant B ou A. D’où l’importance de “surveiller”.",
        ],
      },
      {
        heading: "4) Exemple simple",
        body: [
          "Au départ, une équipe “communication” est en Quadrant D.",
          "Mais si le projet touche l’image publique (municipal, service, association), elle peut passer rapidement en Quadrant B ou A. Tu dois anticiper ce basculement.",
        ],
      },
      {
        heading: "5) Erreurs classiques",
        body: [
          "• Les spammer → perte de temps.",
          "• Les ignorer totalement → surprise + conflits.",
          "• Ne pas mettre à jour la matrice quand le contexte change.",
        ],
      },
      {
        heading: "6) Checklist Quadrant D",
        body: [
          "Tu sais pourquoi ils sont là.",
          "Tu as défini une communication minimale.",
          "Tu surveilles les signaux de changement.",
          "Tu peux les reclasser rapidement si besoin.",
        ],
      },
    ],
  },
  {
    title: "Noter Pouvoir / Intérêt (pour rendre la matrice exploitable)",
    sections: [
      {
        heading: "Pourquoi noter au lieu de seulement classer",
        body: [
          "La matrice Pouvoir / Intérêt devient vraiment puissante quand tu vas au-delà de “faible / moyen / fort” et que tu utilises une notation.",
          "Noter permet trois choses très concrètes : (1) comparer les parties prenantes entre elles, (2) justifier tes priorités, (3) suivre l’évolution au fil du projet.",
          "L’objectif n’est pas d’être “scientifique”. L’objectif est d’être cohérent et pratique. Une note simple (1 à 5) suffit largement, à condition de définir clairement ce que signifie chaque niveau.",
          "Avec 4 quadrants seulement, tu risques d’avoir des groupes trop larges. Par exemple, deux personnes peuvent être dans “Gérer de près”, mais l’une est un sponsor décisif et l’autre un manager influent mais secondaire.",
        ],
      },
      {
        heading: "Une règle simple (exploitable)",
        body: [
          "Tu peux appliquer une règle simple :",
          "• si Pouvoir ≥ 4 et Intérêt ≥ 4 → engagement intensif",
          "• si Pouvoir ≥ 4 et Intérêt ≤ 2 → engagement minimal mais sécurisé",
          "• si Pouvoir ≤ 2 et Intérêt ≥ 4 → engagement orienté adoption",
          "• si Pouvoir ≤ 2 et Intérêt ≤ 2 → veille uniquement",
        ],
      },
      {
        heading: "Échelle recommandée (1 à 5) — Pouvoir",
        body: [
          "1 — Très faible : aucune influence, aucun accès, aucune capacité de blocage.",
          "2 — Faible : influence limitée, peut compliquer un détail mais ne bloque pas le projet.",
          "3 — Moyen : influence réelle, peut retarder, peut orienter certaines décisions.",
          "4 — Fort : peut bloquer une étape clé (accès data, validation, budget, sécurité).",
          "5 — Très fort : décideur final ou veto direct, contrôle des ressources essentielles.",
        ],
      },
      {
        heading: "Échelle recommandée (1 à 5) — Intérêt",
        body: [
          "1 — Très faible : ne se sent pas concerné, ne suit pas le sujet.",
          "2 — Faible : concerné indirectement, écoute si on l’appelle.",
          "3 — Moyen : concerné, suit certaines étapes, donne des retours.",
          "4 — Fort : fortement concerné, veut participer, attend des résultats.",
          "5 — Très fort : impact direct, urgence, attend des décisions rapides, très impliqué.",
        ],
      },
      {
        heading: "Comment attribuer les notes sans “inventer”",
        body: [
          "Pour éviter le feeling, utilise des critères simples et répétables.",
          "Critères de Pouvoir (tu coches, puis tu notes) :",
          "• Peut-il/elle refuser ou valider officiellement ?",
          "• Contrôle-t-il/elle un accès critique ? (base, API, permissions, serveur)",
          "• A-t-il/elle un veto (conformité, sécurité, juridique) ?",
          "• Contrôle-t-il/elle un budget ou des ressources (temps équipe, priorités) ?",
          "• Son avis influence-t-il/elle directement le décideur final ?",
          "• Peut-il/elle bloquer en ne répondant pas (pouvoir de ralentissement) ?",
          "Plus tu coches de critères, plus la note monte.",
          "Critères d’Intérêt :",
          "• Son travail quotidien est-il impacté ?",
          "• Ses KPI ou objectifs changent-ils grâce au projet ?",
          "• Est-ce une urgence pour lui/elle ?",
          "• Est-il/elle évalué(e) sur ce sujet ?",
          "• A-t-il/elle demandé des mises à jour régulières ?",
          "• A-t-il/elle déjà proposé des idées / des actions ?",
        ],
      },
      {
        heading: "Astuce : pouvoir de décision vs pouvoir de blocage",
        body: [
          "Dans les projets data, deux formes de pouvoir existent :",
          "• Pouvoir de décision : choisir la direction, valider l’option A/B, prioriser.",
          "• Pouvoir de blocage : empêcher l’accès, imposer des règles, ralentir.",
          "Parfois, une personne n’a pas le pouvoir de décider… mais a le pouvoir de bloquer. Dans ce cas, sa note de pouvoir doit être élevée.",
          "Exemple : un admin de base de données peut ne pas décider des objectifs métier, mais il peut rendre le projet impossible s’il refuse l’accès.",
        ],
      },
      {
        heading: "Exemple de notation (simple)",
        body: [
          "Contexte : améliorer la complétion d’un module de formation.",
          "• Sponsor programme : Pouvoir 5 (valide budget/priorité), Intérêt 5 (impact direct)",
          "• Responsable pédagogique : Pouvoir 4, Intérêt 5",
          "• Admin plateforme (data owner) : Pouvoir 4 (accès tracking), Intérêt 3",
          "• IT / infra : Pouvoir 4 (permissions/déploiement), Intérêt 2",
          "• Mentors : Pouvoir 2, Intérêt 5",
          "• Support : Pouvoir 2, Intérêt 4",
          "• Apprenants : Pouvoir 2, Intérêt 5 (impact indirect)",
          "• Communication : Pouvoir 2, Intérêt 2 (au départ)",
          "Tu vois immédiatement qui doit être géré de près, qui doit être satisfait, et qui doit être informé.",
        ],
      },
      {
        heading: "Comment utiliser les notes pour gérer ton temps",
        body: [
          "Tu peux créer un score simple : Score priorité = Pouvoir + Intérêt (max 10).",
          "Puis fixer des règles :",
          "• Score 9–10 : contact fréquent + validation",
          "• Score 7–8 : contact régulier + points clés",
          "• Score 5–6 : information + feedback ponctuel",
          "• Score ≤ 4 : veille minimale",
          "Ce score ne remplace pas la matrice, mais il t’aide à choisir un rythme.",
        ],
      },
      {
        heading: "Mise à jour, erreurs fréquentes, modèle",
        body: [
          "La matrice n’est pas figée. Tu dois mettre à jour les notes quand : un acteur change, le projet change de périmètre, un risque apparaît, une dépendance devient critique, un partenaire arrive.",
          "Exemple : si un audit commence, conformité peut passer de (Pouvoir 4, Intérêt 2) à (Pouvoir 5, Intérêt 4).",
          "Erreurs fréquentes : noter le pouvoir uniquement selon le titre, sous-noter les bloqueurs techniques, sur-noter des personnes bruyantes, ne pas expliquer la logique, ne pas mettre à jour.",
          "Modèle prêt à copier :",
          "Rôle ; Objectif ; Craintes/risques ; Pouvoir (1–5) + justification ; Intérêt (1–5) + justification ; Quadrant ; Stratégie ; Fréquence ; Canal.",
          "Mini-exercice (obligatoire) : liste 10 parties prenantes, attribue Pouvoir/Intérêt avec justification, puis écris ton plan de communication en 10 lignes.",
        ],
      },
    ],
  },
  {
    title: "Exemple KORYXA School (cas complet, du cadrage à l’engagement)",
    sections: [
      {
        heading: "1) Contexte et problème",
        body: [
          "Observation : beaucoup d’apprenants commencent le Module 1, mais une partie importante abandonne avant la fin du Thème 2. Résultat : complétion faible, frustration, impact global réduit.",
          "Demande initiale (classique) : “On veut un dashboard sur la progression des apprenants.”",
          "Besoin décisionnel (plus utile) : “On doit réduire l’abandon au Thème 2 et augmenter la complétion du Module 1 en améliorant l’expérience d’apprentissage, sans augmenter la charge des mentors.”",
        ],
      },
      {
        heading: "2) Décision, objectif, indicateurs",
        body: [
          "Décision principale : quels changements prioriser pour réduire l’abandon au Thème 2 ?",
          "Objectif : augmenter le taux de complétion du Module 1 (ou réduire l’abandon au Thème 2) sur une période définie (ex. 8 semaines).",
          "Indicateurs (exemples) : taux de complétion du Module 1 ; taux d’abandon au Thème 2 (définition claire) ; temps moyen entre deux pages ; taux de réussite aux exercices/mini-projet ; taux de retour après un rappel.",
        ],
      },
      {
        heading: "3) Parties prenantes (liste structurée)",
        body: [
          "Internes : sponsor programme, responsable pédagogique/contenu, mentors/formateurs, support apprenants, admin plateforme (data owner), IT/infra (déploiement/sécurité), marketing/acquisition (si analyse cohortes).",
          "Externes : apprenants (utilisateurs finaux), partenaires (financement/recrutement), prestataires éventuels (paiement, tracking, hébergement).",
        ],
      },
      {
        heading: "4) Notation Pouvoir / Intérêt (exemple)",
        body: [
          "Sponsor programme : Pouvoir 5, Intérêt 5",
          "Responsable pédagogique : Pouvoir 4, Intérêt 5",
          "Admin plateforme (data owner) : Pouvoir 4, Intérêt 3",
          "IT / infra : Pouvoir 4, Intérêt 2",
          "Mentors : Pouvoir 2, Intérêt 5",
          "Support : Pouvoir 2, Intérêt 4",
          "Marketing : Pouvoir 3, Intérêt 3",
          "Apprenants : Pouvoir 2, Intérêt 5",
          "Partenaires : Pouvoir 3–4 (selon cas), Intérêt 2–4",
        ],
      },
      {
        heading: "5) Matrice et stratégie d’engagement",
        body: [
          "Quadrant A — Gérer de près : sponsor programme, responsable pédagogique.",
          "→ 1 point court hebdomadaire (15–20 min), validation rapide des hypothèses/actions, arbitrage immédiat.",
          "Quadrant B — Satisfaire : IT/infra, parfois admin plateforme si surchargé.",
          "→ demandes courtes et précises (accès/permissions/logs/déploiement), doc technique 1 page, pas de réunions longues.",
          "Quadrant C — Informer : mentors, support, apprenants via feedback.",
          "→ sessions feedback (prototype, définitions KPI), tests de compréhension, validation faisabilité (sans augmenter la charge).",
          "Quadrant D — Surveiller : acteurs périphériques selon organisation.",
          "→ info minimale, veille sur changements.",
        ],
      },
      {
        heading: "6) Plan de cadrage en 5 jours (exemple)",
        body: [
          "Jour 1 : atelier sponsor + responsable pédagogique (définir abandon, succès, horizon 8 semaines, contraintes).",
          "Jour 2 : mentors + support (où ça bloque réellement ? frictions : pages longues, manque d’exemples, consignes, bugs, surcharge).",
          "Jour 3 : admin plateforme (données disponibles, limites tracking, qualité ; ce qui est fiable).",
          "Jour 4 : IT/infra (accès, sécurité, performance, déploiement ; format : dashboard + rapport court + recommandations).",
          "Jour 5 : doc final validé (problème + KPI + matrice + plan d’action data).",
        ],
      },
      {
        heading: "7) Hypothèses et actions testables",
        body: [
          "Hypothèse 1 : difficulté trop élevée au Thème 2.",
          "→ actions : exemple guidé avant exercices, vidéo simple, découper une page dense, mini-checklist “à retenir”.",
          "Hypothèse 2 : consignes de mini-projet pas claires.",
          "→ actions : template + exemple de rendu, critères affichés, mini-projet en étapes.",
          "Hypothèse 3 : manque de feedback rapide.",
          "→ actions : correction automatique partielle, forum/FAQ, réponses types support.",
          "Les actions sont choisies avec mentors + responsable pédagogique pour garantir faisabilité.",
        ],
      },
      {
        heading: "8) Livrable attendu",
        body: [
          "Une matrice parties prenantes + notes.",
          "Un énoncé du problème + KPI + contraintes.",
          "Une analyse descriptive : où l’abandon se concentre.",
          "2–3 actions priorisées (plan d’amélioration) + suivi avant/après (impact complétion).",
          "Mini-exercice : écris la décision, le succès (KPI), 10 parties prenantes + notes, plan d’engagement, 3 actions testables réalistes.",
        ],
      },
    ],
  },
  {
    title: "Exemple municipal (cas complet, service public et équité)",
    sections: [
      {
        heading: "1) Contexte et problème",
        body: [
          "La municipalité gère des points de service (ex. eau, collecte, centres de santé communautaires, services administratifs). Les citoyens se plaignent de files d’attente longues, pannes fréquentes, accès inégal selon les quartiers, manque d’informations.",
          "Demande initiale : “Faites une analyse des points de service.”",
          "Besoin décisionnel : “Décider où intervenir en priorité pour réduire l’attente et améliorer la disponibilité, avec un budget limité, sans créer d’injustice entre quartiers.”",
        ],
      },
      {
        heading: "2) Décisions typiques (orientées action)",
        body: [
          "Réparer quels points en priorité ?",
          "Où installer un nouveau point de service ?",
          "Où renforcer la maintenance ?",
          "Comment organiser les horaires pour réduire la congestion ?",
          "Comment communiquer pour éviter des déplacements inutiles ?",
        ],
      },
      {
        heading: "3) Indicateurs possibles (exemples)",
        body: [
          "Temps d’attente moyen (par point, par jour, par heure).",
          "Taux de panne / indisponibilité (jours en panne / mois).",
          "Nombre estimé d’usagers impactés (population / zone).",
          "Distance moyenne des ménages au point le plus proche.",
          "Nombre d’incidents rapportés (selon cas).",
          "Coût d’intervention vs impact attendu.",
          "Important : dans le public, prévoir un KPI d’équité (impact par quartier/zone vulnérable, réduction d’écart entre zones).",
        ],
      },
      {
        heading: "4) Parties prenantes (liste structurée)",
        body: [
          "Internes : maire/direction municipale (décision politique), chef de service technique (exécution), équipe maintenance/terrain, budget/finances, informatique/SIG (si géo), communication municipale, conformité/contrôle interne (selon contexte).",
          "Externes : citoyens/usagers, chefs de quartier/représentants, prestataires maintenance, ONG/partenaires (cofinancement), autorités régionales/nationales (normes/subventions).",
        ],
      },
      {
        heading: "5) Notation Pouvoir / Intérêt (exemple)",
        body: [
          "Maire / direction : Pouvoir 5, Intérêt 4–5",
          "Chef service technique : Pouvoir 4, Intérêt 5",
          "Budget/finances : Pouvoir 4, Intérêt 3",
          "Maintenance terrain : Pouvoir 2–3, Intérêt 5",
          "Communication : Pouvoir 3, Intérêt 3–4",
          "SIG/IT : Pouvoir 3–4, Intérêt 2–3",
          "Citoyens : Pouvoir 2 (direct), Intérêt 5",
          "Chefs de quartier : Pouvoir 3, Intérêt 5",
          "Prestataires : Pouvoir 3, Intérêt 3",
        ],
      },
      {
        heading: "6) Matrice et stratégie d’engagement",
        body: [
          "Quadrant A : maire/direction, chef service technique (décisions rapides, arbitrages, priorisation).",
          "Quadrant B : budget/finances, SIG/IT (validation contraintes, pas de veto tardif).",
          "Quadrant C : maintenance terrain, communication, citoyens (via feedback), chefs de quartier (consultation) — faisabilité + acceptabilité.",
          "Quadrant D : acteurs périphériques au départ.",
        ],
      },
      {
        heading: "7) Déroulé concret du cadrage",
        body: [
          "Étape 1 : cadrer décision + contraintes (budget limité → prioriser ; délai court → quick wins ; équité → éviter injustice).",
          "Étape 2 : collecte terrain (maintenance : où ça casse ? pourquoi ? ; chefs de quartier : où douleur forte ? ; citoyens : quels horaires posent problème ? ; prestataires : délais/coûts).",
          "Étape 3 : aligner communication (sinon tensions et déplacements inutiles).",
          "Étape 4 : produire une priorisation simple (top 10 à réparer, top 5 zones à renforcer, estimation impact, plan mise en œuvre).",
        ],
      },
      {
        heading: "8) Recommandations actionnables + erreurs fréquentes",
        body: [
          "Au lieu de “le point X a un temps d’attente élevé”, tu proposes : Intervention 1 (réparer X : coût + impact), Intervention 2 (déplacer équipe maintenance : gain), Intervention 3 (ajuster horaires), Intervention 4 (communication ciblée).",
          "Et tu précises : quoi, quand, qui exécute, comment mesurer l’amélioration.",
          "Erreurs fréquentes : ignorer chefs de quartier (résistance), ignorer maintenance (plan irréaliste), optimiser KPI global et créer injustice locale, rapport long sans plan d’action, négliger communication.",
          "Mini-exercice : choisis un service municipal ; écris décision prioritaire, 5 KPI + 1 KPI d’équité, 12 parties prenantes + notes, plan d’engagement, plan d’action en 5 points.",
        ],
      },
    ],
  },
  {
    title: "Livrables professionnels (ce qu’un analyste doit laisser à la fin)",
    sections: [
      {
        heading: "Pourquoi les livrables font le “professionnel”",
        body: [
          "Un projet de Data Analysis devient professionnel quand il laisse des livrables clairs, réutilisables, et validés.",
          "Ces livrables ne sont pas du “papier”. Ce sont des objets qui sécurisent la compréhension, accélèrent les décisions, et permettent la continuité si quelqu’un d’autre reprend le projet.",
        ],
      },
      {
        heading: "Livrable 1 — Énoncé du problème (Problem Statement)",
        body: [
          "C’est le document le plus important. Il tient en une page. Il contient :",
          "Contexte (2–3 lignes), Décision à prendre (1 ligne), Objectif (1 ligne), KPI de succès (liste courte), Périmètre, Contraintes, Actions possibles (A/B/C), Risques/hypothèses, Responsable validation.",
          "Sans ce livrable, tu risques d’avoir un projet sans fin, et des attentes contradictoires.",
        ],
      },
      {
        heading: "Livrable 2 — Registre des parties prenantes (Stakeholder Register)",
        body: [
          "Un registre simple, qui contient pour chaque rôle : Rôle/groupe, objectif principal, craintes/risques, Pouvoir (1–5), Intérêt (1–5), Quadrant (A/B/C/D), stratégie, fréquence/canal de communication, besoins spécifiques (accès data, validation, formation…).",
          "Ce registre te sert à planifier la communication et éviter les surprises.",
        ],
      },
      {
        heading: "Livrable 3 — Matrice Pouvoir / Intérêt (visuelle + commentaire)",
        body: [
          "Tu peux la présenter sous forme de graphique ou de tableau.",
          "Mais elle doit contenir la position de chaque acteur, et une justification courte si besoin.",
          "Le but : que n’importe qui comprenne qui est critique, qui peut bloquer, qui doit être informé, qui doit être consulté.",
        ],
      },
      {
        heading: "Livrable 4 — Définitions KPI (glossaire)",
        body: [
          "Source majeure de conflits si absent. Pour chaque KPI : nom, définition exacte, formule simple, source de données, fréquence de mise à jour, limitations connues.",
          "Exemple : “Taux d’abandon au Thème 2 = nombre d’apprenants qui commencent Thème 2 mais ne terminent pas la dernière page dans les 14 jours / nombre d’apprenants qui commencent Thème 2.”",
          "Sans définition, deux personnes peuvent lire le même KPI et comprendre deux choses différentes.",
        ],
      },
      {
        heading: "Livrable 5 — Plan de communication (simple)",
        body: [
          "Répond à : qui reçoit quoi, quand, sous quel format, et pourquoi.",
          "Exemple : sponsor (point hebdo + 1 page décisions/risques), IT (validation accès/sécurité à l’étape), utilisateurs (prototype + feedback mi-parcours), direction (note finale + plan d’action fin).",
        ],
      },
      {
        heading: "Livrable 6 — Plan de validation (qui valide quoi, quand)",
        body: [
          "Validation du problème (début), validation définitions KPI (début/milieu), validation des données (milieu), validation du prototype (milieu), validation finale (fin).",
          "Pour chaque validation : qui valide, quel critère, quel format, quel délai.",
        ],
      },
      {
        heading: "Livrable 7 — Journal des décisions (Decision Log)",
        body: [
          "Simple mais puissant. À chaque décision : date, décision, valideurs, justification courte, impact sur le projet.",
          "Exemple : “Définir abandon = 14 jours sans progression. Validé sponsor + responsable pédagogique. Impact : recalcul KPI et segmentation cohortes.”",
          "Ça évite les retours en arrière inutiles.",
        ],
      },
      {
        heading: "Pack livrables recommandé + checklist",
        body: [
          "Pack recommandé (4 sections) :",
          "• Cadrage : Problem Statement, Stakeholder Register, Matrice, Plan communication + validation",
          "• KPI : Glossaire KPI, Sources + limites",
          "• Résultats : Synthèse courte, Graphiques clés, Conclusions actionnables",
          "• Plan d’action : Actions priorisées, Owner, Délai, Indicateur de suivi",
          "Checklist qualité : décision claire (1 phrase), succès mesurable (KPI définis), parties prenantes critiques impliquées, bloqueurs ont validé, utilisateurs comprennent sans explication longue, plan d’action faisable + attribué, projet reprenable sans confusion.",
          "Exercice final : construis un pack livrables sur KORYXA School (abandon Thème 2) ou municipal (points de service) : Problem Statement, Stakeholder Register (10 rôles), matrice + notes, glossaire KPI (5 KPI), plan communication + validation (10 lignes).",
        ],
      },
    ],
  },
  {
    title: "Erreurs classiques et checklist (pour éviter les échecs inutiles)",
    sections: [
      {
        heading: "1) Les erreurs classiques (et pourquoi elles font mal)",
        body: [
          "Même avec de bons outils (Excel, SQL, Python, Power BI), beaucoup de projets Data Analysis échouent pour des raisons simples : mauvaise question, mauvaises personnes, mauvais timing, ou livrable non utilisable. Cette page te donne les erreurs les plus fréquentes et une checklist courte qui te sert de garde-fou.",
          "Erreur 1 — Commencer par les données au lieu de commencer par la décision : c’est le piège numéro un. On ouvre un fichier, on explore, on construit des graphiques… puis on se demande : “qu’est-ce qu’on conclut ?”. Le bon ordre est l’inverse : décision → objectif → KPI → contraintes → données → analyse.",
          "Erreur 2 — Confondre “demandeur” et “décideur” : la personne qui demande n’est pas toujours celle qui tranche. Si tu n’identifies pas le décideur, tu risques de livrer quelque chose qui sera rejeté à la fin.",
          "Erreur 3 — Ignorer les utilisateurs finaux (ceux qui vont appliquer) : un dashboard peut être correct mais inutilisable (trop dense, trop technique, pas adapté au terrain). Les utilisateurs finaux doivent être consultés tôt.",
          "Erreur 4 — Découvrir les bloqueurs trop tard (IT, data owner, conformité) : on n’a pas l’accès, on ne peut pas exposer certaines données, l’intégration n’est pas possible, la fréquence de mise à jour est trop coûteuse.",
          "Erreur 5 — Définitions KPI floues ou contradictoires : deux personnes peuvent lire “taux d’abandon” et comprendre deux choses différentes. Sans glossaire KPI, tu crées un conflit automatique.",
          "Erreur 6 — Trop de KPI, pas de priorité : une “usine à KPI” tue la prise de décision. Un bon projet choisit peu d’indicateurs : ceux qui pilotent une action.",
          "Erreur 7 — Ne pas définir de succès mesurable : si tu ne définis pas ce que signifie “réussir”, tu ne peux pas conclure. Le projet devient un flux de demandes interminables.",
          "Erreur 8 — Livrer une recommandation impossible à appliquer : budget, charge, délai, contraintes légales. Sinon le livrable reste dans un dossier, sans action.",
          "Erreur 9 — Ne pas documenter les décisions : sans journal des décisions, on réécrit l’histoire (“on n’a jamais validé ça”).",
          "Erreur 10 — Ne pas prévoir la suite (suivi et mesure) : un projet data doit prévoir comment mesurer l’impact et comment itérer.",
        ],
      },
      {
        heading: "2) Checklist de cadrage (avant de commencer l’analyse)",
        body: [
          "A) Cadrage décisionnel",
          "• La décision à améliorer est écrite en 1 phrase",
          "• Les actions possibles sont claires (au moins 2 options)",
          "• La deadline métier est connue",
          "• Les contraintes majeures sont listées (budget, délai, conformité, tech)",
          "B) KPI et succès",
          "• Le succès est défini par 1 à 3 KPI principaux",
          "• Chaque KPI a une définition claire (formule + source)",
          "• Les limites des données sont connues (données manquantes, retards, biais)",
          "C) Parties prenantes",
          "• Sponsor / décideur identifié",
          "• Utilisateurs finaux identifiés",
          "• Data owner identifié",
          "• Bloqueurs potentiels identifiés (IT, sécurité, conformité)",
          "• Matrice Pouvoir/Intérêt remplie (même simple)",
          "D) Validation et communication",
          "• Plan de validation : qui valide quoi, quand",
          "• Plan de communication : qui reçoit quoi, quand",
          "• Format de livrable choisi (dashboard, rapport, slide, note 1 page)",
        ],
      },
      {
        heading: "3) Checklist pendant l’analyse (pour garder le cap)",
        body: [
          "• Je peux expliquer le projet en 30 secondes (décision + KPI).",
          "• Je valide les définitions KPI avant de calculer massivement.",
          "• Je fais un prototype tôt et je collecte du feedback.",
          "• Je documente les choix (définitions, filtres, exclusions).",
          "• Je garde un fil conducteur : chaque résultat doit servir une action.",
        ],
      },
      {
        heading: "4) Checklist de livraison (avant d’envoyer)",
        body: [
          "• Le livrable répond à la décision (pas seulement “des chiffres”).",
          "• Les graphiques sont lisibles et interprétables.",
          "• Il y a une synthèse courte (5–10 lignes).",
          "• Les recommandations sont faisables et priorisées.",
          "• Le suivi est prévu : comment on mesure l’impact après.",
        ],
      },
      {
        heading: "5) Exercice (rapide mais puissant)",
        body: [
          "Choisis un projet réel.",
          "Liste 5 erreurs parmi celles ci-dessus que tu risques de faire.",
          "Pour chacune, écris 1 action de prévention (simple).",
          "C’est ta stratégie anti-échec.",
        ],
      },
    ],
  },
  {
    title: "Exercices et notebook (pratique + mini-projet)",
    sections: [
      {
        heading: "1) Exercice 1 — Transformer une demande floue en problème décisionnel",
        body: [
          "Choisis une demande floue parmi celles-ci (ou invente la tienne) :",
          "• “On veut un dashboard de la plateforme”",
          "• “Analyse la performance des ventes”",
          "• “Analyse les files d’attente”",
          "• “Analyse l’abandon des apprenants”",
          "Ta mission : écrire un problème décisionnel en 7 lignes : Contexte, Décision, Objectif, KPI (1 à 3), Périmètre (période/population/zone), Contraintes (3 max), Actions possibles (au moins 2).",
          "Critère de réussite : quelqu’un doit pouvoir décider quelque chose juste en lisant tes 7 lignes.",
        ],
      },
      {
        heading: "2) Exercice 2 — Liste des parties prenantes (12 rôles)",
        body: [
          "Fais une liste de 12 rôles : 6 internes et 6 externes.",
          "Pour chaque rôle, écris : objectif principal (1 ligne) et contrainte ou crainte (1 ligne).",
          "Exemple : “Mentors : veulent des consignes claires / crainte : surcharge de correction.”",
        ],
      },
      {
        heading: "3) Exercice 3 — Notation Pouvoir/Intérêt + matrice",
        body: [
          "Pour tes 12 rôles : attribue Pouvoir (1–5), attribue Intérêt (1–5), classe en Quadrant A/B/C/D.",
          "Ensuite, écris ton plan d’engagement :",
          "• Quadrant A : que fais-tu chaque semaine ?",
          "• Quadrant B : que fais-tu aux étapes clés ?",
          "• Quadrant C : quand fais-tu du feedback ?",
          "• Quadrant D : que surveilles-tu ?",
        ],
      },
      {
        heading: "4) Exercice 4 — Glossaire KPI (obligatoire)",
        body: [
          "Choisis 5 KPI et définis-les clairement : nom, définition, formule, source, fréquence.",
          "Exemple (formation) : “Taux de complétion du module = apprenants ayant terminé la dernière page / apprenants ayant commencé le module.”",
        ],
      },
      {
        heading: "5) Mini-projet à soumettre (à la fin du thème)",
        body: [
          "Titre : Cadrage complet d’un projet Data Analysis (stakeholders + décision + KPI)",
          "Livrables à rendre :",
          "• Problem statement (1 page maximum)",
          "• Stakeholder register (12 rôles)",
          "• Matrice Pouvoir/Intérêt + notes",
          "• Glossaire KPI (5 KPI)",
          "• Plan de communication + plan de validation (10–15 lignes)",
          "Option bonus : 1 page “risques + mitigation” (5 risques, 1 action chacun).",
        ],
      },
      {
        heading: "6) Notebook (structure recommandée)",
        body: [
          "Même si tu n’as pas encore des données réelles, tu peux construire un notebook propre avec un exemple de dataset, des données simulées, ou un extrait (10 lignes) pour montrer la logique.",
          "Notebook — plan : Introduction (problème + KPI), Parties prenantes (tableau), Matrice (tableau + commentaire), KPI dictionary (tableau), Exemple de données, Calcul simple de 2 KPI, Graphique simple, Conclusions + actions, Plan de suivi (avant/après).",
          "Format attendu : un notebook lisible, avec des titres et un bloc “conclusion” clair.",
        ],
      },
      {
        heading: "7) Exemple de dataset minimal (si tu veux simuler)",
        body: [
          "Tu peux créer un petit tableau avec : user_id, module_id, theme_id, page_id, started_at, completed_at, score_exercise, device, country, support_ticket (0/1).",
          "Avec ça, tu peux calculer : complétion, abandon, temps entre pages, réussite exercice, comparaison mobile vs desktop.",
        ],
      },
      {
        heading: "8) Grille d’évaluation (pour la soumission)",
        body: [
          "Problème décisionnel clair (20%)",
          "KPI définis proprement (20%)",
          "Parties prenantes complètes (20%)",
          "Matrice cohérente + stratégie d’engagement (20%)",
          "Livrables propres et lisibles (20%)",
        ],
      },
    ],
  },
  {
    title: "Résumé à retenir (synthèse finale du thème)",
    sections: [
      {
        heading: "Les points essentiels (à retenir)",
        body: [
          "1) L’ordre correct d’un projet Data Analysis : Décision → Objectif → KPI → Contraintes → Parties prenantes → Données → Analyse → Actions → Suivi. Si tu inverses cet ordre, tu risques de produire un livrable inutile.",
          "2) Le problème de décision : une analyse utile répond à une question qui change une action. Toujours demander : “Quelle décision veut-on améliorer ?”, “Quelles actions sont possibles ?”, “Comment mesure-t-on le succès ?”.",
          "3) Parties prenantes : la clé de l’adoption. Identifier : qui décide, qui utilise, qui peut bloquer, qui subit l’impact.",
          "4) Matrice Pouvoir / Intérêt : ton GPS. Deux axes (Pouvoir, Intérêt) et 4 stratégies : A gérer de près, B satisfaire, C informer, D surveiller.",
          "5) La notation (1–5) rend la matrice opérationnelle : prioriser ton temps, justifier tes choix, suivre l’évolution du contexte.",
          "6) Livrables minimum : Problem statement (1 page), Stakeholder register, Matrice, Glossaire KPI, Plan communication + validation, Synthèse + plan d’action.",
          "7) Erreurs à ne plus refaire : KPI non définis, décideur non identifié, utilisateurs ignorés, IT/conformité découverts trop tard, recommandations irréalistes, absence de suivi après action.",
          "8) Ce que tu dois savoir faire maintenant : cadrer en 7 lignes, produire une liste de parties prenantes, construire une matrice notée, définir des KPI sans ambiguïté, proposer une stratégie d’engagement, livrer un pack de cadrage propre.",
          "9) Dernière règle : une analyse utile se mesure par ce qu’elle change (décision, action, résultat, impact). Si rien ne change, ton travail était peut-être bien fait… mais pas utile.",
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

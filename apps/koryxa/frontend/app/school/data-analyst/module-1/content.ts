export type ThemeVideo = { title: string; url: string; lang: "fr" | "en" };
export type ThemeArticle = { label: string; url: string };

export type ThemeContent = {
  slug: string;
  title: string;
  objectives: string[];
  text: string[];
  examples: string[];
  checklist: string[];
  videos: ThemeVideo[];
  articles: ThemeArticle[];
};

export const themes: ThemeContent[] = [
  {
    slug: "theme-1",
    title: "Comprendre le besoin + parties prenantes",
    objectives: [
      "Distinguer symptome vs probleme racine.",
      "Identifier les parties prenantes (sponsor, utilisateurs, data owners).",
      "Cartographier pouvoir/interet pour prioriser.",
    ],
    text: [
      "Le piege classique : la solution deguisee en besoin. Beaucoup de demandes arrivent sous forme de solution : \"Fais-moi un dashboard\" ou \"On veut un modele de prediction\". Le Data Analyst doit ramener la discussion vers la decision a prendre : qui decide, quelle action change, quel cout d'erreur est acceptable.",
      "Symptome vs cause. Exemple e-commerce : symptome \"les ventes baissent\". Les causes possibles sont multiples : trafic, conversion, panier moyen, rupture stock, prix, bug paiement. Sans cadrage, tu analyses tout et tu livres rien. Le cadrage clarifie la cause a tester.",
      "Parties prenantes : toute personne ou groupe qui influence le projet ou est impacte par les resultats. Categorie utile en data : sponsor, owner metier, utilisateurs, data owners, compliance, opposants.",
      "Prioriser avec la grille pouvoir/interet : fort pouvoir + fort interet = gerer de pres; fort pouvoir + faible interet = satisfaire; faible pouvoir + fort interet = informer; faible pouvoir + faible interet = surveiller.",
    ],
    examples: [
      "E-commerce : trafic en baisse vs conversion en baisse, deux plans d'analyse differents.",
      "Sponsor absent : risque de livrer un KPI non valide.",
    ],
    checklist: [
      "Liste des stakeholders (nom + role).",
      "Carte pouvoir/interet terminee.",
      "Risques humains listes.",
      "Questions posees au sponsor.",
    ],
    videos: [
      { title: "Analyse des parties prenantes – Grille des acteurs (ZOPP)", url: "https://www.youtube.com/watch?v=W6Y8BYdLrS0", lang: "fr" },
      { title: "Stakeholder Analysis: Winning Support for Your Projects (MindTools)", url: "https://www.youtube.com/watch?v=9Fzfrcqqv5o", lang: "en" },
    ],
    articles: [
      { label: "Stakeholder Analysis (MindTools)", url: "https://www.mindtools.com/aol0rms/stakeholder-analysis/" },
      { label: "Identifying and Analyzing Stakeholders (Community Tool Box)", url: "https://ctb.ku.edu/en/table-of-contents/participation/encouraging-involvement/identify-stakeholders/main" },
    ],
  },
  {
    slug: "theme-2",
    title: "Objectifs SMART + questions d'analyse",
    objectives: [
      "Transformer un besoin en objectifs mesurables.",
      "Construire des questions d'analyse testables.",
      "Comprendre les limites du SMART.",
    ],
    text: [
      "Objectif ≠ KPI. Objectif : resultat desire (ex : augmenter la retention a 7 jours). KPI : mesure (ex : Retention_D7). Un KPI sans objectif devient du reporting decoratif.",
      "SMART est un cadre pour rendre un objectif clair : specifique, mesurable, atteignable, realiste, temporel. Ex : augmenter le taux de completion du Module 1 de 35% a 50% d'ici 8 semaines.",
      "On part de la decision : quelles questions guident l'analyse ? Exemple : quel canal amène les apprenants qui finissent le module ? A quelle etape ils decrochent ?",
      "Hypotheses testables : H1 les apprenants qui ouvrent le notebook dans les 48h ont +20% de completion. H2 le drop est concentre sur la lecon 3.",
    ],
    examples: [
      "Flou : \"ameliorer l'engagement\" -> SMART : \"+15 points de completion d'ici 8 semaines\".",
      "Hypothese testable = variable mesurable + periode.",
    ],
    checklist: [
      "2 objectifs SMART ecrits.",
      "5 questions d'analyse formulees.",
      "2 hypotheses + donnees necessaires.",
    ],
    videos: [
      { title: "L'objectif SMART, c'est quoi ? (Infonet)", url: "https://www.youtube.com/watch?v=N1Dqpq8RvfM", lang: "fr" },
      { title: "How to Set SMART Goals (MindTools)", url: "https://www.youtube.com/watch?v=OXA6gfzFA24", lang: "en" },
    ],
    articles: [
      { label: "SMART criteria (historique + variations)", url: "https://en.wikipedia.org/wiki/SMART_criteria" },
      { label: "How to write SMART goals (Atlassian)", url: "https://www.atlassian.com/blog/productivity/how-to-write-smart-goals" },
    ],
  },
  {
    slug: "theme-3",
    title: "KPIs : definition, choix, dictionnaire",
    objectives: [
      "Distinguer KPI vs metrique secondaire.",
      "Construire un KPI Dictionary standardise.",
      "Eviter les vanity KPIs.",
    ],
    text: [
      "Definition operationnelle d'un KPI : mesure cle reliee a un objectif et utile pour piloter une action. Tout ce qui est mesurable n'est pas un KPI.",
      "Criteres de selection : actionnable, comprehensible, stable dans le temps, aligne avec l'objectif.",
      "Dictionnaire KPI obligatoire : nom, definition, formule, numerateur/denominateur, granularite, source, regles, proprietaire, frequence.",
    ],
    examples: [
      "Completion_Rate_M1 = users_validated / users_enrolled (cohorte d'inscription).",
    ],
    checklist: [
      "6 KPIs (3 clefs + 3 secondaires).",
      "Dictionnaire KPI complete.",
    ],
    videos: [
      { title: "K comme KPI – comprendre les indicateurs", url: "https://www.youtube.com/watch?v=fcjWQn2pFJ8", lang: "fr" },
      { title: "What is a KPI? Key Performance Indicators", url: "https://www.youtube.com/watch?v=soiChkomKmo", lang: "en" },
    ],
    articles: [
      { label: "What is a KPI? (Bernard Marr)", url: "https://bernardmarr.com/what-is-a-kpi/" },
      { label: "Understanding KPIs (SimpleKPI)", url: "https://www.simplekpi.com/Resources/Key-Performance-Indicators" },
    ],
  },
  {
    slug: "theme-4",
    title: "Plan d'analyse : donnees, scope, criteres d'acceptation",
    objectives: [
      "Definir les donnees minimales necessaires.",
      "Ecrire un plan d'analyse scope.",
      "Definir des criteres d'acceptation clairs.",
    ],
    text: [
      "Le scope est ton meilleur ami : ce que tu fais maintenant + ce que tu repousses en phase 2. Sans scope, tu promets tout et tu livres partiel.",
      "Pour chaque KPI ou question : quelles variables, ou elles vivent (CRM, DB, Excel, API), qualite attendue, identifiant commun.",
      "Criteres d'acceptation : dashboard < 5s, KPI alignes aux definitions validees, notebook reproductible.",
      "Livrable plan d'analyse : objectifs + KPIs, donnees sources, transformations, risques, limites, planning.",
    ],
    examples: [
      "KPI retention -> besoin d'un user_id stable + date d'inscription.",
    ],
    checklist: [
      "Plan d'analyse redige.",
      "Sources de donnees listees.",
      "Criteres d'acceptation poses.",
    ],
    videos: [
      { title: "Comment reussir votre projet BI : outils, methode, tips (Jedha)", url: "https://www.youtube.com/watch?v=64lu6-EdTSE", lang: "fr" },
      { title: "How to Gather Data Requirements That Deliver Real Business Value", url: "https://www.youtube.com/watch?v=R-2ScLdTP6w", lang: "en" },
    ],
    articles: [
      { label: "Etapes d'un projet BI", url: "https://www.myreport.fr/blog/etapes-projet-de-business-intelligence/" },
      { label: "Note de cadrage : methode QQOQCP", url: "https://www.manager-go.com/gestion-de-projet/dossiers-methodes/realiser-une-note-de-cadrage" },
    ],
  },
  {
    slug: "theme-5",
    title: "Documentation & validation",
    objectives: [
      "Comprendre pourquoi la documentation evite les conflits.",
      "Creer un mini data dictionary + KPI glossary.",
      "Organiser une validation metier propre.",
    ],
    text: [
      "Pourquoi on se dispute ? Souvent parce que les definitions divergent. \"Client actif\" peut vouloir dire achat, login ou paiement. D'ou l'importance d'un glossaire KPI et d'un dictionnaire de donnees.",
      "Dictionnaire de donnees : documente champs, types, regles, relations (user_id, signup_date, paid_plan, country, etc.).",
      "Validation metier : rituel simple. Presenter objectifs, KPI dictionary, exemples de calcul. Le metier valide et tu captures la validation.",
    ],
    examples: [
      "Validation capturee par commentaire, ticket ou signature.",
    ],
    checklist: [
      "KPI glossary (1 page).",
      "Data dictionary minimal (1 page).",
      "Compte-rendu de validation.",
    ],
    videos: [
      { title: "MERISE – Initiation au dictionnaire de donnees", url: "https://www.youtube.com/watch?v=HuMjRMW4m4o", lang: "fr" },
      { title: "Data Dictionary 101 | What is Data Dictionary", url: "https://www.youtube.com/watch?v=zyrqeP0viUs", lang: "en" },
    ],
    articles: [
      { label: "Qu'est-ce qu'un dictionnaire de donnees ? (Pure Storage)", url: "https://www.purestorage.com/fr/knowledge/what-is-a-data-dictionary.html" },
      { label: "Data catalog vs data dictionary (Actian)", url: "https://www.actian.com/fr/blog/data-management/data-catalog-vs-data-dictionary/" },
    ],
  },
];

export const module1Overview = {
  title: "Module 1 — Compréhension du besoin & KPIs (cadrage)",
  outcomes: [
    "Probleme metier clair et objectifs SMART.",
    "KPIs definis (formule, granularite, source).",
    "Plan d'analyse (donnees, limites, risques).",
    "Validation stakeholder + baseline KPI calcule.",
  ],
};

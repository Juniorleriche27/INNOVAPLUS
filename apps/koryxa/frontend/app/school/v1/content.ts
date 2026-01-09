export type ResourceLink = { label: string; url: string };
export type SectionVideo = { label: string; url: string };
export type ModuleSection = { title: string; text: string[]; video?: SectionVideo };
export type NotebookBlock = { title: string; description: string; code: string; download?: string };
export type QuizQuestion = {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type ModuleContent = {
  id: string;
  title: string;
  text: string[];
  resources: { videos: ResourceLink[]; articles: ResourceLink[] };
  sections?: ModuleSection[];
  notebook?: NotebookBlock;
  quiz: QuizQuestion[];
};

export type ProgramContent = {
  id: string;
  title: string;
  objective: string;
  duration: string;
  modules: ModuleContent[];
};

export const foundationalProgram: ProgramContent = {
  id: "fondamental",
  title: "Parcours Fondamental Commun",
  objective: "Construire une base solide pour comprendre la data et l'IA appliquee a des besoins reels.",
  duration: "4–6 semaines",
  modules: [
    {
      id: "intro-metiers",
      title: "Introduction aux metiers de la data & IA",
      text: [],
      sections: [
        {
          title: "Introduction generale",
          text: [
            "KORYXA School ne fonctionne pas comme une simple plateforme de videos. Ici, un parcours est concu comme un livre, un module comme un chapitre, et chaque lecon comme une page. Le texte ecrit constitue le support officiel de formation : il structure l'apprentissage, explique les concepts fondamentaux et fixe le cadre de reference. Les videos et ressources externes viennent illustrer et renforcer la comprehension, mais ne remplacent jamais le contenu principal.",
            "Dans ce module, l'objectif est de comprendre a quoi servent reellement les principaux metiers de la data et de l'intelligence artificielle, comment ils transforment un besoin concret en mission exploitable, et pourquoi l'IA est devenue un outil central de creation de valeur dans les organisations. L'intelligence artificielle n'est pas un slogan ni une solution magique. Utilisee correctement, elle permet de cadrer un probleme, d'accelerer la production, et de standardiser la qualite des livrables.",
            "Une entreprise qui souhaite mieux suivre ses ventes, une ONG qui veut analyser des donnees terrain, ou une startup qui cherche a automatiser un processus font toutes face a des besoins reels. La data et l'IA permettent de transformer ces besoins en actions claires, mesurables et exploitables. C'est cette transformation qui cree des opportunites concretes pour les apprenants, tout en apportant des resultats utiles aux organisations.",
            "Pour avancer efficacement, il est essentiel de comprendre qui fait quoi. Chaque metier de la data a une responsabilite precise, mais aucun ne travaille isolement. Un livrable data de qualite est toujours le resultat d'une chaine complete, allant de la collecte des donnees a l'analyse, puis a la prise de decision. Ce module pose les bases necessaires pour comprendre cette chaine et s'y integrer intelligemment.",
            "Un principe fondamental doit etre retenu des le depart : l'intelligence artificielle n'est utile que si elle repose sur des donnees fiables et un objectif clairement defini. Sans cadre, elle produit du bruit. Avec un cadre rigoureux, elle produit un livrable exploitable. C'est cette logique que KORYXA met en place des les premieres etapes de la formation.",
          ],
          video: {
            label: "IBM – What is Data Science",
            url: "https://www.youtube.com/watch?v=X3paOmcrTjQ",
          },
        },
        {
          title: "Data Analyst",
          text: [
            "Le Data Analyst est le role qui rend la data lisible. Son travail consiste a transformer des donnees brutes en informations utiles pour la decision. Il structure des tableaux de bord, identifie des tendances, et explique ce que les chiffres veulent dire pour l'organisation.",
            "Un bon Data Analyst ne se limite pas a produire un graphique. Il commence par une question claire : \"Pourquoi nos ventes baissent dans telle region ?\", \"Quels produits se vendent le mieux ?\", \"Quelle campagne marketing a le plus d'impact ?\" Ensuite, il collecte les donnees, les nettoie, puis construit une analyse qui repond au besoin.",
            "Le Data Analyst travaille sur des cas reels : reporting, suivi de performance, segmentation client, analyse de couts. Il sert d'interface entre la data et les equipes operationnelles. C'est souvent le premier role data dans une entreprise qui veut progresser vers l'IA.",
            "Dans une mission KORYXA, le Data Analyst pose le cadre du livrable : quels indicateurs suivre, quels niveaux de detail, et quelles actions en sortent. Son travail doit etre clair, lisible et directement utilisable par l'organisation.",
          ],
          video: {
            label: "IBM – What does a Data Analyst do?",
            url: "https://www.youtube.com/watch?v=ywZXpfdqg1o",
          },
        },
        {
          title: "Data Engineer",
          text: [
            "Le Data Engineer construit les fondations. Il cree les pipelines qui collectent, stockent et preparent les donnees. Sans lui, pas de data fiable pour l'analyse ou l'IA.",
            "Son travail est technique, mais essentiel : connecter des sources, automatiser les flux, assurer la qualite. Il met en place des bases de donnees, organise les schemas, et garantit que les donnees sont disponibles quand l'organisation en a besoin.",
            "Dans un besoin reel, le Data Engineer intervient des le debut : il transforme un probleme flou en flux clair. Exemple : une entreprise a des donnees disperses. Le Data Engineer les rassemble, les structure, puis les rend exploitables pour le reste de l'equipe.",
            "Le Data Engineer assure aussi la durabilite : un pipeline bien concu evite les erreurs silencieuses et facilite le passage a l'echelle. C'est la difference entre un test ponctuel et un systeme qui fonctionne chaque semaine.",
          ],
          video: {
            label: "Grafikart – Le metier de Data Engineer explique",
            url: "https://www.youtube.com/watch?v=9wZ8qGZkN6Y",
          },
        },
        {
          title: "Data Scientist",
          text: [
            "Le Data Scientist cree des modeles pour expliquer ou predire. Il utilise des methodes statistiques et des algorithmes pour repondre a des questions avancees : prevoir une demande, detecter une anomalie, recommander une action.",
            "Il commence toujours par un besoin clair. Exemple : \"Quels clients risquent de partir ?\", \"Comment optimiser une chaine logistique ?\" Il construit un modele, le teste, puis explique les resultats. Ce travail demande rigueur et interpretation.",
            "L'IA est au coeur du metier de Data Scientist, mais elle reste un outil. L'objectif n'est pas de faire un modele impressionnant, mais un modele utile. Un bon Data Scientist traduit la complexite en decisions simples.",
            "Dans une mission, il documente les hypotheses, les limites et les risques. Cela permet a l'entreprise de comprendre pourquoi le modele fonctionne, et dans quels cas il ne doit pas etre utilise.",
          ],
          video: {
            label: "DataScientest – C'est quoi le metier de Data Scientist ?",
            url: "https://www.youtube.com/watch?v=8K8C2UjXQnA",
          },
        },
        {
          title: "Machine Learning Engineer",
          text: [
            "Le Machine Learning Engineer (MLE) fait passer les modeles dans le monde reel. Il transforme un prototype en service stable, rapide et utilisable par des equipes ou des applications.",
            "Son role est d'industrialiser : automatiser l'entrainement, deployer des API, surveiller les performances. Il garantit que l'IA fonctionne dans le temps, meme quand les donnees changent.",
            "Dans un projet concret, le MLE prend le relais apres la phase d'analyse et de modele. Il s'assure que le livrable est exploitable par l'entreprise : fiable, documente et maintenable.",
            "Il pense aussi a la securite, aux couts et aux performances. L'objectif est d'avoir une IA qui produit un resultat utile sans perturber l'organisation.",
            "Un MLE s'assure que le modele reste utile dans le temps : il mesure les derives, ajuste les versions et met en place des alertes. C'est ce travail qui rend un livrable vraiment fiable.",
          ],
          video: {
            label: "Google Developers – Machine Learning Engineer explained",
            url: "https://www.youtube.com/watch?v=Gv9_4yMHFhI",
          },
        },
        {
          title: "Collaboration des metiers",
          text: [
            "Ces metiers ne fonctionnent pas en silo. Un besoin reel traverse plusieurs competences : collecte, nettoyage, analyse, modele, mise en production. C'est une chaine.",
            "Un Data Analyst a besoin de donnees fiables du Data Engineer. Un Data Scientist a besoin d'analyses propres pour entrainer un modele. Un MLE a besoin d'un modele solide pour deployer.",
            "KORYXA organise cette collaboration pour transformer des besoins en missions claires. L'objectif est d'apprendre en produisant, mais aussi de livrer un resultat utile a l'organisation.",
            "C'est cette coordination qui fait la difference : chaque role se concentre sur sa responsabilite, mais le livrable final reste coherent, valide et exploitable.",
            "Quand la chaine est claire, les decisions sont plus rapides et les erreurs diminuent. La collaboration n'est pas une option : c'est la condition pour produire un resultat concret.",
          ],
          video: {
            label: "Machine Learnia – Data Analyst vs Data Scientist vs Data Engineer",
            url: "https://www.youtube.com/watch?v=Jt6yQ9Hq9nA",
          },
        },
      ],
      resources: { videos: [], articles: [] },
      quiz: [
        {
          prompt: "Le texte principal du module sert a :",
          options: ["Remplacer les videos", "Definir le contenu officiel", "Etre optionnel"],
          answerIndex: 1,
          explanation: "Le texte est la base officielle du module.",
        },
        {
          prompt: "Vrai ou faux : l'IA est un outil central pour cadrer un besoin.",
          options: ["Vrai", "Faux"],
          answerIndex: 0,
          explanation: "L'IA aide a structurer un probleme en mission claire.",
        },
        {
          prompt: "Quel role rend la data lisible pour la decision ?",
          options: ["Data Analyst", "Data Engineer", "Machine Learning Engineer"],
          answerIndex: 0,
          explanation: "Le Data Analyst transforme les donnees en insights.",
        },
        {
          prompt: "Un Data Engineer se concentre surtout sur :",
          options: ["Les pipelines et la qualite des donnees", "La mise en production des modeles", "La creation de slides"],
          answerIndex: 0,
          explanation: "Il construit les fondations data.",
        },
        {
          prompt: "Vrai ou faux : un Data Scientist doit toujours deployer le modele.",
          options: ["Vrai", "Faux"],
          answerIndex: 1,
          explanation: "Le deploiement est souvent gere par le MLE.",
        },
        {
          prompt: "Le MLE intervient principalement pour :",
          options: ["Industrialiser les modeles", "Nettoyer les donnees", "Faire du reporting"],
          answerIndex: 0,
          explanation: "Il rend le modele stable et utilisable.",
        },
        {
          prompt: "Une mission IA commence par :",
          options: ["Un besoin reel", "Un modele deja entraine", "Un logo"],
          answerIndex: 0,
          explanation: "Tout part d'un besoin concret.",
        },
        {
          prompt: "La collaboration des metiers est importante parce que :",
          options: ["Elle reduit les erreurs et clarifie le livrable", "Elle supprime les tests", "Elle evite le besoin de data"],
          answerIndex: 0,
          explanation: "Les roles s'enchainent pour livrer un resultat utilisable.",
        },
        {
          prompt: "Vrai ou faux : la video remplace le texte officiel.",
          options: ["Vrai", "Faux"],
          answerIndex: 1,
          explanation: "La video illustre, le texte explique.",
        },
        {
          prompt: "Quel element est obligatoire pour passer au module suivant ?",
          options: ["Le mini-test valide", "Avoir regarde toutes les videos", "Avoir telecharge un notebook"],
          answerIndex: 0,
          explanation: "La validation du mini-test est obligatoire.",
        },
      ],
    },
    {
      id: "python-data",
      title: "Bases Python pour la data",
      text: [
        "Python est la base du travail data moderne. On apprend ici les structures essentielles pour manipuler des donnees.",
        "Variables, conditions, boucles et fonctions sont les briques qui permettent d'automatiser l'analyse.",
        "On termine par une introduction a NumPy et Pandas pour traiter des tableaux de donnees.",
      ],
      resources: {
        videos: [
          { label: "Python pour debutants (YouTube)", url: "https://www.youtube.com/watch?v=rfscVS0vtbw" },
        ],
        articles: [
          { label: "Introduction a Pandas", url: "https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html" },
        ],
      },
      notebook: {
        title: "Notebook Python - bases",
        description: "Exemples simples sur variables, boucles et listes.",
        code: "names = [\"Awa\", \"Jean\", \"Mamadou\"]\nfor name in names:\n    print(f\"Bonjour {name}\")\n\nscores = [12, 15, 9, 18]\nprint(sum(scores) / len(scores))",
        download: "/downloads/python-bases.ipynb",
      },
      quiz: [
        {
          prompt: "Quel symbole sert a definir une fonction en Python ?",
          options: ["def", "func", "lambda"],
          answerIndex: 0,
          explanation: "On utilise le mot-cle def pour declarer une fonction.",
        },
        {
          prompt: "Vrai ou faux : une liste Python est ordonnee.",
          options: ["Vrai", "Faux"],
          answerIndex: 0,
          explanation: "Les listes conservent l'ordre des elements.",
        },
        {
          prompt: "Quel module est courant pour manipuler des tableaux numeriques ?",
          options: ["NumPy", "Requests", "Flask"],
          answerIndex: 0,
          explanation: "NumPy est la base pour les calculs numeriques.",
        },
        {
          prompt: "Quelle structure est ideale pour associer cle -> valeur ?",
          options: ["Liste", "Dictionnaire", "Tuple"],
          answerIndex: 1,
          explanation: "Les dictionnaires sont faits pour ca.",
        },
        {
          prompt: "Une boucle for sert a :",
          options: ["Executer une tache repetitive", "Declarer un module", "Sauver un fichier"],
          answerIndex: 0,
          explanation: "La boucle for repete une action sur une sequence.",
        },
      ],
    },
    {
      id: "manip-donnees",
      title: "Manipulation des donnees",
      text: [
        "Avant de produire un resultat, il faut comprendre et nettoyer les donnees.",
        "On apprend a lire des fichiers CSV, Excel et JSON, puis a corriger les erreurs.",
        "La qualite des donnees determine la qualite du livrable final.",
      ],
      resources: {
        videos: [
          { label: "Nettoyage de donnees avec Pandas", url: "https://www.youtube.com/watch?v=vmEHCJofslg" },
        ],
        articles: [
          { label: "Data cleaning basics", url: "https://towardsdatascience.com/data-cleaning-101-6dd1be3b8e8a" },
        ],
      },
      notebook: {
        title: "Notebook - nettoyage rapide",
        description: "Traitement des valeurs manquantes et doublons.",
        code: "import pandas as pd\n\ndf = pd.read_csv(\"data.csv\")\nprint(df.isna().sum())\n\ndf = df.drop_duplicates()\n\ndf[\"amount\"] = df[\"amount\"].fillna(df[\"amount\"].median())",
      },
      quiz: [
        {
          prompt: "Quelle est la premiere etape avant une analyse ?",
          options: ["Nettoyer les donnees", "Publier le rapport", "Entrainer un modele"],
          answerIndex: 0,
          explanation: "Les donnees doivent etre propres avant toute analyse.",
        },
        {
          prompt: "Vrai ou faux : un doublon peut fausser un tableau de bord.",
          options: ["Vrai", "Faux"],
          answerIndex: 0,
          explanation: "Les doublons biaisent les moyennes et comptages.",
        },
        {
          prompt: "Quel format est souvent utilise pour les donnees tabulaires ?",
          options: ["CSV", "MP4", "PNG"],
          answerIndex: 0,
          explanation: "CSV est un format simple et courant.",
        },
        {
          prompt: "Que faire avec des valeurs manquantes ?",
          options: ["Les ignorer toujours", "Les traiter ou les expliquer", "Les remplacer par du texte"],
          answerIndex: 1,
          explanation: "On decide selon le contexte : supprimer, imputer, etc.",
        },
        {
          prompt: "Quel outil facilite les jointures en Python ?",
          options: ["Pandas", "Docker", "Nginx"],
          answerIndex: 0,
          explanation: "Pandas propose merge et join pour combiner des tables.",
        },
      ],
    },
    {
      id: "sql-bases",
      title: "Bases SQL",
      text: [
        "SQL permet d'interroger et structurer des bases de donnees.",
        "On y retrouve les requetes essentielles : SELECT, WHERE, JOIN, GROUP BY.",
        "Le but est de passer d'une question business a une requete claire.",
      ],
      resources: {
        videos: [
          { label: "SQL pour debutants", url: "https://www.youtube.com/watch?v=HXV3zeQKqGY" },
        ],
        articles: [
          { label: "SQL basics cheat sheet", url: "https://www.sqltutorial.org/sql-cheat-sheet/" },
        ],
      },
      quiz: [
        {
          prompt: "Quelle clause sert a filtrer les resultats ?",
          options: ["WHERE", "ORDER", "FROM"],
          answerIndex: 0,
          explanation: "WHERE filtre les lignes selon une condition.",
        },
        {
          prompt: "Vrai ou faux : JOIN sert a fusionner des tables.",
          options: ["Vrai", "Faux"],
          answerIndex: 0,
          explanation: "JOIN combine des tables sur une cle.",
        },
        {
          prompt: "Quel mot-cle sert a compter ?",
          options: ["COUNT", "SUM", "AVG"],
          answerIndex: 0,
          explanation: "COUNT compte le nombre de lignes.",
        },
        {
          prompt: "GROUP BY sert a :",
          options: ["Classer par groupes", "Supprimer des lignes", "Importer un fichier"],
          answerIndex: 0,
          explanation: "Il regroupe les lignes avant agregation.",
        },
        {
          prompt: "Un resultat SQL doit etre :",
          options: ["Lisible", "Opaque", "Sans structure"],
          answerIndex: 0,
          explanation: "On vise des resultats clairs et interpretable.",
        },
      ],
    },
    {
      id: "visualisation",
      title: "Visualisation des donnees",
      text: [
        "Une bonne visualisation transforme les donnees en decisions.",
        "On apprend a choisir le bon graphique, et a expliquer ce qu'on montre.",
        "Le but est de rendre l'information compréhensible en quelques secondes.",
      ],
      resources: {
        videos: [
          { label: "Data viz basics", url: "https://www.youtube.com/watch?v=6V5pZl1b5wM" },
        ],
        articles: [
          { label: "Guide des graphiques", url: "https://www.data-to-viz.com/" },
        ],
      },
      quiz: [
        {
          prompt: "Quel graphique est adapte pour une evolution dans le temps ?",
          options: ["Courbe", "Camembert", "Table brute"],
          answerIndex: 0,
          explanation: "Une courbe montre une evolution.",
        },
        {
          prompt: "Vrai ou faux : un graphique doit etre lisible sans legenda complexe.",
          options: ["Vrai", "Faux"],
          answerIndex: 0,
          explanation: "On vise la clarté immediatement.",
        },
        {
          prompt: "Quel outil est souvent utilise pour les dashboards ?",
          options: ["Power BI", "Word", "Notepad"],
          answerIndex: 0,
          explanation: "Power BI est un outil de BI courant.",
        },
        {
          prompt: "Une bonne visualisation doit :",
          options: ["Raconter une histoire claire", "Multiplier les couleurs", "Eviter le contexte"],
          answerIndex: 0,
          explanation: "Elle explique une histoire simplement.",
        },
        {
          prompt: "Un histogramme sert a :",
          options: ["Voir une distribution", "Dessiner une carte", "Coder un algorithme"],
          answerIndex: 0,
          explanation: "Histogramme = distribution des valeurs.",
        },
      ],
    },
    {
      id: "projet-synthese",
      title: "Projet commun de synthese",
      text: [
        "Ce projet rassemble les competences apprises. Vous traitez un besoin simple de bout en bout.",
        "Le livrable final doit etre clair, documente et reutilisable par une organisation.",
        "C'est la validation du parcours fondamental.",
      ],
      resources: {
        videos: [
          { label: "Exemple de projet data", url: "https://www.youtube.com/watch?v=ua-CiDNNj30" },
        ],
        articles: [
          { label: "Comment structurer un livrable data", url: "https://towardsdatascience.com/how-to-structure-a-data-project-3f5f3c3f3b21" },
        ],
      },
      quiz: [
        {
          prompt: "Un livrable data doit contenir :",
          options: ["Contexte, methode, resultats", "Uniquement des graphiques", "Aucune explication"],
          answerIndex: 0,
          explanation: "Le contexte et la methodologie sont essentiels.",
        },
        {
          prompt: "Vrai ou faux : un projet final peut rester non documente.",
          options: ["Vrai", "Faux"],
          answerIndex: 1,
          explanation: "La documentation est indispensable.",
        },
        {
          prompt: "L'objectif du projet commun est :",
          options: ["Valider les acquis", "Faire du marketing", "Ecrire du code sans but"],
          answerIndex: 0,
          explanation: "Le projet confirme les competences acquises.",
        },
        {
          prompt: "Un livrable exploitable doit etre :",
          options: ["Clair et reutilisable", "Complexe", "Sans sources"],
          answerIndex: 0,
          explanation: "On vise l'utilisabilite.",
        },
        {
          prompt: "Une conclusion doit rappeler :",
          options: ["Les resultats et recommandations", "La liste des outils", "Les erreurs uniquement"],
          answerIndex: 0,
          explanation: "On synthétise résultats et prochaines etapes.",
        },
      ],
    },
  ],
};

export const specialisations: Record<string, ProgramContent> = {
  "data-analyst": {
    id: "data-analyst",
    title: "Specialisation Data Analyst",
    objective: "Approfondir l'analyse, la visualisation et la communication data.",
    duration: "4–6 semaines",
    modules: [
      {
        id: "analyse-avancee",
        title: "Analyse avancee",
        text: [
          "On apprend a structurer une analyse de bout en bout avec des questions claires.",
          "L'objectif est de produire des recommandations directement exploitables.",
        ],
        resources: {
          videos: [
            { label: "Analyse exploratoire", url: "https://www.youtube.com/watch?v=vmEHCJofslg" },
          ],
          articles: [
            { label: "EDA guide", url: "https://towardsdatascience.com/exploratory-data-analysis-8fc1cb20fd15" },
          ],
        },
        quiz: [
          {
            prompt: "Une analyse avancee commence par :",
            options: ["Une question claire", "Un graphique final", "Un outil"],
            answerIndex: 0,
            explanation: "La question guide l'analyse.",
          },
          {
            prompt: "Vrai ou faux : un DA doit expliquer les hypotheses.",
            options: ["Vrai", "Faux"],
            answerIndex: 0,
            explanation: "Les hypotheses donnent le contexte.",
          },
          {
            prompt: "Un insight utile est :",
            options: ["Actionnable", "Decoration", "Sans contexte"],
            answerIndex: 0,
            explanation: "Un insight doit permettre une action.",
          },
          {
            prompt: "La qualite d'un dashboard depend de :",
            options: ["La lisibilite", "Le nombre de couleurs", "Le volume de texte"],
            answerIndex: 0,
            explanation: "La clarté est essentielle.",
          },
          {
            prompt: "Une recommandation doit etre :",
            options: ["Specifique", "Vague", "Ignorable"],
            answerIndex: 0,
            explanation: "Elle doit etre precise et mesurable.",
          },
        ],
      },
      {
        id: "dashboards",
        title: "Dashboards clairs",
        text: [
          "On transforme des analyses en tableaux de bord lisibles.",
          "L'accent est mis sur la hierarchie visuelle et la narration.",
        ],
        resources: {
          videos: [
            { label: "Construire un dashboard utile", url: "https://www.youtube.com/watch?v=6V5pZl1b5wM" },
          ],
          articles: [
            { label: "Dashboard design", url: "https://www.nngroup.com/articles/dashboard-design/" },
          ],
        },
        quiz: [
          {
            prompt: "Un KPI prioritaire doit etre :",
            options: ["Visible en premier", "Cache", "Ignore"],
            answerIndex: 0,
            explanation: "On met en avant l'essentiel.",
          },
          {
            prompt: "Vrai ou faux : trop de graphiques nuit a la lecture.",
            options: ["Vrai", "Faux"],
            answerIndex: 0,
            explanation: "Moins mais mieux.",
          },
          {
            prompt: "Un dashboard doit repondre a :",
            options: ["Des questions business", "Des preferences perso", "Une mode"],
            answerIndex: 0,
            explanation: "Il sert la decision.",
          },
          {
            prompt: "La couleur sert a :",
            options: ["Mettre en avant", "Remplir l'espace", "Distraire"],
            answerIndex: 0,
            explanation: "Elle guide l'oeil.",
          },
          {
            prompt: "Une bonne visualisation est :",
            options: ["Simple", "Chargee", "Opaque"],
            answerIndex: 0,
            explanation: "La simplicité prime.",
          },
        ],
      },
    ],
  },
  "data-engineer": {
    id: "data-engineer",
    title: "Specialisation Data Engineer",
    objective: "Construire des pipelines fiables et une data utilisable.",
    duration: "4–6 semaines",
    modules: [
      {
        id: "pipelines",
        title: "Pipelines et flux",
        text: [
          "On apprend a structurer un flux de donnees fiable, de la source au stockage.",
          "L'objectif est de garantir la qualite et la disponibilite des donnees.",
        ],
        resources: {
          videos: [
            { label: "Intro pipelines data", url: "https://www.youtube.com/watch?v=0ZonECN6vA8" },
          ],
          articles: [
            { label: "Data pipeline basics", url: "https://www.oracle.com/data-pipeline/" },
          ],
        },
        quiz: [
          {
            prompt: "Un pipeline sert a :",
            options: ["Automatiser les flux", "Dessiner un schema", "Cacher les donnees"],
            answerIndex: 0,
            explanation: "Il automatise la circulation des donnees.",
          },
          {
            prompt: "Vrai ou faux : la qualite des donnees est secondaire.",
            options: ["Vrai", "Faux"],
            answerIndex: 1,
            explanation: "La qualité est critique.",
          },
          {
            prompt: "Un ETL signifie :",
            options: ["Extraire, Transformer, Charger", "Executer, Tester, Livrer", "Evaluer, Trier, Lister"],
            answerIndex: 0,
            explanation: "ETL est la base des pipelines.",
          },
          {
            prompt: "La supervision sert a :",
            options: ["Detecter les erreurs", "Ignorer les logs", "Ajouter des couleurs"],
            answerIndex: 0,
            explanation: "On surveille les flux.",
          },
          {
            prompt: "Une source fiable est :",
            options: ["Documentee", "Anonyme", "Non verifiee"],
            answerIndex: 0,
            explanation: "La documentation garantit la confiance.",
          },
        ],
      },
      {
        id: "data-quality",
        title: "Qualite et monitoring",
        text: [
          "On met en place des controles pour assurer la coherence.",
          "L'objectif est d'eviter les erreurs silencieuses.",
        ],
        resources: {
          videos: [
            { label: "Data quality checks", url: "https://www.youtube.com/watch?v=1s1k8_3bRj8" },
          ],
          articles: [
            { label: "Data quality basics", url: "https://www.databricks.com/glossary/data-quality" },
          ],
        },
        quiz: [
          {
            prompt: "Un controle de qualite detecte :",
            options: ["Les anomalies", "Les logos", "Les slides"],
            answerIndex: 0,
            explanation: "Il identifie les valeurs anormales.",
          },
          {
            prompt: "Vrai ou faux : un monitoring peut etre automatise.",
            options: ["Vrai", "Faux"],
            answerIndex: 0,
            explanation: "Oui, via alertes et logs.",
          },
          {
            prompt: "Une alerte doit etre :",
            options: ["Claire", "Ambigue", "Ignorable"],
            answerIndex: 0,
            explanation: "Elle doit être actionnable.",
          },
          {
            prompt: "Le but est de :",
            options: ["Prevenir les erreurs", "Cacher les erreurs", "Augmenter la complexite"],
            answerIndex: 0,
            explanation: "On veut prevenir.",
          },
          {
            prompt: "Un bon pipeline est :",
            options: ["Documente", "Opaque", "Non verifie"],
            answerIndex: 0,
            explanation: "Documenter est essentiel.",
          },
        ],
      },
    ],
  },
  "data-scientist": {
    id: "data-scientist",
    title: "Specialisation Data Scientist",
    objective: "Construire des modeles interpretable et utiles.",
    duration: "4–6 semaines",
    modules: [
      {
        id: "modele-simple",
        title: "Modeles predictifs simples",
        text: [
          "On commence par des modeles interpretable pour expliquer les resultats.",
          "L'objectif est de predire sans perdre la comprehension.",
        ],
        resources: {
          videos: [
            { label: "Intro modeles ML", url: "https://www.youtube.com/watch?v=Gv9_4yMHFhI" },
          ],
          articles: [
            { label: "Modeles interpretable", url: "https://christophm.github.io/interpretable-ml-book/" },
          ],
        },
        quiz: [
          {
            prompt: "Un modele interpretable est :",
            options: ["Explicable", "Opaque", "Aleatoire"],
            answerIndex: 0,
            explanation: "On cherche a expliquer les resultats.",
          },
          {
            prompt: "Vrai ou faux : les donnees entrainent le modele.",
            options: ["Vrai", "Faux"],
            answerIndex: 0,
            explanation: "Le modele apprend sur les donnees.",
          },
          {
            prompt: "Une variable importante est :",
            options: ["Celle qui influence la prediction", "Celle qui est jolie", "Celle qui manque"],
            answerIndex: 0,
            explanation: "Elle influence la sortie.",
          },
          {
            prompt: "Le sur-apprentissage signifie :",
            options: ["Trop coller aux donnees d'entrainement", "Manque de donnees", "Absence de modele"],
            answerIndex: 0,
            explanation: "Le modele generalise mal.",
          },
          {
            prompt: "Un bon modele doit etre :",
            options: ["Teste", "Devine", "Cache"],
            answerIndex: 0,
            explanation: "On evalue sa performance.",
          },
        ],
      },
      {
        id: "evaluation",
        title: "Evaluation et interpretation",
        text: [
          "On apprend a mesurer la performance et a expliquer les predictions.",
          "Les metriques doivent etre choisies selon le probleme.",
        ],
        resources: {
          videos: [
            { label: "Metriques ML simples", url: "https://www.youtube.com/watch?v=5JGQ2U8J1x4" },
          ],
          articles: [
            { label: "Precision, recall, F1", url: "https://towardsdatascience.com/precision-recall-and-f1-score-5265c325c52f" },
          ],
        },
        quiz: [
          {
            prompt: "Une metrique sert a :",
            options: ["Evaluer un modele", "Dessiner un graphique", "Nettoyer une base"],
            answerIndex: 0,
            explanation: "On mesure la performance.",
          },
          {
            prompt: "Vrai ou faux : la precision suffit toujours.",
            options: ["Vrai", "Faux"],
            answerIndex: 1,
            explanation: "On choisit la metrique selon le contexte.",
          },
          {
            prompt: "Recall mesure :",
            options: ["La capacite a trouver les bons cas", "La taille d'un fichier", "Le temps de calcul"],
            answerIndex: 0,
            explanation: "Recall = detection des vrais positifs.",
          },
          {
            prompt: "Un seuil permet de :",
            options: ["Decider de la classe", "Changer les donnees", "Supprimer les metriques"],
            answerIndex: 0,
            explanation: "Il decide classification.",
          },
          {
            prompt: "Un modele doit etre :",
            options: ["Interpretable", "Secret", "Imprevisible"],
            answerIndex: 0,
            explanation: "On explique la sortie.",
          },
        ],
      },
    ],
  },
  "machine-learning-engineer": {
    id: "machine-learning-engineer",
    title: "Specialisation Machine Learning Engineer",
    objective: "Industrialiser des modeles et assurer leur fiabilite.",
    duration: "4–6 semaines",
    modules: [
      {
        id: "deploiement",
        title: "Deploiement de modeles",
        text: [
          "On apprend a transformer un modele en service utilisable.",
          "L'objectif est de garantir robustesse et performance.",
        ],
        resources: {
          videos: [
            { label: "ML deployment basics", url: "https://www.youtube.com/watch?v=1nE5rp8da9I" },
          ],
          articles: [
            { label: "MLOps basics", url: "https://www.databricks.com/glossary/mlops" },
          ],
        },
        quiz: [
          {
            prompt: "Deployer un modele signifie :",
            options: ["Le rendre utilisable en production", "L'archiver", "Le supprimer"],
            answerIndex: 0,
            explanation: "Le modele devient un service.",
          },
          {
            prompt: "Vrai ou faux : on doit monitorer un modele en production.",
            options: ["Vrai", "Faux"],
            answerIndex: 0,
            explanation: "Le monitoring detecte les derives.",
          },
          {
            prompt: "La latence concerne :",
            options: ["Le temps de reponse", "La taille du code", "Le type de modele"],
            answerIndex: 0,
            explanation: "Latence = temps de reponse.",
          },
          {
            prompt: "Un service ML doit etre :",
            options: ["Fiable", "Imprevisible", "Invisible"],
            answerIndex: 0,
            explanation: "Fiabilite et robustesse.",
          },
          {
            prompt: "MLOps sert a :",
            options: ["Gerer le cycle de vie ML", "Dessiner des logos", "Changer la langue"],
            answerIndex: 0,
            explanation: "MLOps gere le cycle ML.",
          },
        ],
      },
      {
        id: "qualite-modeles",
        title: "Qualite et validation des modeles",
        text: [
          "On met en place des controles de performance et de biais.",
          "Le but est de garantir des resultats fiables.",
        ],
        resources: {
          videos: [
            { label: "Validation ML", url: "https://www.youtube.com/watch?v=3CC4N4z3Gyo" },
          ],
          articles: [
            { label: "Model validation guide", url: "https://developers.google.com/machine-learning/crash-course/validation/overview" },
          ],
        },
        quiz: [
          {
            prompt: "Une validation sert a :",
            options: ["Verifier la performance", "Ignorer les resultats", "Changer les donnees"],
            answerIndex: 0,
            explanation: "On verifie la qualite.",
          },
          {
            prompt: "Vrai ou faux : un biais doit etre mesure.",
            options: ["Vrai", "Faux"],
            answerIndex: 0,
            explanation: "Mesurer les biais est essentiel.",
          },
          {
            prompt: "Un modele degrade signifie :",
            options: ["Baisse de performance", "Plus de vitesse", "Moins de donnees"],
            answerIndex: 0,
            explanation: "La performance baisse.",
          },
          {
            prompt: "Le monitoring detecte :",
            options: ["Les derives", "Les logos", "Les couleurs"],
            answerIndex: 0,
            explanation: "Monitoring = detection des derives.",
          },
          {
            prompt: "Le but final est :",
            options: ["Resultats fiables", "Mystere", "Chaos"],
            answerIndex: 0,
            explanation: "On vise la fiabilite.",
          },
        ],
      },
    ],
  },
};

export const MIN_PASS_PERCENT = 70;

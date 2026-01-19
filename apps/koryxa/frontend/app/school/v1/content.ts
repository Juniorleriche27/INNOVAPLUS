export type ResourceLink = { label: string; url: string; description?: string };
export type SectionVideo = { title?: string; label?: string; url: string; lang?: "fr" | "en"; tag?: string };
export type SectionAction = { label: string; href: string; external?: boolean };
export type DatasetInfo = {
  label: string;
  url: string;
  rows: number;
  size: string;
  updatedAt: string;
  columns: { name: string; description: string }[];
};
export type ModuleSection = {
  title: string;
  text: string[];
  video?: SectionVideo;
  videos?: SectionVideo[];
  articles?: ResourceLink[];
  actions?: SectionAction[];
  dataset?: DatasetInfo;
};
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
  advancedTest?: { href: string; minScore: number; questions: number };
  requireReadingConfirmation?: boolean;
  requireNotebookConfirmation?: boolean;
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
          videos: [
            {
              title: "Difference Data Analyst / Data Scientist / Data Engineer",
              url: "https://www.youtube.com/watch?v=dlSyb_spQCA",
              lang: "fr",
            },
            {
              title: "Data Scientist vs Data Analyst vs Data Engineer",
              url: "https://www.youtube.com/watch?v=mEZIHFxUFEc",
              lang: "fr",
            },
            {
              title: "Data Roles Explained in 3 Minutes",
              url: "https://www.youtube.com/watch?v=8qSwh_r6wg8",
              lang: "en",
            },
            {
              title: "Data Analyst vs Data Engineer vs Data Scientist (2025)",
              url: "https://www.youtube.com/watch?v=YJCeA8cUC90",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "APEC (PDF) – Les metiers de la data",
              url: "https://corporate.apec.fr/files/live/sites/corporate/files/Nos%20%C3%A9tudes/pdf/Les-metiers-de-la-data.pdf",
              description: "Panorama officiel des metiers data.",
            },
            {
              label: "France Travail – Les metiers de la data",
              url: "https://www.francetravail.fr/actualites/le-dossier/les-metiers-de-demain/les-metiers-de-la-data.html",
              description: "Dossier de reference sur les roles data.",
            },
          ],
        },
        {
          title: "Data Analyst",
          text: [
            "Le Data Analyst est le role qui rend la data lisible. Son travail consiste a transformer des donnees brutes en informations utiles pour la decision. Il structure des tableaux de bord, identifie des tendances, et explique ce que les chiffres veulent dire pour l'organisation.",
            "Un bon Data Analyst ne se limite pas a produire un graphique. Il commence par une question claire : \"Pourquoi nos ventes baissent dans telle region ?\", \"Quels produits se vendent le mieux ?\", \"Quelle campagne marketing a le plus d'impact ?\" Ensuite, il collecte les donnees, les nettoie, puis construit une analyse qui repond au besoin.",
            "Le Data Analyst travaille sur des cas reels : reporting, suivi de performance, segmentation client, analyse de couts. Il sert d'interface entre la data et les equipes operationnelles. C'est souvent le premier role data dans une entreprise qui veut progresser vers l'IA.",
            "Dans une mission KORYXA, le Data Analyst pose le cadre du livrable : quels indicateurs suivre, quels niveaux de detail, et quelles actions en sortent. Son travail doit etre clair, lisible et directement utilisable par l'organisation.",
          ],
          videos: [
            {
              title: "Valentin, Data analyst, presente son metier",
              url: "https://www.youtube.com/watch?v=cP4DTLbp38A",
              lang: "fr",
            },
            {
              title: "What Does a Data Analyst Do?",
              url: "https://www.youtube.com/watch?v=mCSbYbXWmH0",
              lang: "en",
            },
            {
              title: "What Does a Data Analyst Actually Do?",
              url: "https://www.youtube.com/watch?v=ywZXpfdqg1o",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "APEC – Data analyst (fiche metier)",
              url: "https://www.apec.fr/tous-nos-metiers/informatique/data-analyst.html",
              description: "Fiche metier officielle.",
            },
            {
              label: "Onisep – Data analyst (analyste de donnees)",
              url: "https://www.onisep.fr/ressources/univers-metier/metiers/data-analyst-analyste-de-donnees",
              description: "Presentation du metier et des competences.",
            },
            {
              label: "France Travail (MetierScope) – Data analyst",
              url: "https://candidat.francetravail.fr/metierscope/fiche-metier/M1419/data-analyst",
              description: "Fiche metier et missions.",
            },
            {
              label: "Coursera – What does a data analyst do?",
              url: "https://www.coursera.org/articles/what-does-a-data-analyst-do",
              description: "Point de vue international.",
            },
          ],
        },
        {
          title: "Data Engineer",
          text: [
            "Le Data Engineer construit les fondations. Il cree les pipelines qui collectent, stockent et preparent les donnees. Sans lui, pas de data fiable pour l'analyse ou l'IA.",
            "Son travail est technique, mais essentiel : connecter des sources, automatiser les flux, assurer la qualite. Il met en place des bases de donnees, organise les schemas, et garantit que les donnees sont disponibles quand l'organisation en a besoin.",
            "Dans un besoin reel, le Data Engineer intervient des le debut : il transforme un probleme flou en flux clair. Exemple : une entreprise a des donnees disperses. Le Data Engineer les rassemble, les structure, puis les rend exploitables pour le reste de l'equipe.",
            "Le Data Engineer assure aussi la durabilite : un pipeline bien concu evite les erreurs silencieuses et facilite le passage a l'echelle. C'est la difference entre un test ponctuel et un systeme qui fonctionne chaque semaine.",
          ],
          videos: [
            {
              title: "Qu'est-ce que le Data Engineering ? (Willis / Data From Scratch)",
              url: "https://www.youtube.com/watch?v=hvWKLij_NAE",
              lang: "fr",
            },
            {
              title: "La verite sur le metier de Data Engineer (Wild Code School)",
              url: "https://www.youtube.com/watch?v=m7hgJRM39T8",
              lang: "fr",
            },
            {
              title: "What Does a Data Engineer Do? Explained Simply",
              url: "https://www.youtube.com/watch?v=JUws0cMnL78",
              lang: "en",
            },
            {
              title: "What is a Data Engineer (in 3 minutes)",
              url: "https://www.youtube.com/watch?v=D1V6t--9tt8",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "APEC – Data engineer (fiche metier)",
              url: "https://www.apec.fr/tous-nos-metiers/informatique/data-engineer.html",
              description: "Fiche metier officielle.",
            },
            {
              label: "Coursera – What Is a Data Engineer?",
              url: "https://www.coursera.org/articles/what-does-a-data-engineer-do-and-how-do-i-become-one",
              description: "Vue internationale et competences.",
            },
          ],
        },
        {
          title: "Data Scientist",
          text: [
            "Le Data Scientist cree des modeles pour expliquer ou predire. Il utilise des methodes statistiques et des algorithmes pour repondre a des questions avancees : prevoir une demande, detecter une anomalie, recommander une action.",
            "Il commence toujours par un besoin clair. Exemple : \"Quels clients risquent de partir ?\", \"Comment optimiser une chaine logistique ?\" Il construit un modele, le teste, puis explique les resultats. Ce travail demande rigueur et interpretation.",
            "L'IA est au coeur du metier de Data Scientist, mais elle reste un outil. L'objectif n'est pas de faire un modele impressionnant, mais un modele utile. Un bon Data Scientist traduit la complexite en decisions simples.",
            "Dans une mission, il documente les hypotheses, les limites et les risques. Cela permet a l'entreprise de comprendre pourquoi le modele fonctionne, et dans quels cas il ne doit pas etre utilise.",
          ],
          videos: [
            {
              title: "Que fait un Data Scientist ? (DataScientest)",
              url: "https://www.youtube.com/watch?v=ixVR8uPetHQ",
              lang: "fr",
            },
            {
              title: "What Does a Data Scientist Actually Do?",
              url: "https://www.youtube.com/watch?v=XWetgrNas-k",
              lang: "en",
            },
            {
              title: "What Does a Data Scientist Actually Do?",
              url: "https://www.youtube.com/watch?v=umI0DpJEqPE",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "APEC – Data scientist (fiche metier)",
              url: "https://www.apec.fr/tous-nos-metiers/informatique/data-scientist.html",
              description: "Fiche metier officielle.",
            },
            {
              label: "BLS – Data Scientists",
              url: "https://www.bls.gov/ooh/math/data-scientists.htm",
              description: "Perspective internationale (US).",
            },
            {
              label: "O*NET – Data Scientists (15-2051.00)",
              url: "https://www.onetonline.org/link/summary/15-2051.00",
              description: "Base de reference sur les taches et competences.",
            },
            {
              label: "France Travail (MetierScope) – Data scientist",
              url: "https://candidat.francetravail.fr/metierscope/fiche-metier/M1405/data-scientist",
              description: "Fiche metier et missions.",
            },
          ],
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
          videos: [
            {
              title: "C'est quoi un Ingenieur Machine Learning ?",
              url: "https://www.youtube.com/watch?v=6Af5NBllnXo",
              lang: "fr",
            },
            {
              title: "Decouvrez le metier du Machine Learning Engineer",
              url: "https://www.youtube.com/watch?v=cuFxq-SEZm4",
              lang: "fr",
            },
            {
              title: "What is a Machine Learning Engineer",
              url: "https://www.youtube.com/watch?v=GDCnydDWRnM",
              lang: "en",
            },
            {
              title: "What I actually do as a Machine Learning Engineer",
              url: "https://www.youtube.com/watch?v=PFbXCIMlfc8",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "DataScientest – Machine Learning Engineer : tout savoir",
              url: "https://datascientest.com/machine-learning-engineer-tout-savoir",
              description: "Presentation claire du metier en francais.",
            },
            {
              label: "Coursera – Machine Learning Engineer",
              url: "https://www.coursera.org/articles/machine-learning-engineer",
              description: "Vue internationale et competences.",
            },
          ],
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
          videos: [
            {
              title: "Data Engineer vs Data Analyst vs Data Scientist : quelles differences ?",
              url: "https://www.youtube.com/watch?v=1pARcazj-Mc",
              lang: "fr",
            },
            {
              title: "Differences entre metiers data (francais)",
              url: "https://www.youtube.com/watch?v=dlSyb_spQCA",
              lang: "fr",
            },
            {
              title: "Data Engineer vs Data Analyst vs Data Scientist",
              url: "https://www.youtube.com/watch?v=0tuMz6RWGJA",
              lang: "en",
            },
            {
              title: "What's the difference between analyst/engineer/scientist",
              url: "https://www.youtube.com/watch?v=ZyRH6FMcVlw",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "APEC (PDF) – Les metiers de la data",
              url: "https://corporate.apec.fr/files/live/sites/corporate/files/Nos%20%C3%A9tudes/pdf/Les-metiers-de-la-data.pdf",
              description: "Panorama officiel des metiers data.",
            },
            {
              label: "France Travail – Les metiers de la data",
              url: "https://www.francetravail.fr/actualites/le-dossier/les-metiers-de-demain/les-metiers-de-la-data.html",
              description: "Dossier de reference sur les roles data.",
            },
          ],
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
      text: [],
      sections: [
        {
          title: "Installation + environnement",
          text: [
            "Python est aujourd'hui le langage central des metiers de la data et de l'intelligence artificielle. Son succes ne repose pas sur un effet de mode, mais sur sa capacite a repondre efficacement a des besoins concrets : analyser des donnees, automatiser des traitements, construire des modeles et deployer des solutions exploitables. Contrairement a d'autres langages plus complexes ou plus rigides, Python privilegie la lisibilite et la simplicite, ce qui permet de se concentrer sur le raisonnement plutot que sur la syntaxe.",
            "Dans les metiers de la data, Python n'est pas appris pour \"savoir coder\", mais pour produire. Un Data Analyst l'utilise pour nettoyer et analyser des donnees. Un Data Engineer s'en sert pour automatiser des pipelines. Un Data Scientist l'emploie pour modeliser et experimenter. Un Machine Learning Engineer l'utilise pour integrer des modeles dans des applications reelles. Autrement dit, Python est un outil transversal, au coeur de toute la chaine data.",
            "Ce module pose les bases indispensables. Il ne vise pas a faire de toi un developpeur logiciel, mais a te donner une maitrise fonctionnelle de Python orientee donnees. Tu apprendras a manipuler des variables, a structurer des donnees, a ecrire des conditions et des boucles, et a comprendre les bibliotheques fondamentales utilisees en data. Ces bases sont indispensables : sans elles, il est impossible de comprendre les modules suivants consacres a la manipulation de donnees, au SQL, ou a la visualisation.",
            "Chez KORYXA School, Python est aborde comme un langage de resolution de problemes. Chaque concept presente dans ce module correspond a un usage reel dans un projet data. L'objectif n'est pas d'accumuler des notions abstraites, mais de construire progressivement une logique de travail claire, reutilisable et orientee livrables.",
            "Pour pratiquer immediatement, tu dois disposer d'un environnement simple : Python installe, un editeur (VS Code) et un notebook (Jupyter) ou un IDE. Les videos suivantes te montrent comment installer rapidement un environnement propre pour commencer a coder sans blocage.",
          ],
          videos: [
            {
              title: "Installer Python pour Windows",
              url: "https://www.youtube.com/watch?v=IS117_uXZKE",
              lang: "fr",
            },
            {
              title: "Installer Python + Anaconda + Jupyter",
              url: "https://www.youtube.com/watch?v=a_WIamEXeuw",
              lang: "fr",
            },
            {
              title: "Prise en main Anaconda/Jupyter",
              url: "https://www.youtube.com/watch?v=0TJO-2EKyns",
              lang: "fr",
            },
            {
              title: "Install & Setup (Corey Schafer)",
              url: "https://www.youtube.com/watch?v=YYXdXT2l-Gg",
              lang: "en",
            },
            {
              title: "Python Full Course (4h)",
              url: "https://www.youtube.com/watch?v=Xd6IUafGFRA",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Tutoriel Python officiel (FR)",
              url: "https://docs.python.org/fr/3/tutorial/",
              description: "Documentation officielle pour demarrer.",
            },
            {
              label: "Python Tutorial officiel (EN)",
              url: "https://docs.python.org/3/tutorial/",
              description: "Documentation officielle en anglais.",
            },
            {
              label: "Installing Python (EN)",
              url: "https://www.python.org/downloads/",
              description: "Telechargement officiel de Python.",
            },
          ],
        },
        {
          title: "Variables, types et operations",
          text: [
            "En Python, une variable permet de stocker une information afin de la reutiliser ou de la transformer. Contrairement a d'autres langages, Python n'exige pas de declarer explicitement le type d'une variable. Le type est determine automatiquement en fonction de la valeur assignee. Cette flexibilite rend le langage accessible, mais elle impose aussi de bien comprendre les types de donnees pour eviter des erreurs logiques.",
            "Les types de base les plus utilises en data sont les entiers (int), les nombres decimaux (float), les chaines de caracteres (str) et les booleens (bool). Chaque type a un role precis. Par exemple, les entiers servent souvent a representer des quantites, les floats des mesures, les chaines du texte, et les booleens des conditions logiques. Une mauvaise comprehension des types peut conduire a des calculs errones ou a des analyses incoherentes.",
            "Dans un projet data reel, savoir identifier et manipuler correctement les types est essentiel, notamment lors du nettoyage des donnees ou de la lecture de fichiers externes. Cette partie constitue donc une base fondamentale pour tout le reste du parcours.",
          ],
          videos: [
            {
              title: "Variables (Graven)",
              url: "https://www.youtube.com/watch?v=nvyX8JfoOWY",
              lang: "fr",
            },
            {
              title: "Variables & bases orientees data (Data Analyst avec Python)",
              url: "https://www.youtube.com/watch?v=oc9zGRIhHbs",
              lang: "fr",
            },
            {
              title: "Learn Python (FreeCodeCamp – bases)",
              url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
              lang: "en",
            },
            {
              title: "Integers & Floats (Corey Schafer)",
              url: "https://www.youtube.com/watch?v=khKv-8q7YmY",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Intro (docs Python FR)",
              url: "https://docs.python.org/fr/3/tutorial/introduction.html",
              description: "Introduction officielle en francais.",
            },
            {
              label: "Intro (docs Python EN)",
              url: "https://docs.python.org/3/tutorial/introduction.html",
              description: "Introduction officielle en anglais.",
            },
          ],
        },
        {
          title: "Conditions et boucles",
          text: [
            "Les conditions permettent a un programme de prendre des decisions. En data, elles sont omnipresentes : filtrer des lignes, appliquer des regles metier, classer des observations ou declencher des actions specifiques. La structure if / elif / else permet d'executer un bloc de code uniquement si une condition est remplie.",
            "Comprendre la logique conditionnelle est indispensable pour transformer des donnees brutes en informations exploitables. Par exemple, une condition peut servir a identifier des clients a risque, a separer des categories ou a verifier la validite d'une donnee. Une condition mal formulee peut fausser toute une analyse.",
            "Les boucles servent a repeter automatiquement une operation sur un ensemble d'elements. En data, elles permettent de parcourir des listes, de traiter des fichiers ligne par ligne ou d'appliquer un calcul a plusieurs observations. Python propose principalement deux types de boucles : for et while.",
            "La boucle for est la plus utilisee en data, car elle permet de parcourir directement des collections de donnees. La boucle while est plus generale, mais doit etre utilisee avec prudence pour eviter les boucles infinies. Comprendre quand et comment utiliser chaque type de boucle est essentiel pour ecrire des scripts efficaces et lisibles.",
            "Meme si certaines bibliotheques data reduisent l'usage explicite des boucles, leur comprehension reste indispensable pour lire, comprendre et maintenir du code existant.",
          ],
          videos: [
            {
              title: "Les conditions (Graven)",
              url: "https://www.youtube.com/watch?v=_AgUOsvMt8s",
              lang: "fr",
            },
            {
              title: "Les boucles (Graven)",
              url: "https://www.youtube.com/watch?v=BrknhzrHm8w",
              lang: "fr",
            },
            {
              title: "Boucles for & while (science)",
              url: "https://www.youtube.com/watch?v=Y0WaEU-9W_8",
              lang: "fr",
            },
            {
              title: "Conditionals (Corey Schafer)",
              url: "https://www.youtube.com/watch?v=DZwmZ8Usvnk",
              lang: "en",
            },
            {
              title: "Loops & Iterations (Corey Schafer)",
              url: "https://www.youtube.com/watch?v=6iF8Xb7Z3wQ",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Controle du flux (docs Python FR)",
              url: "https://docs.python.org/fr/3/tutorial/controlflow.html",
              description: "Conditions et boucles en francais.",
            },
            {
              label: "Control Flow (docs Python EN)",
              url: "https://docs.python.org/3/tutorial/controlflow.html",
              description: "Conditions et boucles en anglais.",
            },
          ],
        },
        {
          title: "Listes, dictionnaires, fonctions",
          text: [
            "Les structures de donnees permettent d'organiser l'information. Les listes servent a stocker des collections ordonnees d'elements, tandis que les dictionnaires permettent d'associer des cles a des valeurs. Ces deux structures sont omnipresentes en data, car elles permettent de representer des donnees complexes de maniere flexible.",
            "Une liste peut contenir des valeurs homogenes ou heterogenes, et elle est souvent utilisee pour stocker des observations ou des resultats intermediaires. Un dictionnaire, quant a lui, est ideal pour representer une entite avec plusieurs attributs, comme un utilisateur, un produit ou un enregistrement.",
            "Les fonctions permettent de regrouper du code reutilisable. Elles sont essentielles pour structurer un script, ameliorer sa lisibilite et eviter les repetitions. En data, on les utilise pour automatiser des calculs ou standardiser des traitements.",
            "Savoir manipuler ces structures et ecrire des fonctions simples est fondamental avant de passer a des outils plus avances comme NumPy et Pandas.",
          ],
          videos: [
            {
              title: "Les listes (Graven)",
              url: "https://www.youtube.com/watch?v=kyxF5eH3Kic",
              lang: "fr",
            },
            {
              title: "Les fonctions (Graven)",
              url: "https://www.youtube.com/watch?v=sgJt64iTOYM",
              lang: "fr",
            },
            {
              title: "Dictionnaires (FR)",
              url: "https://www.youtube.com/watch?v=a10AeJ_o-44",
              lang: "fr",
            },
            {
              title: "Lists/Tuples/Sets (Corey Schafer)",
              url: "https://www.youtube.com/watch?v=W8KRzm-HUcc",
              lang: "en",
            },
            {
              title: "Dictionaries (Corey Schafer)",
              url: "https://www.youtube.com/watch?v=daefaLgNkw0",
              lang: "en",
            },
            {
              title: "Functions (Corey Schafer)",
              url: "https://www.youtube.com/watch?v=9Os0o3wzS_I",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Structures de donnees (docs Python FR)",
              url: "https://docs.python.org/fr/3/tutorial/datastructures.html",
              description: "Listes, dictionnaires et fonctions en francais.",
            },
            {
              label: "Data Structures (docs Python EN)",
              url: "https://docs.python.org/3/tutorial/datastructures.html",
              description: "Listes, dictionnaires et fonctions en anglais.",
            },
          ],
        },
        {
          title: "Introduction a NumPy",
          text: [
            "NumPy est la bibliotheque de base pour manipuler des tableaux numeriques (arrays). Elle rend les calculs rapides, vectorises et plus fiables que les listes Python pour les operations scientifiques.",
            "Avec NumPy, on travaille sur des tableaux de valeurs, on accede aux dimensions (shape) et on applique des operations en bloc (addition, multiplication, moyennes). C'est un pilier de tout workflow data et ML.",
            "L'objectif ici est de comprendre les bases : creation d'arrays, indexation, slicing, et operations elementaires. Ces notions seront reutilisees dans Pandas et dans les modules de data cleaning.",
            "Une bonne maitrise de NumPy evite des boucles inutiles et rend le code plus lisible et performant.",
          ],
          videos: [
            {
              title: "NumPy (Machine Learnia – FR)",
              url: "https://www.youtube.com/watch?v=NzDQTrqsxas",
              lang: "fr",
            },
            {
              title: "NumPy (1h)",
              url: "https://www.youtube.com/watch?v=-EALexG9HFI",
              lang: "fr",
            },
            {
              title: "Intro NumPy",
              url: "https://www.youtube.com/watch?v=4_5T9gB1LtM",
              lang: "fr",
            },
            {
              title: "NumPy tutorial (Keith Galli / FreeCodeCamp)",
              url: "https://www.youtube.com/watch?v=QUT1VHiLmmI",
              lang: "en",
            },
            {
              title: "Learn NumPy in 1 Hour",
              url: "https://www.youtube.com/watch?v=8h46xOkWVtI",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "NumPy Quickstart (officiel)",
              url: "https://numpy.org/doc/stable/user/quickstart.html",
              description: "Guide officiel pour demarrer avec NumPy.",
            },
            {
              label: "DataCamp – Python arrays (FR)",
              url: "https://www.datacamp.com/fr/tutorial/python-arrays",
              description: "Introduction claire aux tableaux en Python.",
            },
          ],
        },
        {
          title: "Introduction a Pandas",
          text: [
            "Pandas permet de manipuler des donnees tabulaires via des DataFrames. C'est l'outil central pour charger des CSV, filtrer des lignes, grouper des donnees et calculer des indicateurs.",
            "On apprend a lire un fichier, selectionner des colonnes, appliquer des filtres et utiliser groupby pour produire des agregats utiles. Ces operations sont essentielles pour le reporting.",
            "L'objectif est de comprendre la logique DataFrame et les operations de base. Les modules suivants approfondiront le nettoyage et la visualisation.",
          ],
          videos: [
            {
              title: "Pandas (Machine Learnia – FR)",
              url: "https://www.youtube.com/watch?v=zZkNOdBWgFQ",
              lang: "fr",
            },
            {
              title: "Creer un DataFrame (FR)",
              url: "https://www.youtube.com/watch?v=F2yIHPhxu88",
              lang: "fr",
            },
            {
              title: "Analyser des donnees Excel avec Pandas",
              url: "https://www.youtube.com/watch?v=ZAL5tsyjeAg",
              lang: "fr",
            },
            {
              title: "Pandas Data Science Tutorial (Keith Galli)",
              url: "https://www.youtube.com/watch?v=vmEHCJofslg",
              lang: "en",
            },
            {
              title: "Pandas Tutorial (Corey Schafer – serie)",
              url: "https://www.youtube.com/watch?v=ZyhVh-qRZPA",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Pandas Getting Started (officiel)",
              url: "https://pandas.pydata.org/docs/getting_started/index.html",
              description: "Point d'entree officiel Pandas.",
            },
            {
              label: "10 minutes to pandas (officiel)",
              url: "https://pandas.pydata.org/docs/user_guide/10min.html",
              description: "Tutoriel rapide officiel.",
            },
          ],
        },
      ],
      resources: {
        articles: [],
        videos: [],
      },
      notebook: {
        title: "Notebook Module 2 - Bases Python",
        description: "Exercices guides sur variables, conditions, boucles, listes, dictionnaires et premiers DataFrames.",
        code: "# Variables et types\nage = 23\nnom = \"Awa\"\nactif = True\n\naire = 3.14 * 2 ** 2\nprint(nom, age, actif, aire)\n\n# Conditions\nnote = 12\nif note >= 10:\n    statut = \"valide\"\nelse:\n    statut = \"a revoir\"\nprint(statut)\n\n# Boucles\nnotes = [12, 15, 9, 18]\nfor n in notes:\n    print(n)\n\n# Listes et dictionnaires\netudiants = [\n    {\"nom\": \"Awa\", \"note\": 15},\n    {\"nom\": \"Jean\", \"note\": 9},\n]\n\n# Fonctions\ndef moyenne(valeurs):\n    return sum(valeurs) / len(valeurs)\n\nprint(moyenne([12, 15, 9]))\n\n# Premiers DataFrames Pandas\nimport pandas as pd\n\ndf = pd.DataFrame(etudiants)\nprint(df)\nprint(df[\"note\"].mean())",
      },
      quiz: [
        {
          prompt: "Pourquoi Python est-il central en data ?",
          options: ["Lisible et adapte aux usages data", "Plus rapide que tous les langages", "Reserve aux experts"],
          answerIndex: 0,
          explanation: "Python privilegie la lisibilite et les usages data.",
        },
        {
          prompt: "Vrai ou faux : Python oblige a declarer le type d'une variable.",
          options: ["Vrai", "Faux"],
          answerIndex: 1,
          explanation: "Le typage est dynamique en Python.",
        },
        {
          prompt: "Quel type represente un nombre decimal ?",
          options: ["int", "float", "str"],
          answerIndex: 1,
          explanation: "float represente les nombres a virgule.",
        },
        {
          prompt: "Quel mot-cle permet de tester une condition ?",
          options: ["if", "for", "def"],
          answerIndex: 0,
          explanation: "if sert a executer un bloc selon une condition.",
        },
        {
          prompt: "Les booleens peuvent prendre les valeurs :",
          options: ["True / False", "Yes / No", "0 / 1 uniquement"],
          answerIndex: 0,
          explanation: "En Python, les booleens sont True ou False.",
        },
        {
          prompt: "Une boucle for sert principalement a :",
          options: ["Repeter une action sur une sequence", "Declarer un module", "Sauver un fichier"],
          answerIndex: 0,
          explanation: "for repete une action sur une sequence.",
        },
        {
          prompt: "Une boucle while doit etre utilisee avec prudence car :",
          options: ["Elle peut devenir infinie", "Elle est interdite en Python", "Elle supprime des donnees"],
          answerIndex: 0,
          explanation: "Une condition mal geree peut boucler sans fin.",
        },
        {
          prompt: "Quelle structure associe des cles a des valeurs ?",
          options: ["Liste", "Dictionnaire", "Tuple"],
          answerIndex: 1,
          explanation: "Les dictionnaires sont faits pour ca.",
        },
        {
          prompt: "Quel mot-cle permet de definir une fonction ?",
          options: ["def", "func", "lambda"],
          answerIndex: 0,
          explanation: "def sert a declarer une fonction.",
        },
        {
          prompt: "Quel outil est concu pour manipuler des donnees tabulaires ?",
          options: ["Pandas", "Flask", "Requests"],
          answerIndex: 0,
          explanation: "Pandas est adapte aux tables et DataFrames.",
        },
      ],
      requireReadingConfirmation: true,
      requireNotebookConfirmation: true,
    },
    {
      id: "manip-donnees",
      title: "Manipulation des donnees",
      text: [],
      sections: [
        {
          title: "Introduction generale",
          text: [
            "La gestion et la preparation des donnees est l'etape la plus longue et la plus decisive d'un projet data. En pratique, 80% du temps est consacre a comprendre le jeu de donnees, corriger les erreurs, et rendre l'information exploitable. C'est ici que se joue la qualite du livrable final : un modele ou un tableau de bord ne vaut rien si les donnees de depart sont incoherentes ou incompletes.",
            "Dans les missions reelles, un Data Analyst doit souvent partir d'un fichier CSV mal structure, un Data Engineer doit consolider plusieurs sources, et un Data Scientist doit verifier la fiabilite des variables avant de modeliser. La competence cle n'est pas la theorie, mais la capacite a transformer une donnee brute en un dataset propre, lisible et utilisable par toute l'equipe.",
            "Ce module te donne une methode claire pour y parvenir. Tu vas apprendre a charger des donnees (CSV, Excel), inspecter les colonnes et les types, corriger les valeurs manquantes, supprimer les doublons, filtrer et trier les observations, puis construire des agregats simples. Chaque partie correspond a une etape reelle d'une mission KORYXA.",
            "L'objectif est mesurable : a la fin du module, tu dois etre capable de livrer un dataset propre, avec des colonnes correctement typees, des valeurs coherentes et des indicateurs de base calcules. Sans cette maitrise, les modules suivants (SQL, visualisation, modele) deviennent fragiles.",
          ],
        },
        {
          title: "Lire / ecrire des donnees (CSV, Excel, JSON)",
          text: [
            "La premiere etape consiste a charger correctement les donnees. En Python, on utilise read_csv et read_excel pour importer des fichiers, puis read_json pour travailler avec des sources API ou des exports JSON.",
            "Une fois le fichier charge, il faut verifier rapidement son contenu : combien de lignes, quelles colonnes, quels types, et quelles valeurs. Les methodes head, info et describe donnent une vue fiable en quelques secondes.",
            "Dans un contexte professionnel, cette inspection est essentielle pour detecter des colonnes mal typees, des valeurs inattendues, ou des formats non standards. Une bonne lecture des donnees permet de gagner un temps considerable sur le nettoyage.",
          ],
          videos: [
            {
              title: "Analyser des donnees Excel avec Pandas",
              url: "https://www.youtube.com/watch?v=ZAL5tsyjeAg",
              lang: "fr",
            },
            {
              title: "Importer CSV/Excel avec Pandas",
              url: "https://www.youtube.com/watch?v=-T2dA7k706E",
              lang: "fr",
            },
            {
              title: "Importing Data (CSV, Excel, JSON)",
              url: "https://www.youtube.com/watch?v=N6hyN6BW6ao",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Pandas - 10 minutes to pandas",
              url: "https://pandas.pydata.org/docs/user_guide/10min.html",
            },
            {
              label: "Pandas read_json",
              url: "https://pandas.pydata.org/docs/reference/api/pandas.read_json.html",
            },
          ],
        },
        {
          title: "Nettoyage des donnees",
          text: [
            "Le nettoyage traite les erreurs courantes : valeurs manquantes, doublons, formats incoherents et types mal definis. Une valeur manquante peut fausser un calcul, un doublon peut biaiser une moyenne, et un mauvais type peut rendre une colonne inutilisable.",
            "Les operations courantes sont dropna, fillna, drop_duplicates et astype. L'idee n'est pas de supprimer au hasard, mais de choisir une strategie coherente : supprimer quand l'information est irreparable, imputer quand une estimation est acceptable, ou corriger les formats quand l'erreur est evidente.",
            "Dans les missions KORYXA, cette etape est souvent la plus critique. Une fois les donnees nettoyees, l'analyse devient fiable et les livrables sont defendables face a un client ou une equipe technique.",
          ],
          videos: [
            {
              title: "Valeurs manquantes",
              url: "https://www.youtube.com/watch?v=BcWRljjAAfY",
              lang: "fr",
            },
            {
              title: "Doublons",
              url: "https://www.youtube.com/watch?v=Gguc9pEjYac",
              lang: "fr",
            },
            {
              title: "Missing values (dropna/fillna)",
              url: "https://www.youtube.com/watch?v=EjZhV8qOges",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "DataCamp (FR) – guide pandas",
              url: "https://www.datacamp.com/fr/tutorial/pandas",
            },
            {
              label: "IONOS (FR) – fillna()",
              url: "https://www.ionos.fr/digitalguide/sites-internet/developpement-web/python-pandas-dataframe-fillna/",
            },
          ],
        },
        {
          title: "Filtrer / selectionner / trier",
          text: [
            "Une fois les donnees propres, il faut pouvoir selectionner ce qui est utile. Le filtrage permet de garder uniquement les lignes pertinentes, le tri aide a ordonner les observations, et la selection de colonnes evite de manipuler des informations inutiles.",
            "Les filtres conditionnels en Pandas utilisent des expressions logiques : df[df['col'] > seuil], df[df['statut'] == 'actif'], etc. Le tri se fait avec sort_values, et la selection avec des listes de colonnes ou l'indexation par nom.",
            "Ces operations sont indispensables pour preparer un dataset cible, construire une analyse par segment, ou produire un fichier nettoye pour une autre equipe.",
          ],
          videos: [
            {
              title: ".loc filtrer",
              url: "https://www.youtube.com/watch?v=8FCp4uwT4Fw",
              lang: "fr",
            },
            {
              title: "Trier un DataFrame",
              url: "https://www.youtube.com/watch?v=hHYS-m3vGSI",
              lang: "fr",
            },
            {
              title: "Filtering (Corey Schafer)",
              url: "https://www.youtube.com/watch?v=Lw2rlcxScZY",
              lang: "en",
            },
            {
              title: "Sorting (Corey Schafer)",
              url: "https://www.youtube.com/watch?v=T11QYVfZoD0",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "DataCamp – loc vs iloc",
              url: "https://www.datacamp.com/tutorial/loc-vs-iloc",
            },
          ],
        },
        {
          title: "Jointures / fusion / concat",
          text: [
            "Dans la pratique, les donnees sont souvent reparties sur plusieurs fichiers ou tables. On doit donc les fusionner pour obtenir un dataset complet. Pandas propose merge, join et concat pour assembler ces sources.",
            "merge permet de relier des tables sur une cle commune, join sert a rattacher des informations par index, et concat empile des donnees similaires. Bien choisir la cle de jointure est essentiel pour eviter des doublons ou des pertes d'information.",
            "Ces operations permettent de construire un dataset complet et coherent, pret pour l'analyse ou le reporting.",
          ],
          videos: [
            {
              title: "Jointures pandas",
              url: "https://www.youtube.com/watch?v=NGctb9O1DG4",
              lang: "fr",
            },
            {
              title: "Concat / fusion",
              url: "https://www.youtube.com/watch?v=8sso30p_YNs",
              lang: "fr",
            },
            {
              title: "Merge / join DataFrames",
              url: "https://www.youtube.com/watch?v=Zv3pQZn9wrk",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Pandas - Merging (docs)",
              url: "https://pandas.pydata.org/docs/user_guide/merging.html",
            },
            {
              label: "pandas.merge reference",
              url: "https://pandas.pydata.org/docs/reference/api/pandas.merge.html",
            },
          ],
        },
      ],
      resources: {
        videos: [],
        articles: [],
      },
      notebook: {
        title: "Notebook Module 3 - Nettoyage et preparation",
        description: "Lecture CSV/JSON, nettoyage, filtres, et jointures.",
        code: "import pandas as pd\nfrom io import StringIO\n\n# Chargement CSV (exemple)\nraw = StringIO(\"\"\"region,produit,vente,statut\\nNord,A,120,actif\\nNord,A,120,actif\\nSud,B,,inactif\\nOuest,C,90,actif\\n\"\"\")\n\ndf = pd.read_csv(raw)\nprint(df.head())\nprint(df.info())\n\n# Nettoyage\nprint(df.isna().sum())\ndf = df.drop_duplicates()\ndf[\"vente\"] = df[\"vente\"].fillna(df[\"vente\"].median())\n\n# Filtrage et selection\nactifs = df[df[\"statut\"] == \"actif\"]\nactifs = actifs.sort_values(by=\"vente\", ascending=False)\n\n# Jointures (exemple)\nclients = pd.DataFrame({\n    \"region\": [\"Nord\", \"Sud\", \"Ouest\"],\n    \"manager\": [\"Awa\", \"Jean\", \"Salif\"],\n})\n\nmerged = actifs.merge(clients, on=\"region\", how=\"left\")\nprint(merged)",
      },
      quiz: [
        {
          prompt: "Pourquoi la preparation des donnees est-elle centrale ?",
          options: ["Elle garantit la fiabilite des resultats", "Elle remplace l'analyse", "Elle evite d'utiliser Python"],
          answerIndex: 0,
          explanation: "Des donnees propres rendent les resultats fiables.",
        },
        {
          prompt: "Quelle fonction charge un CSV avec Pandas ?",
          options: ["read_csv", "load_file", "open_csv"],
          answerIndex: 0,
          explanation: "read_csv est la fonction standard.",
        },
        {
          prompt: "Quelle methode montre les premieres lignes ?",
          options: ["head", "info", "describe"],
          answerIndex: 0,
          explanation: "head affiche un apercu des lignes.",
        },
        {
          prompt: "Vrai ou faux : info aide a voir les types et les NA.",
          options: ["Vrai", "Faux"],
          answerIndex: 0,
          explanation: "info affiche types et valeurs manquantes.",
        },
        {
          prompt: "Quelle action traite les valeurs manquantes ?",
          options: ["fillna ou dropna", "groupby", "sort_values"],
          answerIndex: 0,
          explanation: "fillna et dropna gerent les NA.",
        },
        {
          prompt: "Pourquoi supprimer les doublons ?",
          options: ["Eviter les biais de comptage", "Accelerer le navigateur", "Changer les types"],
          answerIndex: 0,
          explanation: "Les doublons faussent les indicateurs.",
        },
        {
          prompt: "Quel outil sert a filtrer des lignes ?",
          options: ["Un masque conditionnel", "sum()", "mean()"],
          answerIndex: 0,
          explanation: "On filtre avec des conditions booleennes.",
        },
        {
          prompt: "A quoi sert sort_values ?",
          options: ["Trier un DataFrame", "Supprimer des colonnes", "Importer un fichier"],
          answerIndex: 0,
          explanation: "sort_values trie selon une colonne.",
        },
        {
          prompt: "Quel outil sert a fusionner deux DataFrames sur une cle ?",
          options: ["merge", "fillna", "dropna"],
          answerIndex: 0,
          explanation: "merge sert a joindre des tables sur une cle.",
        },
        {
          prompt: "concat permet de :",
          options: ["Empiler des tableaux similaires", "Supprimer des NA", "Changer les types"],
          answerIndex: 0,
          explanation: "concat assemble plusieurs DataFrames.",
        },
      ],
      requireReadingConfirmation: true,
      requireNotebookConfirmation: true,
    },
    {
      id: "sql-bases",
      title: "Bases SQL",
      text: [],
      sections: [
        {
          title: "Mise en place de l'environnement SQL",
          text: [
            "Pour la V1, KORYXA utilise SQLite, inclus par defaut avec Python. Aucune installation serveur SQL n'est requise.",
            "L'idee est simple : tu crees une base locale, tu definis des tables, puis tu ecris des requetes SQL pour interroger les donnees. Cette approche suffit pour apprendre les fondamentaux et produire des exercices realistes sans complexite d'infrastructure.",
            "Dans les missions KORYXA, SQLite est souvent suffisante pour les prototypes et les preuves de concept. Les notions apprises ici seront identiques quand tu passeras a MySQL, PostgreSQL ou d'autres bases en entreprise.",
          ],
          videos: [
            {
              title: "Installer SQLite et SQLite Browser (FR)",
              url: "https://www.youtube.com/watch?v=C1I6RYr823s",
              lang: "fr",
            },
            {
              title: "Prise en main de DB Browser for SQLite (FR)",
              url: "https://www.youtube.com/watch?v=PCia6dev4mQ",
              lang: "fr",
            },
            {
              title: "Utiliser Python pour interagir avec une base (sqlite3) (FR)",
              url: "https://www.youtube.com/watch?v=JiEoZ8Z9oUQ",
              lang: "fr",
            },
            {
              title: "Install SQLite on Windows (EN)",
              url: "https://www.youtube.com/watch?v=wPyyY-sekiI",
              lang: "en",
            },
            {
              title: "Install DB Browser for SQLite on Windows (EN)",
              url: "https://www.youtube.com/watch?v=l04gLdoPpV0",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "SQLite - Download",
              url: "https://www.sqlite.org/download.html",
              description: "Page officielle pour telecharger SQLite.",
            },
            {
              label: "DB Browser for SQLite - Downloads",
              url: "https://sqlitebrowser.org/dl/",
              description: "Telechargements officiels DB Browser.",
            },
            {
              label: "SQLite Docs",
              url: "https://www.sqlite.org/docs.html",
              description: "Documentation officielle SQLite.",
            },
          ],
        },
        {
          title: "Concepts fondamentaux des bases de donnees",
          text: [
            "Le SQL est le langage central de la donnee structuree. Dans la plupart des organisations, les informations utiles vivent dans des bases relationnelles : commandes, utilisateurs, stocks, operations, finances. Savoir ecrire une requete SQL fiable permet d'extraire, filtrer, agreger et structurer l'information au plus pres de la source, sans dependance a des outils intermediaires.",
            "Ce module pose les fondations indispensables : comprendre les notions de tables, colonnes, cles et relations, puis ecrire des requetes claires. L'objectif n'est pas la performance extreme, mais la justesse, la lisibilite et la reproductibilite des requetes.",
            "Un bon analyste ne se contente pas de recuperer des chiffres : il sait expliquer d'ou ils viennent, comment ils ont ete calculees, et pourquoi ils sont fiables. SQL donne cette capacite en rendant chaque etape du raisonnement explicite.",
            "Une base relationnelle organise la donnee en tables. Chaque table contient des lignes (enregistrements) et des colonnes (champs). Les cles primaires identifient chaque ligne de maniere unique, et les cles etrangeres relient les tables entre elles.",
            "Le schema relationnel definit comment les tables se connectent. C'est ce qui garantit la coherence de la donnee et permet d'eviter les duplications inutiles. SQL est le langage qui permet de parcourir ce schema avec precision.",
            "SQL se distingue d'un tableur : un tableur est manuel et fragile, alors qu'une base relationnelle impose des regles claires et des contraintes. C'est cette rigueur qui rend les resultats fiables dans un contexte professionnel.",
          ],
          videos: [
            {
              title: "Cours SQL complet / Introduction (FR)",
              url: "https://www.youtube.com/watch?v=8NU6pTtQo2I",
              lang: "fr",
            },
            {
              title: "SQL (vue d'ensemble, roles, logique relationnelle) (FR)",
              url: "https://www.youtube.com/watch?v=paxyrZBzRK8",
              lang: "fr",
            },
            {
              title: "SQL Tutorial - Full Database Course for Beginners (EN)",
              url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
              lang: "en",
            },
            {
              title: "Learn SQL Beginner to Advanced (EN)",
              url: "https://www.youtube.com/watch?v=OT1RErkfLNQ",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "SQLBolt - cours interactif",
              url: "https://sqlbolt.com/",
              description: "Exercices interactifs pour comprendre SQL.",
            },
            {
              label: "FreeCodeCamp - intro SQL",
              url: "https://www.freecodecamp.org/news/an-animated-introduction-to-sql-learn-to-query-relational-databases/",
              description: "Introduction claire et visuelle.",
            },
          ],
        },
        {
          title: "Requetes SQL de base",
          text: [
            "Les requetes SQL de base permettent de selectionner les bonnes informations rapidement. La clause SELECT choisit les colonnes, FROM precise la table, et WHERE filtre les lignes selon des conditions.",
            "ORDER BY sert a trier les resultats, LIMIT a restreindre le volume, et les operateurs logiques (AND, OR, NOT) permettent de combiner plusieurs conditions. Ces elements suffisent pour produire des extractions utiles dans la plupart des missions.",
            "Une requete doit rester lisible : un bon SQL est court, clair et verifiable. Cela facilite la relecture et la collaboration avec d'autres membres de l'equipe.",
          ],
          videos: [
            {
              title: "Apprendre SQL : SELECT, WHERE, ORDER BY, DISTINCT & LIMIT (FR)",
              url: "https://www.youtube.com/watch?v=A0pvBsI7smw",
              lang: "fr",
            },
            {
              title: "Learn and master SQL: Order and Limit (FR)",
              url: "https://www.youtube.com/watch?v=OL9T7pI-m84",
              lang: "fr",
            },
            {
              title: "SELECT, UPDATE & INSERT (Grafikart) (FR)",
              url: "https://www.youtube.com/watch?v=YgyB6ZRbX9w",
              lang: "fr",
            },
            {
              title: "Learn SQL for Beginners - COMPLETE SQL Tutorial (EN)",
              url: "https://www.youtube.com/watch?v=eL80VI4QGTg",
              lang: "en",
            },
            {
              title: "SQL Tutorial - Full Database Course for Beginners (EN)",
              url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "WHERE (cours clair)",
              url: "https://sql.sh/cours/where",
              description: "Guide clair sur WHERE en SQL.",
            },
            {
              label: "Guide complet WHERE (FR)",
              url: "https://learnsql.fr/blog/le-guide-complet-de-la-clause-where-en-sql/",
              description: "Exemples pratiques de WHERE.",
            },
          ],
        },
        {
          title: "Agregation + GROUP BY / HAVING",
          text: [
            "Les agregations (COUNT, SUM, AVG) transforment des lignes detaillees en indicateurs. Avec GROUP BY, tu peux calculer des totaux par categorie, par region ou par periode.",
            "HAVING permet de filtrer apres aggregation, alors que WHERE filtre avant. Bien comprendre cette difference est essentiel pour obtenir les bons resultats.",
          ],
          videos: [
            {
              title: "Learn and master SQL: Aggregate data (FR)",
              url: "https://www.youtube.com/watch?v=NXZEWKftBM0",
              lang: "fr",
            },
            {
              title: "Les fonctions d'agregation / GROUP BY (FR)",
              url: "https://www.youtube.com/watch?v=FhvTxTGGrQc",
              lang: "fr",
            },
            {
              title: "GROUP BY / HAVING (FR)",
              url: "https://www.youtube.com/watch?v=d58UngiIl0U",
              lang: "fr",
            },
            {
              title: "Student Database Part 2 (GROUP BY, HAVING, etc.) (EN)",
              url: "https://www.youtube.com/watch?v=y3TCtu-TaTk",
              lang: "en",
            },
            {
              title: "SQL and Databases course (sections aggregates) (EN)",
              url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "GROUP BY (W3Schools)",
              url: "https://www.w3schools.com/sql/sql_groupby.asp",
              description: "Explications simples et exemples.",
            },
            {
              label: "GROUP BY + HAVING (Microsoft Learn)",
              url: "https://learn.microsoft.com/en-us/sql/t-sql/queries/select-group-by-transact-sql?view=sql-server-ver17",
              description: "Reference officielle Microsoft.",
            },
            {
              label: "Grafikart - Agregations",
              url: "https://grafikart.fr/tutoriels/sql-aggregate-count-1991",
              description: "Article FR sur les fonctions d'agregation.",
            },
          ],
        },
        {
          title: "Jointures (INNER/LEFT/RIGHT) + cles etrangeres",
          text: [
            "Les jointures permettent de combiner des informations provenant de plusieurs tables. INNER JOIN garde les lignes qui matchent dans les deux tables, alors que LEFT JOIN garde toutes les lignes de la table principale.",
            "Les cles etrangeres garantissent la coherence entre les tables. Une jointure bien definie est essentielle pour eviter des doublons ou des resultats incomplets.",
          ],
          videos: [
            {
              title: "Apprendre SQL : Les jointures (FR)",
              url: "https://www.youtube.com/watch?v=j33AJNGoJak",
              lang: "fr",
            },
            {
              title: "Cles etrangeres et jointures (Grafikart) (FR)",
              url: "https://www.youtube.com/watch?v=0vJoRP6_5tI",
              lang: "fr",
            },
            {
              title: "SQL Joins Tutorial for Beginners (EN)",
              url: "https://www.youtube.com/watch?v=2HVMiPPuPIM",
              lang: "en",
            },
            {
              title: "SQL JOINS Tutorial (EN)",
              url: "https://www.youtube.com/watch?v=0OQJDd3QqQM",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "PostgreSQL - tutorial join",
              url: "https://www.postgresql.org/docs/current/tutorial-join.html",
              description: "Documentation officielle PostgreSQL sur les jointures.",
            },
            {
              label: "MySQL JOIN (doc)",
              url: "https://dev.mysql.com/doc/en/join.html",
              description: "Reference officielle MySQL.",
            },
          ],
        },
        {
          title: "Python ↔ SQL (sqlite3 + pandas read_sql)",
          text: [
            "SQLite se manipule directement depuis Python via le module sqlite3. Tu peux creer des tables, executer des requetes SQL, puis charger les resultats dans Pandas pour analyser ou visualiser.",
            "Cette passerelle est tres utile : tu recuperes des donnees propres avec SQL, puis tu produis des analyses rapides avec Python. C'est une competence cle pour livrer vite et bien sur des missions reelles.",
            "Dans la pratique, on alterne souvent entre SQL et Python. Ce module te donne un premier workflow simple et reproductible pour cela.",
          ],
          videos: [
            {
              title: "Base de donnees : SQLite et Python (FR)",
              url: "https://www.youtube.com/watch?v=gCe-B27qzEs",
              lang: "fr",
            },
            {
              title: "Creation d'une base sqlite3 en Python (FR)",
              url: "https://www.youtube.com/watch?v=SHwPvepwKkc",
              lang: "fr",
            },
            {
              title: "Python SQLite Tutorial (Corey Schafer) (EN)",
              url: "https://www.youtube.com/watch?v=pd-0G0MigUA",
              lang: "en",
            },
            {
              title: "Read/Write data from Database with Pandas (EN)",
              url: "https://www.youtube.com/watch?v=M-4EpNdlSuY",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Docs Python sqlite3 (officiel)",
              url: "https://docs.python.org/3/library/sqlite3.html",
              description: "Reference officielle sqlite3.",
            },
            {
              label: "Pandas read_sql (FR)",
              url: "https://datascientest.com/pandas-read-sql-tout-savoir",
              description: "Guide FR sur read_sql.",
            },
            {
              label: "IONOS SQLite3 avec Python (FR)",
              url: "https://www.ionos.fr/digitalguide/sites-internet/developpement-web/sqlite3-avec-python/",
              description: "Tutoriel SQLite3 + Python.",
            },
          ],
        },
      ],
      resources: {
        videos: [],
        articles: [],
      },
      notebook: {
        title: "Notebook Module 4 - SQL avec SQLite",
        description: "Creation de tables, requetes SQL, jointures, agregations et lecture via Pandas.",
        code: "import sqlite3\nimport pandas as pd\n\n# Creation de la base SQLite\nconn = sqlite3.connect(\":memory:\")\ncur = conn.cursor()\n\n# Tables\ndef create_tables():\n    cur.execute(\"\"\"\n        CREATE TABLE clients (\n            id INTEGER PRIMARY KEY,\n            nom TEXT,\n            region TEXT\n        );\n    \"\"\")\n    cur.execute(\"\"\"\n        CREATE TABLE commandes (\n            id INTEGER PRIMARY KEY,\n            client_id INTEGER,\n            montant REAL,\n            statut TEXT,\n            FOREIGN KEY(client_id) REFERENCES clients(id)\n        );\n    \"\"\")\n\ncreate_tables()\n\n# Donnees\ncur.executemany(\n    \"INSERT INTO clients (id, nom, region) VALUES (?, ?, ?)\",\n    [(1, \"Awa\", \"Nord\"), (2, \"Jean\", \"Sud\"), (3, \"Salif\", \"Nord\")],\n)\ncur.executemany(\n    \"INSERT INTO commandes (id, client_id, montant, statut) VALUES (?, ?, ?, ?)\",\n    [(1, 1, 120.0, \"valide\"), (2, 1, 80.0, \"valide\"), (3, 2, 50.0, \"annule\"), (4, 3, 200.0, \"valide\")],\n)\nconn.commit()\n\n# SELECT / WHERE\nquery = \"SELECT * FROM commandes WHERE statut = 'valide'\"\nprint(pd.read_sql_query(query, conn))\n\n# JOIN\njoin_query = \"\"\"\nSELECT c.nom, c.region, o.montant\nFROM commandes o\nJOIN clients c ON o.client_id = c.id\nWHERE o.statut = 'valide'\n\"\"\"\nprint(pd.read_sql_query(join_query, conn))\n\n# GROUP BY\nagg_query = \"\"\"\nSELECT c.region, COUNT(*) AS nb_commandes, SUM(o.montant) AS total\nFROM commandes o\nJOIN clients c ON o.client_id = c.id\nGROUP BY c.region\n\"\"\"\nprint(pd.read_sql_query(agg_query, conn))\n\nconn.close()",
      },
      quiz: [
        {
          prompt: "Quel element identifie de facon unique une ligne ?",
          options: ["Cle primaire", "Colonne texte", "Index visuel"],
          answerIndex: 0,
          explanation: "La cle primaire identifie chaque ligne.",
        },
        {
          prompt: "SQL sert principalement a :",
          options: ["Interroger des bases relationnelles", "Dessiner des graphiques", "Compresser des fichiers"],
          answerIndex: 0,
          explanation: "SQL permet de requeter une base relationnelle.",
        },
        {
          prompt: "Quelle clause sert a filtrer les resultats ?",
          options: ["WHERE", "ORDER BY", "FROM"],
          answerIndex: 0,
          explanation: "WHERE filtre les lignes selon une condition.",
        },
        {
          prompt: "Quel mot-cle sert a trier un resultat ?",
          options: ["ORDER BY", "GROUP BY", "LIMIT"],
          answerIndex: 0,
          explanation: "ORDER BY trie les lignes.",
        },
        {
          prompt: "Vrai ou faux : JOIN sert a combiner des tables.",
          options: ["Vrai", "Faux"],
          answerIndex: 0,
          explanation: "JOIN relie des tables via une cle.",
        },
        {
          prompt: "GROUP BY sert a :",
          options: ["Agreger par categorie", "Supprimer des colonnes", "Importer un fichier"],
          answerIndex: 0,
          explanation: "GROUP BY regroupe avant agregation.",
        },
        {
          prompt: "Quelle fonction compte le nombre de lignes ?",
          options: ["COUNT", "SUM", "AVG"],
          answerIndex: 0,
          explanation: "COUNT compte les lignes.",
        },
        {
          prompt: "SQLite est :",
          options: ["Une base embarquee dans un fichier", "Un serveur distant obligatoire", "Un tableur en ligne"],
          answerIndex: 0,
          explanation: "SQLite est une base legere et locale.",
        },
        {
          prompt: "Quel module Python permet d'utiliser SQLite ?",
          options: ["sqlite3", "requests", "pathlib"],
          answerIndex: 0,
          explanation: "sqlite3 est le module standard.",
        },
        {
          prompt: "Pourquoi relier SQL et Python ?",
          options: ["Analyser et visualiser les resultats", "Remplacer les tables", "Eviter les donnees"],
          answerIndex: 0,
          explanation: "SQL extrait, Python analyse.",
        },
      ],
      requireReadingConfirmation: true,
      requireNotebookConfirmation: true,
    },
    {
      id: "visualisation",
      title: "Visualisation & reporting",
      text: [],
      sections: [
        {
          title: "Introduction generale",
          text: [
            "Visualiser les donnees n'est pas une etape decorative. Dans les projets data reels, la visualisation est un outil de comprehension, de communication et de decision. Un bon graphique permet de detecter une tendance, une anomalie ou une relation que des tableaux de chiffres ne montrent pas. A l'inverse, une mauvaise visualisation peut induire en erreur, meme si les donnees sont correctes.",
            "Dans les entreprises, les livrables data sont rarement des scripts Python ou des requetes SQL brutes. Ce sont des graphiques, des tableaux de bord et des rapports qui doivent etre compris par des profils non techniques. Le role du data analyst ou du data scientist est donc de transformer une analyse en message clair, fidele aux donnees et adapte au public.",
            "Ce module introduit les principes fondamentaux de la visualisation : quels graphiques utiliser, comment les lire, et comment eviter les erreurs classiques. Tu apprendras a produire des graphiques simples avec Python, en te concentrant sur la lisibilite, la coherence et le sens. L'objectif n'est pas de maitriser tous les outils existants, mais de developper un raisonnement visuel solide, reutilisable dans tous les projets KORYXA.",
            "La visualisation sert aussi a verifier son propre travail. Avant de presenter un resultat, on observe s'il y a des ruptures, des valeurs aberrantes ou des distributions etranges. Cette verification visuelle evite des conclusions hasardeuses et renforce la qualite du livrable.",
            "Un bon reporting n'est pas un decor. Il rassemble des graphiques utiles, des commentaires clairs et une conclusion actionnable. C'est cette logique de decision qui guide ce module.",
          ],
        },
        {
          title: "Pourquoi visualiser les donnees",
          text: [
            "Dans un projet data, la visualisation intervient a deux moments : l'exploration et la communication. L'exploration sert a comprendre rapidement les donnees et a decouvrir des patterns. La communication sert a expliquer un resultat a un public qui ne lit pas du code.",
            "Les erreurs courantes sont les graphiques inutiles, les axes trompeurs, ou les visuels surcharges. Un bon visuel simplifie sans masquer, et reste fidele a ce que disent les donnees.",
            "L'objectif est d'aider la decision. Si un graphique ne permet pas d'agir, il doit etre repense.",
          ],
          videos: [
            {
              title: "C'est quoi la Data Visualisation ? (DataScientest)",
              url: "https://www.youtube.com/watch?v=dd6H7kaqU48",
              lang: "fr",
            },
            {
              title: "The beauty of data visualization (TED - David McCandless)",
              url: "https://www.youtube.com/watch?v=5Zg-C8AAIGg",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Data to Viz - From data to visualization",
              url: "https://www.data-to-viz.com/",
              description: "Guide pour relier un type de donnee au bon graphique.",
            },
          ],
        },
        {
          title: "Types de graphiques et cas d'usage",
          text: [
            "Chaque type de graphique porte un message specifique. Un bar chart compare des categories, un line chart suit une evolution dans le temps, et un scatter plot montre une relation entre deux variables.",
            "Le mauvais choix de graphique est une source d'erreurs. Par exemple, utiliser un camembert pour trop de categories ou une courbe pour des donnees non temporelles.",
            "Savoir choisir le bon graphique, c'est deja reussir la moitie du reporting.",
          ],
          videos: [
            {
              title: "From Data to Viz : Comment choisir la bonne representation ?",
              url: "https://www.youtube.com/watch?v=IKnkU9rFqCE",
              lang: "fr",
            },
            {
              title: "Storytelling with Data — #17 Which graph should I use?",
              url: "https://www.youtube.com/watch?v=c-XkYOfifeY",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Data to Viz - Choose the right chart",
              url: "https://www.data-to-viz.com/chart_types.html",
              description: "Panorama des types de graphiques et leurs usages.",
            },
          ],
        },
        {
          title: "Matplotlib (bases + premiers graphiques)",
          text: [
            "Matplotlib est la bibliotheque de base pour tracer des graphiques en Python. Elle permet de creer des bar charts, line charts et scatter plots en quelques lignes.",
            "L'objectif ici est de produire des visuels simples et corrects, avec des titres, des labels et des legendes lisibles.",
          ],
          videos: [
            {
              title: "Initiation a Matplotlib pour la visualisation des donnees avec Python",
              url: "https://www.youtube.com/watch?v=HcxRxmvOXkg",
              lang: "fr",
            },
            {
              title: "Matplotlib Tutorial (Part 1): Creating and Customizing Our First Plots (Corey Schafer)",
              url: "https://www.youtube.com/watch?v=UO98lJQ3QGI",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Matplotlib - Pyplot tutorial",
              url: "https://matplotlib.org/stable/tutorials/introductory/pyplot.html",
              description: "Documentation officielle pour creer des graphiques simples.",
            },
          ],
        },
        {
          title: "Seaborn (graphiques statistiques)",
          text: [
            "Seaborn apporte des graphiques statistiques plus propres et plus rapides a lire. Il repose sur Matplotlib mais ajoute des styles coherents et des fonctions pratiques.",
            "On l'utilise pour des distributions, des comparaisons de groupes et des relations entre variables.",
          ],
          videos: [
            {
              title: "SEABORN PYTHON TUTORIAL… (tutoriel Python francais)",
              url: "https://www.youtube.com/watch?v=xYgfIRzNPlo",
              lang: "fr",
            },
            {
              title: "Seaborn Tutorial for Beginners in Python (freeCodeCamp)",
              url: "https://www.youtube.com/watch?v=MyhBYkWarBE",
              lang: "en",
            },
          ],
        },
        {
          title: "Dashboards (Power BI + Looker Studio)",
          text: [
            "Un dashboard rassemble plusieurs graphiques pour suivre une activite. Il doit etre lisible, coherent et oriente decision.",
            "Power BI et Looker Studio sont deux outils courants pour transformer une analyse en reporting partageable.",
          ],
          videos: [
            {
              title: "Creez un Tableau de Bord Professionnel avec Power BI",
              url: "https://www.youtube.com/watch?v=Kk6QtM8dWus",
              lang: "fr",
            },
            {
              title: "Power BI Tutorial: Create Your First Dashboard (20 min)",
              url: "https://www.youtube.com/watch?v=c7LrqSxjJQQ",
              lang: "en",
            },
            {
              title: "Looker Studio : Creer un Tableau de bord Etape par Etape",
              url: "https://www.youtube.com/watch?v=BVBvo9eKK40",
              lang: "fr",
            },
            {
              title: "Looker Studio Tutorial for Beginners 2025",
              url: "https://www.youtube.com/watch?v=qCl-HHVBRsU",
              lang: "en",
            },
          ],
        },
      ],
      resources: {
        videos: [],
        articles: [],
      },
      notebook: {
        title: "Notebook Module 5 - Visualisation & reporting",
        description: "Import CSV, bar chart, line chart, scatter plot et interpretation ecrite.",
        code: "import pandas as pd\nimport matplotlib.pyplot as plt\n\n# Donnees exemple\nraw = {\n    \"mois\": [\"Jan\", \"Fev\", \"Mar\", \"Avr\", \"Mai\", \"Juin\"],\n    \"ventes\": [120, 150, 130, 180, 210, 190],\n    \"visites\": [300, 280, 320, 360, 400, 390],\n}\n\ndf = pd.DataFrame(raw)\n\n# Bar chart\nplt.figure()\nplt.bar(df[\"mois\"], df[\"ventes\"])\nplt.title(\"Ventes par mois\")\nplt.xlabel(\"Mois\")\nplt.ylabel(\"Ventes\")\nplt.show()\n\n# Line chart\nplt.figure()\nplt.plot(df[\"mois\"], df[\"visites\"], marker=\"o\")\nplt.title(\"Visites par mois\")\nplt.xlabel(\"Mois\")\nplt.ylabel(\"Visites\")\nplt.show()\n\n# Scatter plot\nplt.figure()\nplt.scatter(df[\"visites\"], df[\"ventes\"])\nplt.title(\"Relation visites vs ventes\")\nplt.xlabel(\"Visites\")\nplt.ylabel(\"Ventes\")\nplt.show()\n\n# Interpretation ecrite (exemple)\nprint(\"Les ventes augmentent globalement avec les visites, avec un pic en mai.\")",
      },
      quiz: [
        {
          prompt: "Pourquoi visualiser les donnees ?",
          options: ["Comprendre et communiquer clairement", "Remplacer les donnees", "Ajouter un decor"],
          answerIndex: 0,
          explanation: "La visualisation sert a comprendre et a expliquer.",
        },
        {
          prompt: "Quelle difference entre exploration et communication ?",
          options: ["Explorer pour comprendre, communiquer pour convaincre", "Aucune difference", "Explorer uniquement pour coder"],
          answerIndex: 0,
          explanation: "On explore pour comprendre, on communique pour expliquer.",
        },
        {
          prompt: "Quel graphique est adapte pour une evolution dans le temps ?",
          options: ["Courbe", "Camembert", "Table brute"],
          answerIndex: 0,
          explanation: "Une courbe montre une evolution.",
        },
        {
          prompt: "Quel graphique compare des categories ?",
          options: ["Bar chart", "Scatter plot", "Histogramme temporel"],
          answerIndex: 0,
          explanation: "Le bar chart compare des categories.",
        },
        {
          prompt: "Vrai ou faux : un graphique peut etre trompeur si l'echelle est mal choisie.",
          options: ["Vrai", "Faux"],
          answerIndex: 0,
          explanation: "Une echelle mal choisie peut induire en erreur.",
        },
        {
          prompt: "Quel type de graphique montre une relation entre deux variables ?",
          options: ["Scatter plot", "Pie chart", "Table brute"],
          answerIndex: 0,
          explanation: "Le scatter plot montre la relation entre deux variables.",
        },
        {
          prompt: "Matplotlib sert a :",
          options: ["Tracer des graphiques en Python", "Faire des requetes SQL", "Nettoyer les donnees"],
          answerIndex: 0,
          explanation: "Matplotlib est une bibliotheque de visualisation.",
        },
        {
          prompt: "Seaborn est utile car :",
          options: ["Il ameliore la lisibilite des graphiques", "Il remplace Python", "Il stocke les donnees"],
          answerIndex: 0,
          explanation: "Seaborn propose des graphiques plus lisibles.",
        },
        {
          prompt: "Lire un graphique implique de verifier :",
          options: ["Axes, echelle, message", "Couleur du logo", "Nom du fichier"],
          answerIndex: 0,
          explanation: "Axes, echelle et message sont essentiels.",
        },
        {
          prompt: "Un bon reporting doit etre :",
          options: ["Clair et actionnable", "Long et complexe", "Sans conclusion"],
          answerIndex: 0,
          explanation: "Le reporting doit guider la decision.",
        },
      ],
      requireReadingConfirmation: true,
      requireNotebookConfirmation: true,
    },
    {
      id: "projet-synthese",
      title: "Projet commun de synthese",
      text: [],
      sections: [
        {
          title: "Brief (objectif + livrables + dataset)",
          text: [
            "Objectif : livrer un projet data complet et reproductible en enchainant Python + Pandas, SQL, visualisation et un mini-rapport.",
            "Livrables obligatoires : 1) notebook .ipynb, 2) cleaned.csv, 3) queries.sql (5 requetes), 4) mini-rapport PDF (1 page) OU README.md.",
            "Option recommande : un zip unique contenant tous les livrables.",
          ],
          dataset: {
            label: "Dataset projet (sales)",
            url: "/datasets/koryxa_project_sales.csv",
            rows: 800,
            size: "70 KB",
            updatedAt: "2026-01-11",
            columns: [
              { name: "order_id", description: "Identifiant unique de la commande." },
              { name: "order_date", description: "Date de commande (YYYY-MM-DD)." },
              { name: "country", description: "Pays de la commande." },
              { name: "country_code", description: "Code ISO du pays." },
              { name: "region", description: "Region commerciale." },
              { name: "city", description: "Ville principale." },
              { name: "product_category", description: "Categorie du produit/service." },
              { name: "product", description: "Nom du produit." },
              { name: "quantity", description: "Quantite vendue." },
              { name: "unit_price", description: "Prix unitaire." },
              { name: "revenue", description: "Montant total (quantity * unit_price)." },
              { name: "channel", description: "Canal de vente." },
              { name: "customer_type", description: "Type de client (NGO, Startup, SME, School)." },
            ],
          },
          videos: [
            {
              title: "Portfolio Data Science: Creez un Projet Complet et Irresistible!",
              url: "https://www.youtube.com/watch?v=X-vVY6lTy-0",
              lang: "fr",
            },
            {
              title: "Data Science Life Cycle | Life Cycle Of A Data Science Project",
              url: "https://www.youtube.com/watch?v=4Cp6PkBKqX4",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "CRISP-DM (FR)",
              url: "https://fr.wikipedia.org/wiki/CRISP-DM",
            },
            {
              label: "CRISP-DM (EN)",
              url: "https://en.wikipedia.org/wiki/Cross-industry_standard_process_for_data_mining",
            },
          ],
        },
        {
          title: "Nettoyage (Pandas)",
          text: [
            "Exiger : gestion des valeurs manquantes (regle claire), suppression doublons, conversion des types (date en format date, valeurs numeriques en float), normalisation des colonnes (snake_case).",
            "Livrable : cleaned.csv + notes sur 3 anomalies detectees et corrigees.",
          ],
          videos: [
            {
              title: "Valeurs manquantes",
              url: "https://www.youtube.com/watch?v=BcWRljjAAfY",
              lang: "fr",
            },
            {
              title: "Doublons",
              url: "https://www.youtube.com/watch?v=Gguc9pEjYac",
              lang: "fr",
            },
            {
              title: "Missing values (dropna/fillna)",
              url: "https://www.youtube.com/watch?v=EjZhV8qOges",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Pandas - Missing data (docs)",
              url: "https://pandas.pydata.org/docs/user_guide/missing_data.html",
            },
            {
              label: "DataCamp (FR) – guide pandas",
              url: "https://www.datacamp.com/fr/tutorial/pandas",
            },
          ],
        },
        {
          title: "SQL (SQLite) : 5 requetes obligatoires",
          text: [
            "Exiger un fichier queries.sql avec 5 requetes : 1) top 5 revenus par produit, 2) revenus par pays, 3) ventes mensuelles, 4) panier moyen par type de client, 5) top 3 produits par region.",
            "Livrable : base SQLite + queries.sql.",
          ],
          videos: [
            {
              title: "Apprendre SQL : SELECT, WHERE, ORDER BY, DISTINCT & LIMIT (FR)",
              url: "https://www.youtube.com/watch?v=A0pvBsI7smw",
              lang: "fr",
            },
            {
              title: "Apprendre SQL : Les jointures (FR)",
              url: "https://www.youtube.com/watch?v=j33AJNGoJak",
              lang: "fr",
            },
            {
              title: "Learn SQL for Beginners - COMPLETE SQL Tutorial (EN)",
              url: "https://www.youtube.com/watch?v=eL80VI4QGTg",
              lang: "en",
            },
            {
              title: "SQL Joins Tutorial for Beginners (EN)",
              url: "https://www.youtube.com/watch?v=2HVMiPPuPIM",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Docs Python sqlite3 (officiel)",
              url: "https://docs.python.org/3/library/sqlite3.html",
            },
            {
              label: "SQLBolt (exercices)",
              url: "https://sqlbolt.com/",
            },
          ],
        },
        {
          title: "Visualisation : 3 graphiques obligatoires",
          text: [
            "Exiger 3 graphiques + interpretation : 1) courbe d'evolution des revenus, 2) bar chart comparatif entre pays, 3) graphique insight (avant/apres).",
            "Regle : pas de graphiques sans legende / titres / source.",
          ],
          videos: [
            {
              title: "C'est quoi la Data Visualisation ? (DataScientest)",
              url: "https://www.youtube.com/watch?v=dd6H7kaqU48",
              lang: "fr",
            },
            {
              title: "Initiation a Matplotlib pour la visualisation des donnees",
              url: "https://www.youtube.com/watch?v=HcxRxmvOXkg",
              lang: "fr",
            },
            {
              title: "The beauty of data visualization (TED - David McCandless)",
              url: "https://www.youtube.com/watch?v=5Zg-C8AAIGg",
              lang: "en",
            },
            {
              title: "Storytelling with Data — Which graph should I use?",
              url: "https://www.youtube.com/watch?v=c-XkYOfifeY",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Data to Viz - From data to visualization",
              url: "https://www.data-to-viz.com/",
            },
            {
              label: "Matplotlib - Pyplot tutorial",
              url: "https://matplotlib.org/stable/tutorials/introductory/pyplot.html",
            },
          ],
        },
        {
          title: "Soumettre le livrable",
          text: [
            "Soumission obligatoire : lien GitHub/Drive + (optionnel) upload .zip.",
            "Chaque soumission genere un numero (submission_id) a conserver.",
          ],
          actions: [
            {
              label: "Soumettre le livrable",
              href: "/school/module-6/submit",
            },
          ],
          videos: [
            {
              title: "Comment partager un fichier sur Google Drive (guide complet)",
              url: "https://www.youtube.com/watch?v=iYMc6r3ZwC4",
              lang: "fr",
            },
            {
              title: "How to Share Google Drive Files and Folders",
              url: "https://www.youtube.com/watch?v=ElabHPB3Urw",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Google Drive - share files",
              url: "https://support.google.com/drive/answer/2494822",
            },
          ],
        },
        {
          title: "Test final (50 questions) + validation",
          text: [
            "Test avance : 50 questions, seuil 70%. Le score est calcule cote serveur.",
            "Le module est valide si la soumission est enregistree ET si le test est reussi.",
          ],
          actions: [
            {
              label: "Lancer le test final",
              href: "/school/module-6/test",
            },
          ],
          videos: [
            {
              title: "Simulation d'entretien d'embauche : Data Analyst",
              url: "https://www.youtube.com/watch?v=DgDwLG8hZpk",
              lang: "fr",
            },
            {
              title: "How To Answer Data Analyst Interview Questions",
              url: "https://www.youtube.com/watch?v=5RzGOqZe-Gk",
              lang: "en",
            },
          ],
          articles: [
            {
              label: "Guide entretien data (FR)",
              url: "https://datascientest.com/metier-data-analyst",
            },
          ],
        },
      ],
      resources: {
        videos: [],
        articles: [],
      },
      quiz: [],
      advancedTest: {
        href: "/school/module-6/test",
        minScore: 70,
        questions: 50,
      },
      requireReadingConfirmation: true,
    },
  ],
};

export const specialisations: Record<string, ProgramContent> = {};

export const MIN_PASS_PERCENT = 70;

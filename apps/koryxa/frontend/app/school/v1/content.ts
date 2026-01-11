export type ResourceLink = { label: string; url: string; description?: string };
export type SectionVideo = { label: string; url: string; tag?: string };
export type ModuleSection = {
  title: string;
  text: string[];
  video?: SectionVideo;
  videos?: SectionVideo[];
  articles?: ResourceLink[];
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
          video: {
            label: "IBM – What is Data Science",
            url: "https://www.youtube.com/watch?v=X3paOmcrTjQ",
          },
          articles: [
            {
              label: "HETIC – Data Engineer, Data Scientist ou Data Analyst : quel metier ?",
              url: "https://www.hetic.net/actualites/data-engineer-data-scientist-ou-data-analyst",
              description: "Clarifie les differences de missions et de competences entre les trois roles.",
            },
            {
              label: "PositiveThinking.tech – Data jobs, part 1: Data Scientist, Data Engineer, Data Analyst",
              url: "https://positivethinking.tech/insights/data-jobs-part-1/",
              description: "Vue d'ensemble en anglais pour comparer les roles cote missions et attentes.",
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
          video: {
            label: "IBM – What does a Data Analyst do?",
            url: "https://www.youtube.com/watch?v=ywZXpfdqg1o",
          },
          articles: [
            {
              label: "DataScientist.fr – Top 10 des metiers de la Data a surveiller en 2025",
              url: "https://datascientist.fr/blog/top-10-des-metiers-de-la-data-a-surveiller-en-2025",
              description: "Panorama des roles data pour situer le Data Analyst dans l'ecosysteme.",
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
          video: {
            label: "DataScientest – Qu'est-ce qu'un Data Engineer ?",
            url: "https://www.youtube.com/watch?v=IeyYWxaMP3M",
          },
          articles: [
            {
              label: "Medium – Exploring the Roles of Data Engineer, Analyst, Scientist & ML Engineer",
              url: "https://medium.com/@adilshamim8/exploring-the-roles-of-data-engineer-analyst-scientist-ml-engineer-b4a2c8205d4d",
              description: "Comparaison detaillee des responsabilites et des competences attendues.",
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
          video: {
            label: "DataScientest – Que fait un Data Scientist ?",
            url: "https://www.youtube.com/watch?v=ixVR8uPetHQ",
          },
          articles: [
            {
              label: "Coursera – Data Engineer vs Data Scientist: What's the Difference?",
              url: "https://www.coursera.org/articles/data-engineer-vs-data-scientist",
              description: "Differencie les deux roles et leurs responsabilites en contexte pro.",
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
          video: {
            label: "Google Developers – Machine Learning Engineer explained",
            url: "https://www.youtube.com/watch?v=Gv9_4yMHFhI",
          },
          articles: [
            {
              label: "Aivancity – Les metiers de l'Intelligence Artificielle (IA) et de la Data",
              url: "https://www.aivancity.ai/les-metiers-de-lintelligence-artificielle-ia-et-de-la-data",
              description: "Explique comment les metiers s'articulent autour de l'IA et de la data.",
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
          video: {
            label: "L'Atelier Data – Data Scientist vs Data Analyst vs Data Engineer : quelles differences ?",
            url: "https://www.youtube.com/watch?v=mEZIHFxUFEc",
          },
          articles: [],
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
          title: "Introduction generale",
          text: [
            "Python est aujourd'hui le langage central des metiers de la data et de l'intelligence artificielle. Son succes ne repose pas sur un effet de mode, mais sur sa capacite a repondre efficacement a des besoins concrets : analyser des donnees, automatiser des traitements, construire des modeles et deployer des solutions exploitables. Contrairement a d'autres langages plus complexes ou plus rigides, Python privilegie la lisibilite et la simplicite, ce qui permet de se concentrer sur le raisonnement plutot que sur la syntaxe.",
            "Dans les metiers de la data, Python n'est pas appris pour \"savoir coder\", mais pour produire. Un Data Analyst l'utilise pour nettoyer et analyser des donnees. Un Data Engineer s'en sert pour automatiser des pipelines. Un Data Scientist l'emploie pour modeliser et experimenter. Un Machine Learning Engineer l'utilise pour integrer des modeles dans des applications reelles. Autrement dit, Python est un outil transversal, au coeur de toute la chaine data.",
            "Ce module pose les bases indispensables. Il ne vise pas a faire de toi un developpeur logiciel, mais a te donner une maitrise fonctionnelle de Python orientee donnees. Tu apprendras a manipuler des variables, a structurer des donnees, a ecrire des conditions et des boucles, et a comprendre les bibliotheques fondamentales utilisees en data. Ces bases sont indispensables : sans elles, il est impossible de comprendre les modules suivants consacres a la manipulation de donnees, au SQL, ou a la visualisation.",
            "Chez KORYXA School, Python est aborde comme un langage de resolution de problemes. Chaque concept presente dans ce module correspond a un usage reel dans un projet data. L'objectif n'est pas d'accumuler des notions abstraites, mais de construire progressivement une logique de travail claire, reutilisable et orientee livrables.",
          ],
          video: {
            label: "Machine Learnia - Variables + fonctions (debutant)",
            url: "https://www.youtube.com/watch?v=doFpNjdmsw8",
          },
        },
        {
          title: "Variables et types de donnees",
          text: [
            "En Python, une variable permet de stocker une information afin de la reutiliser ou de la transformer. Contrairement a d'autres langages, Python n'exige pas de declarer explicitement le type d'une variable. Le type est determine automatiquement en fonction de la valeur assignee. Cette flexibilite rend le langage accessible, mais elle impose aussi de bien comprendre les types de donnees pour eviter des erreurs logiques.",
            "Les types de base les plus utilises en data sont les entiers (int), les nombres decimaux (float), les chaines de caracteres (str) et les booleens (bool). Chaque type a un role precis. Par exemple, les entiers servent souvent a representer des quantites, les floats des mesures, les chaines du texte, et les booleens des conditions logiques. Une mauvaise comprehension des types peut conduire a des calculs errones ou a des analyses incoherentes.",
            "Dans un projet data reel, savoir identifier et manipuler correctement les types est essentiel, notamment lors du nettoyage des donnees ou de la lecture de fichiers externes. Cette partie constitue donc une base fondamentale pour tout le reste du parcours.",
          ],
          video: undefined,
        },
        {
          title: "Conditions (if / else)",
          text: [
            "Les conditions permettent a un programme de prendre des decisions. En data, elles sont omnipresentes : filtrer des lignes, appliquer des regles metier, classer des observations ou declencher des actions specifiques. La structure if / elif / else permet d'executer un bloc de code uniquement si une condition est remplie.",
            "Comprendre la logique conditionnelle est indispensable pour transformer des donnees brutes en informations exploitables. Par exemple, une condition peut servir a identifier des clients a risque, a separer des categories ou a verifier la validite d'une donnee. Une condition mal formulee peut fausser toute une analyse.",
            "Cette partie te permet d'acquerir une logique rigoureuse : apprendre a raisonner en termes de conditions claires et verifiables est une competence cle dans les metiers de la data.",
          ],
          video: {
            label: "Machine Learnia - Python IF/ELSE, WHILE, FOR (3/30)",
            url: "https://www.youtube.com/watch?v=x_Jeyvw7n9I",
          },
        },
        {
          title: "Boucles (for / while)",
          text: [
            "Les boucles servent a repeter automatiquement une operation sur un ensemble d'elements. En data, elles permettent de parcourir des listes, de traiter des fichiers ligne par ligne ou d'appliquer un calcul a plusieurs observations. Python propose principalement deux types de boucles : for et while.",
            "La boucle for est la plus utilisee en data, car elle permet de parcourir directement des collections de donnees. La boucle while est plus generale, mais doit etre utilisee avec prudence pour eviter les boucles infinies. Comprendre quand et comment utiliser chaque type de boucle est essentiel pour ecrire des scripts efficaces et lisibles.",
            "Meme si certaines bibliotheques data reduisent l'usage explicite des boucles, leur comprehension reste indispensable pour lire, comprendre et maintenir du code existant.",
          ],
          video: undefined,
        },
        {
          title: "Structures de donnees : listes et dictionnaires",
          text: [
            "Les structures de donnees permettent d'organiser l'information. Les listes servent a stocker des collections ordonnees d'elements, tandis que les dictionnaires permettent d'associer des cles a des valeurs. Ces deux structures sont omnipresentes en data, car elles permettent de representer des donnees complexes de maniere flexible.",
            "Une liste peut contenir des valeurs homogenes ou heterogenes, et elle est souvent utilisee pour stocker des observations ou des resultats intermediaires. Un dictionnaire, quant a lui, est ideal pour representer une entite avec plusieurs attributs, comme un utilisateur, un produit ou un enregistrement.",
            "Savoir manipuler ces structures est fondamental avant de passer a des outils plus avances comme Pandas.",
          ],
          video: {
            label: "DAAP - Listes, tuples et dictionnaires",
            url: "https://www.youtube.com/watch?v=IFaXato82p0",
          },
        },
        {
          title: "Fonctions et premieres bibliotheques data",
          text: [
            "Les fonctions permettent de regrouper du code reutilisable. Elles sont essentielles pour structurer un script, ameliorer sa lisibilite et eviter les repetitions. En data, les fonctions sont utilisees pour automatiser des calculs, appliquer des transformations ou standardiser des traitements.",
            "Cette partie introduit egalement NumPy et Pandas, deux bibliotheques fondamentales. NumPy permet de manipuler efficacement des tableaux numeriques, tandis que Pandas est concu pour travailler avec des donnees tabulaires. Ces outils seront approfondis dans les modules suivants, mais il est important d'en comprendre des maintenant le role et l'utilite.",
          ],
          video: {
            label: "DAAP - Bases de Pandas",
            url: "https://www.youtube.com/watch?v=N4atDiARNeM",
          },
        },
      ],
      resources: {
        articles: [
          {
            label: "OpenClassrooms - Initiez-vous a Python pour l'analyse de donnees",
            url: "https://openclassrooms.com/fr/courses/6204541-initiez-vous-a-python-pour-l-analyse-de-donnees",
          },
          {
            label: "Pandas - 10 minutes to pandas",
            url: "https://pandas.pydata.org/docs/user_guide/10min.html",
          },
          {
            label: "OpenClassrooms - Decouvrez les librairies Python pour la Data Science",
            url: "https://openclassrooms.com/fr/courses/7771531-decouvrez-les-librairies-python-pour-la-data-science",
          },
        ],
        videos: [
          { label: "Machine Learnia - Conditions + boucles (if / for / while)", url: "https://www.youtube.com/watch?v=x_Jeyvw7n9I" },
          { label: "DAAP - Listes / tuples / dictionnaires", url: "https://www.youtube.com/watch?v=IFaXato82p0" },
          { label: "DAAP - Bases de Pandas (DataFrame)", url: "https://www.youtube.com/watch?v=N4atDiARNeM" },
        ],
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
          title: "Lecture et inspection des donnees",
          text: [
            "La premiere etape consiste a charger correctement les donnees. En Python, on utilise principalement read_csv et read_excel pour importer des fichiers. Une fois le fichier charge, il faut verifier rapidement son contenu : combien de lignes, quelles colonnes, quels types, et quelles valeurs.",
            "Les methodes head, info et describe donnent une vue rapide et fiable. head permet de voir les premieres lignes, info affiche les types et les valeurs manquantes, et describe donne des statistiques utiles. Ces commandes simples evitent des erreurs couteuses plus tard.",
            "Dans un contexte professionnel, cette inspection est essentielle pour detecter des colonnes mal typees, des valeurs inattendues, ou des formats non standards. Une bonne lecture des donnees permet de gagner un temps considerable sur le nettoyage.",
          ],
          video: {
            label: "Machine Learnia - Lire et explorer des donnees avec Pandas",
            url: "https://www.youtube.com/watch?v=vmEHCJofslg",
          },
          articles: [
            {
              label: "Pandas - Intro to data structures",
              url: "https://pandas.pydata.org/docs/user_guide/dsintro.html",
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
          video: {
            label: "dataisto - Pandas : valeurs manquantes",
            url: "https://www.youtube.com/watch?v=SVPJx_uNVjY",
          },
          articles: [
            {
              label: "Pandas - Missing data",
              url: "https://pandas.pydata.org/docs/user_guide/missing_data.html",
            },
          ],
        },
        {
          title: "Filtrage, tri et selection",
          text: [
            "Une fois les donnees propres, il faut pouvoir selectionner ce qui est utile. Le filtrage permet de garder uniquement les lignes pertinentes, le tri aide a ordonner les observations, et la selection de colonnes evite de manipuler des informations inutiles.",
            "Les filtres conditionnels en Pandas utilisent des expressions logiques : df[df['col'] > seuil], df[df['statut'] == 'actif'], etc. Le tri se fait avec sort_values, et la selection avec des listes de colonnes ou l'indexation par nom.",
            "Ces operations sont indispensables pour preparer un dataset cible, construire une analyse par segment, ou produire un fichier nettoye pour une autre equipe.",
          ],
          video: {
            label: "dataisto - Filtrer avec Pandas (.loc)",
            url: "https://www.youtube.com/watch?v=ZWS6ckhYFKE",
          },
          articles: [
            {
              label: "Pandas - Indexing and selecting data",
              url: "https://pandas.pydata.org/docs/user_guide/indexing.html",
            },
          ],
        },
        {
          title: "Agregations et groupby",
          text: [
            "L'agregation permet de resumer un jeu de donnees. Avec groupby, on peut calculer des moyennes, des sommes ou des comptes par categorie. C'est la base des indicateurs qu'on retrouve dans les tableaux de bord.",
            "Exemples : moyenne des ventes par region, nombre de clients par segment, total par periode. Les fonctions d'agregation (mean, sum, count, min, max) transforment la donnee brute en information decisionnelle.",
            "Dans les projets KORYXA, ces agregats sont souvent le coeur du livrable : ils permettent de produire des insights clairs et d'alimenter des visualisations utiles.",
          ],
          video: {
            label: "astro__pat - La methode GROUPBY avec Pandas",
            url: "https://www.youtube.com/watch?v=J-d-AzyNTTI",
          },
          articles: [
            {
              label: "Pandas - Group by",
              url: "https://pandas.pydata.org/docs/user_guide/groupby.html",
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
        description: "Lecture CSV, inspection, nettoyage, filtres, et agregations.",
        code: "import pandas as pd\nfrom io import StringIO\n\n# Chargement CSV (exemple)\nraw = StringIO(\"\"\"region,produit,vente,statut\\nNord,A,120,actif\\nNord,A,120,actif\\nSud,B,,inactif\\nOuest,C,90,actif\\n\"\"\")\n\ndf = pd.read_csv(raw)\nprint(df.head())\nprint(df.info())\nprint(df.describe(include=\"all\"))\n\n# Nettoyage\nprint(df.isna().sum())\ndf = df.drop_duplicates()\ndf[\"vente\"] = df[\"vente\"].fillna(df[\"vente\"].median())\ndf[\"statut\"] = df[\"statut\"].astype(\"category\")\n\n# Filtrage et selection\nactifs = df[df[\"statut\"] == \"actif\"]\nactifs = actifs.sort_values(by=\"vente\", ascending=False)\nactifs = actifs[[\"region\", \"produit\", \"vente\"]]\n\n# Aggregations\ntotal_par_region = actifs.groupby(\"region\")[\"vente\"].sum().reset_index()\nprint(total_par_region)",
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
          prompt: "Que fait groupby ?",
          options: ["Regrouper et agreger par categorie", "Supprimer des NA", "Creer un fichier Excel"],
          answerIndex: 0,
          explanation: "groupby sert a calculer des indicateurs par groupe.",
        },
        {
          prompt: "Quel indicateur simple peut etre calcule avec groupby ?",
          options: ["Somme par region", "Couleur du logo", "Nom du fichier"],
          answerIndex: 0,
          explanation: "La somme par groupe est un cas classique.",
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
          title: "Introduction generale",
          text: [
            "Le SQL est le langage central de la donnee structuree. Dans la plupart des organisations, les informations utiles vivent dans des bases relationnelles : commandes, utilisateurs, stocks, operations, finances. Savoir ecrire une requete SQL fiable permet d'extraire, filtrer, agreger et structurer l'information au plus pres de la source, sans dependance a des outils intermediaires.",
            "Ce module pose les fondations indispensables : comprendre les notions de tables, colonnes, cles et relations, puis ecrire des requetes claires (SELECT, WHERE, JOIN, GROUP BY). L'objectif n'est pas la performance extreme, mais la justesse, la lisibilite et la reproductibilite des requetes. Ce sont trois criteres essentiels pour produire des livrables professionnels defendables.",
            "Un bon analyste ne se contente pas de recuperer des chiffres : il sait expliquer d'ou ils viennent, comment ils ont ete calculees, et pourquoi ils sont fiables. SQL donne cette capacite en rendant chaque etape du raisonnement explicite. C'est pour cela que SQL est un prerequis central en data, quel que soit le role.",
            "Enfin, ce module introduit un premier pont entre SQL et Python. Beaucoup de missions demandent d'extraire des donnees en SQL puis de les analyser ou de les visualiser en Python. Tu apprendras donc a relier les deux sans complexite inutile, pour produire rapidement des resultats exploitables.",
            "Dans un contexte KORYXA, cette maitrise permet de repondre a des besoins concrets : extraire des ventes par region, verifier la qualite d'un jeu de donnees, mesurer l'impact d'une campagne, ou preparer un tableau de bord. Les decisions business reposent sur ces extractions, donc la rigueur de la requete est decisive.",
            "SQL est aussi un langage de collaboration. Une requete claire peut etre relue, verifiee et amelioree par un autre membre de l'equipe. Cette transparence est essentielle pour garantir des livrables utilisables et defendables devant une organisation.",
          ],
        },
        {
          title: "Mise en place de l'environnement SQL",
          text: [
            "Pour la V1, KORYXA utilise SQLite, inclus par defaut avec Python. Aucune installation serveur SQL n'est requise.",
            "Deux videos sont proposees pour la mise en place SQL. SQLite est utilise pour la V1 et ne necessite aucune installation serveur. Choisissez la video qui vous convient le mieux.",
            "L'idee est simple : tu crees une base locale, tu definis des tables, puis tu ecris des requetes SQL pour interroger les donnees. Cette approche suffit pour apprendre les fondamentaux et produire des exercices realistes sans complexite d'infrastructure.",
            "Dans les missions KORYXA, SQLite est souvent suffisante pour les prototypes et les preuves de concept. Les notions apprises ici seront identiques quand tu passeras a MySQL, PostgreSQL ou d'autres bases en entreprise.",
          ],
          videos: [
            {
              label: "Utiliser SQLite avec Python (aucune installation serveur)",
              url: "https://www.youtube.com/watch?v=Zx8n2bYv4eI",
              tag: "Principale",
            },
            {
              label: "SQLite / SQL pour debutants (FR)",
              url: "https://www.youtube.com/watch?v=JiEoZ8Z9oUQ",
              tag: "Alternative (FR)",
            },
          ],
          articles: [
            {
              label: "Python - sqlite3",
              url: "https://docs.python.org/3/library/sqlite3.html",
              description: "Documentation officielle pour creer, interroger et manipuler une base SQLite en Python.",
            },
          ],
        },
        {
          title: "Concepts fondamentaux des bases de donnees",
          text: [
            "Une base relationnelle organise la donnee en tables. Chaque table contient des lignes (enregistrements) et des colonnes (champs). Les cles primaires identifient chaque ligne de maniere unique, et les cles etrangeres relient les tables entre elles.",
            "Le schema relationnel definit comment les tables se connectent. C'est ce qui garantit la coherence de la donnee et permet d'eviter les duplications inutiles. SQL est le langage qui permet de parcourir ce schema avec precision.",
            "SQL se distingue d'un tableur : un tableur est manuel et fragile, alors qu'une base relationnelle impose des regles claires et des contraintes. C'est cette rigueur qui rend les resultats fiables dans un contexte professionnel.",
          ],
          video: {
            label: "Grafikart - Introduction aux bases de donnees & SQL",
            url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
          },
          articles: [
            {
              label: "SQLite - About SQLite",
              url: "https://www.sqlite.org/about.html",
              description: "Presentation officielle de SQLite et de son fonctionnement.",
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
          video: {
            label: "Grafikart - SQL : requetes de base",
            url: "https://www.youtube.com/watch?v=7S_tz1z_5bA",
          },
          articles: [
            {
              label: "SQLite - SELECT statement",
              url: "https://www.sqlite.org/lang_select.html",
              description: "Reference officielle sur SELECT, WHERE, ORDER BY et LIMIT.",
            },
          ],
        },
        {
          title: "Jointures et agregations",
          text: [
            "Les jointures permettent de combiner des informations provenant de plusieurs tables. INNER JOIN garde les lignes qui matchent dans les deux tables, alors que LEFT JOIN garde toutes les lignes de la table principale.",
            "Les agregations (COUNT, SUM, AVG) transforment des lignes detaillees en indicateurs. Avec GROUP BY, tu peux calculer des totaux par categorie, par region ou par periode.",
            "Les erreurs frequentes viennent d'une jointure mal definie ou d'un GROUP BY incomplet. Apprendre a verifier le resultat est essentiel pour eviter des conclusions fausses.",
          ],
          video: {
            label: "Grafikart - SQL : jointures et GROUP BY",
            url: "https://www.youtube.com/watch?v=9yeOJ0ZMUYw",
          },
          articles: [
            {
              label: "SQLite - JOIN clause",
              url: "https://www.sqlite.org/lang_select.html#joins",
              description: "Reference officielle sur les jointures dans SQLite.",
            },
          ],
        },
        {
          title: "SQL et Python",
          text: [
            "SQLite se manipule directement depuis Python via le module sqlite3. Tu peux creer des tables, executer des requetes SQL, puis charger les resultats dans Pandas pour analyser ou visualiser.",
            "Cette passerelle est tres utile : tu recuperes des donnees propres avec SQL, puis tu produis des analyses rapides avec Python. C'est une competence cle pour livrer vite et bien sur des missions reelles.",
            "Dans la pratique, on alterne souvent entre SQL et Python. Ce module te donne un premier workflow simple et reproductible pour cela.",
          ],
        },
      ],
      resources: {
        videos: [
          {
            label: "Optionnel - MySQL avec Grafikart",
            url: "https://www.youtube.com/watch?v=K6wK0FZKk1Y",
          },
        ],
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
          video: {
            label: "Machine Learnia - Pourquoi visualiser les donnees ?",
            url: "https://www.youtube.com/watch?v=Z6g7Y9Zt6n4",
          },
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
          video: {
            label: "DataScientest - Les graphiques essentiels en data analysis",
            url: "https://www.youtube.com/watch?v=9ZxP4F0yZxE",
          },
          articles: [
            {
              label: "Data to Viz - Choose the right chart",
              url: "https://www.data-to-viz.com/chart_types.html",
              description: "Panorama des types de graphiques et leurs usages.",
            },
          ],
        },
        {
          title: "Visualisation avec Python (Matplotlib & Seaborn)",
          text: [
            "Matplotlib est la bibliotheque de base pour tracer des graphiques en Python. Seaborn vient dessus pour ameliorer la lisibilite et proposer des graphiques statistiques plus propres.",
            "L'objectif ici est de produire des visuels simples : bar chart, line chart, scatter plot. On y ajoute des titres, des labels et des legendes pour que le message soit clair.",
            "Ces graphiques servent ensuite de base pour des rapports plus complets ou des dashboards.",
          ],
          video: {
            label: "Machine Learnia - Visualisation avec Matplotlib et Seaborn",
            url: "https://www.youtube.com/watch?v=Z6g7Y9Zt6n4",
          },
          articles: [
            {
              label: "Matplotlib - Pyplot tutorial",
              url: "https://matplotlib.org/stable/tutorials/introductory/pyplot.html",
              description: "Documentation officielle pour creer des graphiques simples.",
            },
          ],
        },
        {
          title: "Lire et interpreter un graphique",
          text: [
            "Lire un graphique, c'est comprendre l'axe, l'echelle et le message principal. Une tendance peut etre montante, stable ou en rupture.",
            "Il faut aussi repere les anomalies : points isoles, pics anormaux, ou effets de saisonnalite. Ces elements orientent l'analyse.",
            "Une mauvaise interpretation vient souvent d'une echelle trompeuse ou d'un graphique mal choisi. L'important est de rester fidele a la realite des donnees.",
          ],
          video: {
            label: "Science4All - Lire et interpreter des graphiques",
            url: "https://www.youtube.com/watch?v=9Jm9jzZ0p4U",
          },
          articles: [
            {
              label: "Storytelling with Data - Principles",
              url: "https://www.storytellingwithdata.com/blog",
              description: "Principes de lecture et de narration a partir de graphiques.",
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

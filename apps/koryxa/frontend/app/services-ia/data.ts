export type ServiceIaBlock = "revenu" | "productivite" | "digital";

export type ServiceIaItem = {
  slug: string;
  block: ServiceIaBlock;
  title: string;
  shortLabel: string;
  summary: string;
  outcomes: string[];
};

export type ServiceIaQuestionInput = "text" | "textarea" | "radio" | "checkbox" | "select";

export type ServiceIaQuestionOption = {
  value: string;
  label: string;
};

export type ServiceIaQuestion = {
  key: string;
  label: string;
  input: ServiceIaQuestionInput;
  required?: boolean;
  placeholder?: string;
  helper?: string;
  options?: ServiceIaQuestionOption[];
};

export const SERVICE_IA_BLOCKS: Array<{ id: ServiceIaBlock; title: string; subtitle: string }> = [
  {
    id: "revenu",
    title: "Bloc 1: Faites plus d'argent avec vos donnees",
    subtitle: "Pilotage, prediction, optimisation des marges.",
  },
  {
    id: "productivite",
    title: "Bloc 2: Travaillez moins, produisez plus",
    subtitle: "Automatisation, assistants IA, flux operationnels.",
  },
  {
    id: "digital",
    title: "Bloc 3: Presence digitale et systeme",
    subtitle: "Sites, apps, systeme integre et securite des donnees.",
  },
];

export const SERVICE_IA_ITEMS: ServiceIaItem[] = [
  {
    slug: "maitrisez-vos-chiffres",
    block: "revenu",
    shortLabel: "Pilotage business",
    title: "Maitrisez vos chiffres en temps reel",
    summary: "Tableaux de bord ventes, marges et stocks avec alertes utiles pour decider vite.",
    outcomes: ["Visibilite quotidienne des KPI", "Alertes automatiques", "Decision guidee par les faits"],
  },
  {
    slug: "vendez-plus-par-prediction",
    block: "revenu",
    shortLabel: "Prediction ventes",
    title: "Vendez plus en predisant ce qui marche",
    summary: "Prevoir la demande, identifier les clients a risque et optimiser votre offre.",
    outcomes: ["Forecast demande", "Segmentation clients", "Priorisation commerciale"],
  },
  {
    slug: "reduisez-vos-couts",
    block: "revenu",
    shortLabel: "Optimisation couts",
    title: "Reduisez vos couts, gardez les marges",
    summary: "Diagnostic des pertes et simulation de scenarios avant changement.",
    outcomes: ["Cartographie des pertes", "Plan d'economie 10-30%", "Simulation d'impact"],
  },
  {
    slug: "assistant-ia-metier",
    block: "productivite",
    shortLabel: "Assistant IA",
    title: "Un assistant IA qui execute avec vous",
    summary: "Assistant 24/7 pour support client, demandes internes et operations recurrentes.",
    outcomes: ["Reponse continue", "Gain de temps equipe", "Qualite de service stable"],
  },
  {
    slug: "robots-automatisation",
    block: "productivite",
    shortLabel: "Automatisation",
    title: "Des robots qui suppriment le travail mecanique",
    summary: "Automatisation des saisies, formulaires, controles et synchronisations.",
    outcomes: ["Moins d'erreurs humaines", "Taches repetitives eliminees", "Execution plus rapide"],
  },
  {
    slug: "optimisez-vos-process",
    block: "productivite",
    shortLabel: "Workflow",
    title: "Organisez votre flux pour aller plus vite",
    summary: "Reconfiguration des etapes metier pour enlever le gaspillage et accelerer les cycles.",
    outcomes: ["Delais reduits", "Roles clarifies", "Flux operationnel simplifie"],
  },
  {
    slug: "site-web-intelligent",
    block: "digital",
    shortLabel: "Web intelligent",
    title: "Site web intelligent",
    summary: "Presence digitale professionnelle pour vendre, informer et capter des leads 24/7.",
    outcomes: ["Site rapide et responsive", "Conversion amelioree", "Base technique evolutive"],
  },
  {
    slug: "application-mobile",
    block: "digital",
    shortLabel: "Mobile",
    title: "Application mobile",
    summary: "Application Android/iOS adaptee a vos usages metier, meme avec contraintes terrain.",
    outcomes: ["Usage partout", "Mode offline selon besoin", "Process metier mobile"],
  },
  {
    slug: "systeme-entreprise-integre",
    block: "digital",
    shortLabel: "Systeme integre",
    title: "Tout votre entreprise dans un seul systeme",
    summary: "Centralisation ventes, achats, stock, finance et pilotage dans un systeme unifie.",
    outcomes: ["Donnees unifiees", "Operations tracees", "Rapports centralises"],
  },
  {
    slug: "securite-sauvegarde-donnees",
    block: "digital",
    shortLabel: "Securite data",
    title: "Donnees protegees et toujours disponibles",
    summary: "Sauvegarde, securite d'acces, reprise et monitoring pour eviter les pertes critiques.",
    outcomes: ["Sauvegardes fiables", "Acces securise", "Continuite de service"],
  },
];

export const SERVICE_IA_MARKETING_POINTS: Array<{ label: string; value: string }> = [
  { label: "Offres executees", value: "10 services" },
  { label: "Delai de qualification", value: "72h" },
  { label: "Mode de delivery", value: "Equipe dediee" },
  { label: "Pilotage", value: "Transparence totale" },
];

const YES_NO_OPTIONS: ServiceIaQuestionOption[] = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
];

const DEFAULT_QUESTION_SET: ServiceIaQuestion[] = [
  {
    key: "resultat_cible",
    label: "Quel resultat concret voulez-vous obtenir ?",
    input: "textarea",
    required: true,
    placeholder: "Ex: gain de temps, baisse des erreurs, croissance des ventes.",
  },
  {
    key: "blocage_actuel",
    label: "Quel est le principal blocage actuel ?",
    input: "textarea",
    required: true,
    placeholder: "Ex: process manuel, manque de suivi, outils non connectes.",
  },
  {
    key: "outils_actuels",
    label: "Quels outils utilisez-vous aujourd'hui ?",
    input: "text",
    required: false,
    placeholder: "Ex: Excel, ERP, CRM, WhatsApp.",
  },
];

export const SERVICE_IA_QUESTION_SET: Record<string, ServiceIaQuestion[]> = {
  "maitrisez-vos-chiffres": [
    {
      key: "frequence_pilotage",
      label: "A quelle frequence voulez-vous piloter vos KPI ?",
      input: "select",
      required: true,
      options: [
        { value: "quotidien", label: "Quotidien" },
        { value: "hebdomadaire", label: "Hebdomadaire" },
        { value: "mensuel", label: "Mensuel" },
      ],
    },
    {
      key: "kpi_prioritaires",
      label: "Quels KPI sont prioritaires ? (plusieurs choix possibles)",
      input: "checkbox",
      required: true,
      options: [
        { value: "ventes", label: "Ventes" },
        { value: "marge", label: "Marge" },
        { value: "stock", label: "Stock" },
        { value: "cash", label: "Cash" },
        { value: "clients", label: "Clients actifs" },
      ],
    },
    {
      key: "sources_donnees",
      label: "Vos donnees viennent de quelles sources ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "excel", label: "Excel / Google Sheets" },
        { value: "erp", label: "ERP" },
        { value: "crm", label: "CRM" },
        { value: "caisse", label: "Caisse / POS" },
        { value: "autre", label: "Autre" },
      ],
    },
    {
      key: "alertes_metier",
      label: "Quelles alertes voulez-vous recevoir en priorite ?",
      input: "textarea",
      required: true,
      placeholder: "Ex: rupture stock, chute marge, retard recouvrement.",
    },
  ],
  "vendez-plus-par-prediction": [
    {
      key: "objectif_prediction",
      label: "Quel objectif principal visez-vous ?",
      input: "radio",
      required: true,
      options: [
        { value: "prevoir_ventes", label: "Prevoir les ventes" },
        { value: "fideliser_clients", label: "Fideliser les clients" },
        { value: "augmenter_panier", label: "Augmenter le panier moyen" },
      ],
    },
    {
      key: "canaux_vente",
      label: "Sur quels canaux vendez-vous ? (plusieurs choix)",
      input: "checkbox",
      required: true,
      options: [
        { value: "boutique", label: "Boutique physique" },
        { value: "ecommerce", label: "E-commerce" },
        { value: "whatsapp", label: "WhatsApp / reseaux sociaux" },
        { value: "b2b", label: "Commercial B2B" },
      ],
    },
    {
      key: "historique_donnees",
      label: "Avez-vous un historique de ventes exploitable ?",
      input: "radio",
      required: true,
      options: [
        { value: "oui", label: "Oui, propre" },
        { value: "partiel", label: "Partiel" },
        { value: "non", label: "Non / a structurer" },
      ],
    },
    {
      key: "decision_a_prendre",
      label: "Quelle decision devez-vous prendre avec cette prediction ?",
      input: "textarea",
      required: true,
      placeholder: "Ex: plan promos, allocation stock, relance commerciale.",
    },
  ],
  "reduisez-vos-couts": [
    {
      key: "zone_couts",
      label: "Quels postes de cout voulez-vous optimiser ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "achats", label: "Achats" },
        { value: "logistique", label: "Logistique" },
        { value: "operations", label: "Operations" },
        { value: "rh", label: "RH" },
      ],
    },
    {
      key: "symptomes_perte",
      label: "Quels symptomes observez-vous ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "retards", label: "Retards frequents" },
        { value: "erreurs", label: "Erreurs recurrentes" },
        { value: "surstock", label: "Surstock / immobilisation" },
        { value: "gaspillage", label: "Gaspillage operationnel" },
      ],
    },
    {
      key: "objectif_economie",
      label: "Quel objectif d'economie ciblez-vous ?",
      input: "select",
      required: true,
      options: [
        { value: "5_10", label: "5% a 10%" },
        { value: "10_20", label: "10% a 20%" },
        { value: "20_plus", label: "20% et plus" },
      ],
    },
    {
      key: "horizon_decision",
      label: "A quel horizon voulez-vous lancer les actions ?",
      input: "radio",
      required: true,
      options: [
        { value: "30j", label: "Sous 30 jours" },
        { value: "90j", label: "Sous 90 jours" },
        { value: "6m", label: "Sous 6 mois" },
      ],
    },
  ],
  "assistant-ia-metier": [
    {
      key: "assistant_canal",
      label: "Sur quels canaux l'assistant doit-il intervenir ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "whatsapp", label: "WhatsApp" },
        { value: "telegram", label: "Telegram" },
        { value: "webchat", label: "Webchat" },
        { value: "email", label: "Email" },
      ],
    },
    {
      key: "assistant_missions",
      label: "Quelles missions donner a l'assistant ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "support_client", label: "Support client" },
        { value: "faq", label: "FAQ / reponses standard" },
        { value: "prise_commande", label: "Prise de commande" },
        { value: "support_interne", label: "Support interne / RH" },
      ],
    },
    {
      key: "langue_service",
      label: "Langue principale de service",
      input: "select",
      required: true,
      options: [
        { value: "fr", label: "Francais" },
        { value: "en", label: "Anglais" },
        { value: "bi", label: "Bilingue" },
      ],
    },
    {
      key: "escalade_humaine",
      label: "Voulez-vous une escalade vers un humain sur les cas sensibles ?",
      input: "radio",
      required: true,
      options: YES_NO_OPTIONS,
    },
  ],
  "robots-automatisation": [
    {
      key: "taches_repetitives",
      label: "Quelles taches repetitives voulez-vous automatiser en priorite ?",
      input: "textarea",
      required: true,
      placeholder: "Ex: saisie facture, mise a jour CRM, relances email.",
    },
    {
      key: "systemes_connectes",
      label: "Quels systemes doivent etre connectes ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "excel", label: "Excel / Sheets" },
        { value: "erp", label: "ERP" },
        { value: "crm", label: "CRM" },
        { value: "email", label: "Email" },
        { value: "api", label: "API metier" },
      ],
    },
    {
      key: "volume_journalier",
      label: "Volume journalier a traiter",
      input: "select",
      required: true,
      options: [
        { value: "moins_100", label: "Moins de 100 operations/jour" },
        { value: "100_500", label: "100 a 500 operations/jour" },
        { value: "500_plus", label: "Plus de 500 operations/jour" },
      ],
    },
    {
      key: "priorite_automatisation",
      label: "Priorite principale",
      input: "radio",
      required: true,
      options: [
        { value: "vitesse", label: "Gagner du temps" },
        { value: "qualite", label: "Reduire les erreurs" },
        { value: "cout", label: "Reduire les couts" },
      ],
    },
  ],
  "optimisez-vos-process": [
    {
      key: "process_cible",
      label: "Quel process voulez-vous optimiser ?",
      input: "text",
      required: true,
      placeholder: "Ex: vente -> livraison, onboarding client, support.",
    },
    {
      key: "blocages_process",
      label: "Quels blocages observez-vous ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "attente", label: "Temps d'attente eleve" },
        { value: "validation", label: "Validation trop lente" },
        { value: "double_saisie", label: "Double saisie" },
        { value: "manque_visibilite", label: "Manque de visibilite" },
      ],
    },
    {
      key: "equipes_impliquees",
      label: "Equipes impliquees",
      input: "checkbox",
      required: true,
      options: [
        { value: "commercial", label: "Commercial" },
        { value: "operations", label: "Operations" },
        { value: "finance", label: "Finance" },
        { value: "support", label: "Support client" },
      ],
    },
    {
      key: "gain_attendu",
      label: "Gain attendu",
      input: "select",
      required: true,
      options: [
        { value: "delai", label: "Reduction delai" },
        { value: "qualite", label: "Amelioration qualite" },
        { value: "capacite", label: "Hausse capacite de traitement" },
      ],
    },
  ],
  "site-web-intelligent": [
    {
      key: "besoin_site",
      label: "Avez-vous besoin d'un nouveau site web ?",
      input: "radio",
      required: true,
      options: YES_NO_OPTIONS,
    },
    {
      key: "etat_site_existant",
      label: "Avez-vous deja un site a ameliorer ?",
      input: "radio",
      required: true,
      options: [
        { value: "pas_de_site", label: "Je n'ai pas encore de site" },
        { value: "ameliorer", label: "Oui, je veux l'ameliorer" },
        { value: "refonte", label: "Oui, je veux une refonte complete" },
      ],
    },
    {
      key: "secteur_activite",
      label: "Votre secteur d'activite",
      input: "text",
      required: true,
      placeholder: "Ex: sante, retail, education, logistique.",
    },
    {
      key: "type_site",
      label: "Type de site souhaite (plusieurs choix)",
      input: "checkbox",
      required: true,
      options: [
        { value: "vitrine", label: "Site vitrine" },
        { value: "ecommerce", label: "E-commerce" },
        { value: "reservation", label: "Reservation / prise RDV" },
        { value: "portail", label: "Portail client" },
      ],
    },
    {
      key: "domaine",
      label: "Nom de domaine souhaite (si deja choisi)",
      input: "text",
      required: false,
      placeholder: "Ex: monentreprise.com",
    },
  ],
  "application-mobile": [
    {
      key: "cible_app",
      label: "Qui utilisera principalement l'application ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "equipes", label: "Equipes internes" },
        { value: "clients", label: "Clients" },
        { value: "partenaires", label: "Partenaires" },
      ],
    },
    {
      key: "plateformes",
      label: "Plateformes ciblees",
      input: "checkbox",
      required: true,
      options: [
        { value: "android", label: "Android" },
        { value: "ios", label: "iOS" },
        { value: "webapp", label: "Web app progressive" },
      ],
    },
    {
      key: "actions_cles",
      label: "Quelles actions critiques doivent etre possibles ?",
      input: "textarea",
      required: true,
      placeholder: "Ex: prise commande, suivi livraison, validation terrain.",
    },
    {
      key: "mode_offline",
      label: "Avez-vous besoin d'un mode offline ?",
      input: "radio",
      required: true,
      options: YES_NO_OPTIONS,
    },
  ],
  "systeme-entreprise-integre": [
    {
      key: "fonctions_unifier",
      label: "Quelles fonctions souhaitez-vous unifier ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "ventes", label: "Ventes" },
        { value: "achats", label: "Achats" },
        { value: "stock", label: "Stock" },
        { value: "finance", label: "Finance" },
        { value: "rh", label: "RH" },
      ],
    },
    {
      key: "outils_fragmentes",
      label: "Quels outils utilisez-vous actuellement ?",
      input: "textarea",
      required: true,
      placeholder: "Ex: Excel, WhatsApp, logiciel local, ERP partiel.",
    },
    {
      key: "mode_deploiement",
      label: "Mode de deploiement prefere",
      input: "radio",
      required: true,
      options: [
        { value: "cloud", label: "Cloud" },
        { value: "local", label: "Sur serveur local" },
        { value: "hybride", label: "Hybride" },
      ],
    },
    {
      key: "priorite_systeme",
      label: "Priorite principale",
      input: "radio",
      required: true,
      options: [
        { value: "visibilite", label: "Mieux piloter l'activite" },
        { value: "fiabilite", label: "Fiabiliser les operations" },
        { value: "vitesse", label: "Accelerer les traitements" },
      ],
    },
  ],
  "securite-sauvegarde-donnees": [
    {
      key: "donnees_critique",
      label: "Quelles donnees sont les plus critiques ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "clients", label: "Donnees clients" },
        { value: "finance", label: "Donnees financieres" },
        { value: "operations", label: "Donnees operations" },
        { value: "rh", label: "Donnees RH" },
      ],
    },
    {
      key: "strategie_backup",
      label: "Avez-vous deja une strategie de sauvegarde ?",
      input: "radio",
      required: true,
      options: [
        { value: "quotidienne", label: "Oui, quotidienne" },
        { value: "hebdo", label: "Oui, hebdomadaire" },
        { value: "ponctuelle", label: "Sauvegardes ponctuelles" },
        { value: "aucune", label: "Aucune strategie claire" },
      ],
    },
    {
      key: "incidents_connus",
      label: "Incidents deja rencontres",
      input: "checkbox",
      required: false,
      options: [
        { value: "perte", label: "Perte de donnees" },
        { value: "acces", label: "Acces non autorise" },
        { value: "ransomware", label: "Tentative ransomware" },
        { value: "aucun", label: "Aucun incident majeur" },
      ],
    },
    {
      key: "objectif_reprise",
      label: "Objectif de reprise apres incident",
      input: "select",
      required: true,
      options: [
        { value: "2h", label: "Moins de 2 heures" },
        { value: "24h", label: "Moins de 24 heures" },
        { value: "48h", label: "Moins de 48 heures" },
      ],
    },
  ],
};

export function getServiceIaBySlug(slug: string): ServiceIaItem | undefined {
  return SERVICE_IA_ITEMS.find((item) => item.slug === slug);
}

export function getServiceQuestionSet(slug: string): ServiceIaQuestion[] {
  return SERVICE_IA_QUESTION_SET[slug] ?? DEFAULT_QUESTION_SET;
}

export function getQuestionOptionLabel(question: ServiceIaQuestion, value: string): string {
  return question.options?.find((opt) => opt.value === value)?.label ?? value;
}

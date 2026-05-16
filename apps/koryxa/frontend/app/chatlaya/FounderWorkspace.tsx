"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Users, Target, Package, DollarSign, BarChart2, MessageCircle, FileText,
  Check, RotateCcw, ArrowRight, X, Sparkles, ChevronLeft,
  Copy, Download, BookOpen, PenLine, AlertCircle, UserRound, Menu, Archive,
  MessageSquarePlus, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { CHATLAYA_AUTONOMOUS_HOST, getChatlayaApiBase, SITE_BASE_URL } from "@/lib/env";

function apiUrl(path: string): string {
  return `${getChatlayaApiBase().replace(/\/$/, "")}${path}`;
}

const FOUNDER_AUTH_REDIRECT = `https://${CHATLAYA_AUTONOMOUS_HOST}/`;

function resolveFounderAuthHref(path: "/login" | "/signup", fallback?: string): string {
  if (typeof window !== "undefined") {
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.hash = "";
      const redirectTarget =
        currentUrl.hostname === CHATLAYA_AUTONOMOUS_HOST
          ? currentUrl.toString()
            : currentUrl.pathname.startsWith("/chatlaya")
              ? `${currentUrl.pathname}${currentUrl.search}`
              : FOUNDER_AUTH_REDIRECT;
      return `${SITE_BASE_URL}/chatlaya/auth${path}?redirect=${encodeURIComponent(redirectTarget)}`;
    } catch {
      // Fall through to the server-safe fallback below.
    }
  }
  return fallback || `${SITE_BASE_URL}/chatlaya/auth${path}?redirect=${encodeURIComponent(FOUNDER_AUTH_REDIRECT)}`;
}

function resolveFounderLoginHref(fallback?: string): string {
  return resolveFounderAuthHref("/login", fallback);
}

function resolveFounderSignupHref(fallback?: string): string {
  return resolveFounderAuthHref("/signup", fallback);
}

// ─── Types ──────────────────────────────────────────────────────────────────

type ModuleStatus = "empty" | "in_progress" | "completed";

type InputFieldDef = {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea";
  optional?: boolean;
  rows?: number;
};

type ModuleDef = {
  id: string;
  step: number;
  label: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  inputs: InputFieldDef[];
  optional?: boolean;
};

type ModuleState = {
  inputs: Record<string, string>;
  output: string | null;
  previousOutput?: string | null;
  previousRetention?: string | null;
  status: ModuleStatus;
  retention?: string;
  finalFeedback?: string;
};

type WorkspaceData = Record<string, ModuleState>;

type FounderConversation = {
  conversation_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  archived?: boolean;
  assistant_mode?: "general" | "launch_structure_sell";
};

// ─── Module definitions ─────────────────────────────────────────────────────

const MODULES: ModuleDef[] = [
  {
    id: "client",
    step: 1,
    label: "Client cible",
    tagline: "À qui vous adressez-vous ?",
    description: "Définissez précisément votre client idéal — qui il est, ce qui le motive, comment le trouver.",
    icon: Users,
    inputs: [
      {
        id: "activite",
        label: "Décrivez votre activité en 1-2 phrases",
        placeholder: "Ex : Je propose des formations pour apprendre à créer des vêtements africains modernes depuis chez soi…",
        type: "textarea",
        rows: 2,
      },
      {
        id: "client_idee",
        label: "À qui vendez-vous selon vous ? (soyez précis)",
        placeholder: "Ex : Femmes de 25-45 ans qui veulent créer leur propre marque de mode africaine mais ne savent pas coudre…",
        type: "textarea",
        rows: 2,
      },
    ],
  },
  {
    id: "probleme",
    step: 2,
    label: "Problème",
    tagline: "Quel problème résolvez-vous ?",
    description: "Formulez clairement la douleur de votre client — ce qu'il perd sans votre solution.",
    icon: Target,
    inputs: [
      {
        id: "probleme_idee",
        label: "Quel est le problème principal de votre client ?",
        placeholder: "Ex : Ils veulent se lancer dans la couture africaine mais les formations classiques sont trop chères et éloignées…",
        type: "textarea",
        rows: 3,
      },
    ],
  },
  {
    id: "offre",
    step: 3,
    label: "Offre & Valeur",
    tagline: "Que proposez-vous exactement ?",
    description: "Structurez votre offre et formulez ce que le client gagne ou évite grâce à vous.",
    icon: Package,
    inputs: [
      {
        id: "offre_detail",
        label: "Qu'est-ce que vous proposez exactement ?",
        placeholder: "Ex : Une formation vidéo de 6h + 3 séances live/mois + un kit de démarrage…",
        type: "textarea",
        rows: 2,
      },
      {
        id: "gain_client",
        label: "Que gagne ou évite le client grâce à vous ?",
        placeholder: "Ex : Il crée ses premières tenues en 30 jours sans machine hors de prix et sans se déplacer…",
        type: "textarea",
        rows: 2,
      },
    ],
  },
  {
    id: "prix",
    step: 4,
    label: "Prix",
    tagline: "Combien et comment facturer ?",
    description: "Validez votre stratégie tarifaire et apprenez à tester votre prix rapidement.",
    icon: DollarSign,
    inputs: [
      {
        id: "modele_prix",
        label: "Comment comptez-vous facturer ?",
        placeholder: "Ex : Paiement unique, abonnement mensuel, à la séance, accès à vie…",
        type: "textarea",
        rows: 2,
      },
      {
        id: "niveau_prix",
        label: "Quel niveau de prix envisagez-vous ?",
        placeholder: "Ex : 25 000 FCFA pour la formation complète",
        type: "text",
      },
    ],
  },
  {
    id: "business_model",
    step: 5,
    label: "Business model",
    tagline: "Comment votre activité génère-t-elle de la valeur ?",
    description: "Structurez vos flux de revenus, anticipez vos coûts clés et renforcez la solidité de votre modèle.",
    icon: BarChart2,
    inputs: [
      {
        id: "revenus",
        label: "Comment gagnez-vous de l'argent concrètement ?",
        placeholder: "Ex : Vente de formations, coaching individuel payant, vente de kits couture, affiliation…",
        type: "textarea",
        rows: 3,
      },
    ],
  },
  {
    id: "vente",
    step: 6,
    label: "Pitch & Message de vente",
    tagline: "Comment convaincre et déclencher l'achat ?",
    description: "Transformez votre cadrage en pitch clair, discours commercial et messages adaptés à vos canaux.",
    icon: MessageCircle,
    inputs: [
      {
        id: "canal",
        label: "Où vendez-vous ou comptez-vous vendre ?",
        placeholder: "Ex : WhatsApp, Instagram, bouche-à-oreille, marché physique, TikTok…",
        type: "text",
      },
    ],
  },
  {
    id: "business_plan",
    step: 7,
    label: "Business plan",
    tagline: "Votre plan complet sur 12 mois",
    description: "Synthèse structurée de votre projet — vision, marché, modèle, plan d'action et indicateurs clés.",
    icon: FileText,
    optional: true,
    inputs: [
      {
        id: "horizon",
        label: "Sur quel horizon ?",
        placeholder: "Ex : 12 mois",
        type: "text",
        optional: true,
      },
      {
        id: "objectifs",
        label: "Vos objectifs principaux",
        placeholder: "Ex : Atteindre 20 clients payants, générer 200 000 FCFA/mois…",
        type: "textarea",
        rows: 2,
        optional: true,
      },
    ],
  },
];

const REQUIRED_MODULES = MODULES.filter((m) => !m.optional);

// Document-appropriate labels for the final deliverable
const DOC_LABELS: Record<string, { title: string; tagline: string }> = {
  client:         { title: "Client idéal",                    tagline: "À qui s'adresse ce projet" },
  probleme:       { title: "Problème central",                tagline: "Ce que nous résolvons" },
  offre:          { title: "Offre & proposition de valeur",   tagline: "Ce que nous apportons" },
  prix:           { title: "Stratégie de prix",               tagline: "Notre modèle tarifaire" },
  business_model: { title: "Modèle économique",               tagline: "Comment nous générons de la valeur" },
  vente:          { title: "Pitch & Message de vente",        tagline: "Notre discours commercial" },
  business_plan:  { title: "Plan d'action",                   tagline: "Feuille de route et priorités" },
};

// ─── Prompt builders ────────────────────────────────────────────────────────

function buildPrompt(moduleId: string, inputs: Record<string, string>, ws: WorkspaceData): string {
  const get = (id: string) => {
    const s = ws[id];
    if (!s) return "";
    return (s.output || s.inputs[Object.keys(s.inputs)[0]] || "").trim();
  };

  const client = get("client");
  const probleme = get("probleme");
  const offre = get("offre");
  const prix = get("prix");
  const bizModel = get("business_model");

  const short = (s: string, n = 200) => (s.length > n ? s.slice(0, n) + "…" : s);
  const founderDiagnosticMarker = `CHATLAYA_FOUNDER_GUIDED_DIAGNOSTIC\nÉtape Founder : ${DOC_LABELS[moduleId]?.title ?? moduleId}\n\n`;

  switch (moduleId) {
    case "client":
      return founderDiagnosticMarker + (
        `Je travaille sur : ${inputs.activite || "(non précisé)"}. ` +
        `Mon client cible selon moi est : ${inputs.client_idee || "(non précisé)"}. ` +
        `Aide-moi à définir clairement mon client cible : qui il est vraiment, ses caractéristiques principales, ce qui le motive à acheter, et comment le trouver concrètement. Sois précis et actionnable.`
      );
    case "probleme":
      return founderDiagnosticMarker + (
        `Mon client cible est : ${client || "(non défini)"}. ` +
        `Je pense résoudre ce problème : ${inputs.probleme_idee || "(non précisé)"}. ` +
        `Aide-moi à formuler clairement ce problème : en quoi c'est douloureux pour le client, ce qu'il perd ou rate sans solution, et pourquoi ce problème vaut la peine d'être résolu. Sois concret.`
      );
    case "offre":
      return founderDiagnosticMarker + (
        `Mon client ${client ? `est : ${short(client)}` : "(défini à l'étape précédente)"}. ` +
        `${probleme ? `Le problème qu'il rencontre : ${short(probleme)}. ` : ""}` +
        `Mon offre est : ${inputs.offre_detail || "(non précisée)"}. ` +
        `Le client gagne ou évite : ${inputs.gain_client || "(non précisé)"}. ` +
        `Aide-moi à structurer une proposition de valeur claire et percutante : ce que je propose, pour qui, pourquoi c'est différent, et le bénéfice concret. En 3 à 5 points actionnables.`
      );
    case "prix":
      return founderDiagnosticMarker + (
        `${offre ? `Mon offre : ${short(offre)}. ` : ""}` +
        `Mon client : ${short(client || "(défini précédemment)")}. ` +
        `Je pense facturer : ${inputs.modele_prix || "(non précisé)"}` +
        `${inputs.niveau_prix ? `, avec un niveau de prix de : ${inputs.niveau_prix}` : ""}. ` +
        `Aide-moi à valider ma stratégie de prix : est-ce cohérent avec la valeur apportée, quelles questions je dois me poser, et comment tester mon prix rapidement.`
      );
    case "business_model":
      return founderDiagnosticMarker + (
        `${offre ? `Mon offre : ${short(offre)}. ` : ""}` +
        `${client ? `Mon client : ${short(client)}. ` : ""}` +
        `${prix ? `Mon prix : ${short(prix)}. ` : ""}` +
        `Je génère des revenus via : ${inputs.revenus || "(non précisé)"}. ` +
        `Aide-moi à structurer mon business model : flux de revenus principaux, coûts clés à anticiper, et comment le rendre plus solide ou scalable.`
      );
    case "vente":
      return founderDiagnosticMarker + (
        `${offre ? `Mon offre : ${short(offre, 120)}. ` : ""}` +
        `${client ? `Mon client : ${short(client, 100)}. ` : ""}` +
        `${probleme ? `Son problème : ${short(probleme, 100)}. ` : ""}` +
        `Je vends via : ${inputs.canal || "mes canaux habituels"}. ` +
        `Aide-moi à transformer ce cadrage en pitch et message de vente convaincant adapté à ${inputs.canal || "ce canal"}. ` +
        `Il doit clarifier la promesse, capter l'attention, montrer la valeur, lever les objections et appeler à l'action. Donne une base de pitch et 2 à 3 variantes courtes.`
      );
    case "business_plan":
      return founderDiagnosticMarker + (
        `Voici le résumé de mon projet :\n` +
        `- Client cible : ${client || "(à compléter)"}\n` +
        `- Problème résolu : ${short(probleme || "(à définir)")}\n` +
        `- Offre : ${short(offre || "(à structurer)")}\n` +
        `- Prix : ${short(prix || "(à définir)")}\n` +
        `- Business model : ${short(bizModel || "(à structurer)")}\n\n` +
        `Aide-moi à rédiger un business plan simple et exploitable sur ${inputs.horizon || "12 mois"}` +
        `${inputs.objectifs ? ` avec ces objectifs : ${inputs.objectifs}` : ""}. ` +
        `Garde-le pratique, pas académique : vision, marché cible, offre et valeur, modèle économique, plan d'action prioritaire, indicateurs clés.`
      );
    default:
      return "Aide-moi sur cette étape de mon projet.";
  }
}

function formatInputsForPrompt(mod: ModuleDef, inputs: Record<string, string>): string {
  const lines = mod.inputs
    .map((field) => {
      const value = inputs[field.id]?.trim();
      if (!value) return "";
      return `- ${field.label.replace(/\s*\([^)]*\)\s*$/g, "")} : ${value}`;
    })
    .filter(Boolean);

  return lines.length ? lines.join("\n") : "- Aucune réponse utilisateur exploitable pour cette étape.";
}

function finalDraftStructure(moduleId: string, docTitle: string): string {
  const structures: Record<string, string> = {
    client:
      `Structure attendue, en reprenant le niveau de profondeur de l'exemple validé :\n` +
      `${docTitle} : [segment précis]\n\n` +
      `Profil et Caractéristiques du Client Cible\n` +
      `Motivation d'Achat et Pain Points Fondamentaux\n` +
      `Positionnement de l'Offre et Valeur Perçue\n` +
      `Stratégie de Découverte et Canaux d'Acquisition\n` +
      `Critères de Qualification du Lead\n` +
      `Nuances et Pièges à Éviter\n` +
      `Synthèse de la Proposition de Valeur`,
    probleme:
      `Structure attendue, avec le même niveau de profondeur qu'une section premium :\n` +
      `${docTitle} : [douleur centrale]\n\n` +
      `Nature du Problème Client\n` +
      `Conséquences Opérationnelles et Économiques\n` +
      `Urgence et Coût de l'Inaction\n` +
      `Segments les Plus Exposés à cette Douleur\n` +
      `Signaux de Validation Terrain\n` +
      `Risques de Mauvaise Formulation\n` +
      `Synthèse de la Douleur à Résoudre`,
    offre:
      `Structure attendue, avec une vraie logique de dossier :\n` +
      `${docTitle} : [promesse principale]\n\n` +
      `Définition de l'Offre\n` +
      `Bénéfices Concrets pour le Client\n` +
      `Différenciation et Valeur Perçue\n` +
      `Composantes de l'Offre\n` +
      `Preuves, Garanties ou Éléments de Réassurance\n` +
      `Conditions de Clarté Commerciale\n` +
      `Synthèse de la Proposition de Valeur`,
    prix:
      `Structure attendue, orientée décision business :\n` +
      `${docTitle} : [logique tarifaire]\n\n` +
      `Logique de Prix Recommandée\n` +
      `Lien entre Prix et Valeur Perçue\n` +
      `Hypothèses de Coûts et de Marge\n` +
      `Options de Facturation Possibles\n` +
      `Méthode de Test du Prix\n` +
      `Risques Tarifaires à Éviter\n` +
      `Synthèse de la Stratégie de Prix`,
    business_model:
      `Structure attendue, comme une section investisseur lisible :\n` +
      `${docTitle} : [modèle retenu]\n\n` +
      `Logique Générale du Modèle Économique\n` +
      `Sources de Revenus Prioritaires\n` +
      `Coûts Clés et Ressources Nécessaires\n` +
      `Mécanique de Création et Capture de Valeur\n` +
      `Scalabilité et Effets de Levier\n` +
      `Hypothèses à Valider\n` +
      `Synthèse du Modèle Économique`,
    vente:
      `Structure attendue, prête à être utilisée commercialement :\n` +
      `${docTitle} : [angle de vente]\n\n` +
      `Angle Commercial Principal\n` +
      `Promesse à Communiquer\n` +
      `Message Central de Vente\n` +
      `Arguments de Conviction\n` +
      `Canaux et Situations d'Utilisation\n` +
      `Objections Probables et Réponses\n` +
      `Synthèse du Discours Commercial`,
    business_plan:
      `Structure attendue, synthétique mais substantielle :\n` +
      `${docTitle} : [horizon et priorité]\n\n` +
      `Vision et Objectif du Projet\n` +
      `Marché Cible et Problème Résolu\n` +
      `Offre, Valeur et Positionnement\n` +
      `Modèle Économique et Hypothèses de Revenus\n` +
      `Plan d'Action Prioritaire\n` +
      `Indicateurs de Suivi\n` +
      `Synthèse Exécutive du Plan`,
  };

  return structures[moduleId] ?? (
    `Structure attendue :\n` +
    `${docTitle}\n\n` +
    `Contexte\n` +
    `Analyse\n` +
    `Implications Business\n` +
    `Critères de Validation\n` +
    `Synthèse`
  );
}

function buildFinalDraftPrompt(moduleId: string, state: ModuleState, ws: WorkspaceData): string {
  const mod = MODULES.find((item) => item.id === moduleId);
  const docLabel = DOC_LABELS[moduleId] ?? { title: mod?.label ?? "Section dossier", tagline: "" };
  const expectedStructure = finalDraftStructure(moduleId, docLabel.title);
  const priorContext = MODULES
    .filter((item) => item.id !== moduleId)
    .map((item) => {
      const itemState = ws[item.id];
      const content = itemState?.retention?.trim() || itemState?.output?.trim();
      if (!content) return "";
      const label = DOC_LABELS[item.id]?.title ?? item.label;
      const shortContent = content.length > 900 ? `${content.slice(0, 900)}…` : content;
      return `## ${label}\n${shortContent}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return (
    `Tu es ChatLAYA Founder. Tu dois rédiger la VERSION FINALE DU DOSSIER pour cette étape : "${docLabel.title}".\n\n` +
    `Rôle du texte final : ${docLabel.tagline || "section utilisable dans un dossier projet"}.\n\n` +
    `Réponses initiales de l'utilisateur :\n${mod ? formatInputsForPrompt(mod, state.inputs) : "(module introuvable)"}\n\n` +
    `Diagnostic / cadrage ChatLAYA à prendre en compte :\n${state.output?.trim() || "(aucun diagnostic disponible)"}\n\n` +
    `Avis, corrections ou ajouts de l'utilisateur :\n${state.finalFeedback?.trim() || "(aucun ajout : l'utilisateur valide le cadrage proposé)"}\n\n` +
    `${priorContext ? `Contexte déjà cadré dans les autres étapes :\n${priorContext}\n\n` : ""}` +
    `${expectedStructure}\n\n` +
    `Consigne de rédaction : produis uniquement la version finale à mettre dans le dossier. ` +
    `Ne fais pas de coaching, ne pose pas de question, ne dis pas "voici". ` +
    `Cette version doit pouvoir être vendue comme partie d'un vrai dossier projet premium : elle doit être dense, claire et exploitable. ` +
    `Ne produis pas un résumé. Rédige une section complète avec au moins 5 à 8 paragraphes ou blocs structurés selon la matière disponible. ` +
    `Développe la logique business, les critères, les implications, les nuances et les points de validation utiles. ` +
    `Respecte la structure attendue fournie ci-dessus, avec des titres propres sur lignes séparées. ` +
    `Si le sujet est la cible client, détaille les segments prioritaires, les caractéristiques, les motivations d'achat, les signaux de besoin, les canaux pour les trouver et les hypothèses à valider. ` +
    `Si le sujet est un autre module, applique le même niveau de profondeur au problème, à l'offre, au prix, au modèle économique, au pitch commercial ou au plan d'action. ` +
    `Reformule proprement, avec substance, précision et cohérence business. ` +
    `N'utilise aucun Markdown visible : pas d'astérisques, pas de #, pas de balises. ` +
    `Ne termine jamais par une phrase de transition du type "la prochaine étape consiste à..." ou une question. ` +
    `Ne réduis jamais artificiellement la réponse : une version trop courte est considérée comme un échec.`
  );
}

function cleanDossierText(value: string): string {
  const forbiddenClosings = [
    "la prochaine étape",
    "la prochaine etape",
    "pour affiner",
    "afin d'affiner",
    "afin d affiner",
    "souhaitez-vous",
    "souhaitez vous",
    "pouvez-vous préciser",
    "pouvez vous preciser",
    "sur quels types",
    "sur quel type",
    "pour passer à l'étape suivante",
    "pour passer a l'etape suivante",
    "je peux aller plus loin",
    "si vous précisez",
    "si vous precisez",
  ];

  const cleaned = value
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const paragraphs = cleaned.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  while (paragraphs.length) {
    const last = paragraphs[paragraphs.length - 1].toLowerCase();
    if (!last.includes("?") && !forbiddenClosings.some((pattern) => last.includes(pattern))) break;
    paragraphs.pop();
  }
  return paragraphs.join("\n\n").trim() || cleaned;
}

// ─── Markdown parser ─────────────────────────────────────────────────────────

type MdBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "ordered-list"; items: string[] }
  | { type: "unordered-list"; items: string[] };

function parseMd(content: string): MdBlock[] {
  const lines = content.split("\n");
  const blocks: MdBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (line.startsWith("### ")) { blocks.push({ type: "heading", level: 3, text: line.slice(4) }); i++; continue; }
    if (line.startsWith("## ")) { blocks.push({ type: "heading", level: 2, text: line.slice(3) }); i++; continue; }
    if (line.startsWith("# ")) { blocks.push({ type: "heading", level: 1, text: line.slice(2) }); i++; continue; }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        if (/^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, "")); i++; }
        else if (!lines[i].trim()) {
          let j = i + 1;
          while (j < lines.length && !lines[j].trim()) j++;
          if (j < lines.length && /^\d+\.\s/.test(lines[j])) { i = j; } else { break; }
        } else { break; }
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    if (/^[-•*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        if (/^[-•*]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-•*]\s+/, "")); i++; }
        else if (!lines[i].trim()) {
          let j = i + 1;
          while (j < lines.length && !lines[j].trim()) j++;
          if (j < lines.length && /^[-•*]\s/.test(lines[j])) { i = j; } else { break; }
        } else { break; }
      }
      blocks.push({ type: "unordered-list", items });
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("#") &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^[-•*]\s/.test(lines[i])
    ) { paraLines.push(lines[i]); i++; }
    if (paraLines.length) blocks.push({ type: "paragraph", text: paraLines.join(" ") });
  }
  return blocks;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i} className="font-semibold text-[#101015]">{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*"))
          return <em key={i} className="italic text-[#4A4540]">{part.slice(1, -1)}</em>;
        if (part.startsWith("`") && part.endsWith("`"))
          return <code key={i} className="rounded bg-[#F0E6CC] px-1 py-0.5 font-mono text-[12px] text-[#8A6A20]">{part.slice(1, -1)}</code>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── FounderOutput ───────────────────────────────────────────────────────────

function FounderOutput({ content }: { content: string }) {
  const blocks = parseMd(content);
  return (
    <div className="space-y-3 break-words">
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          if (block.level === 1)
            return <h1 key={idx} className="text-base font-bold text-[#101015] pt-1">{renderInline(block.text)}</h1>;
          if (block.level === 2)
            return (
              <h2 key={idx} className="flex items-center gap-2.5 text-sm font-bold text-[#101015] pt-2">
                <span className="h-3.5 w-0.5 shrink-0 rounded-full bg-[#B8963E]" />
                {renderInline(block.text)}
              </h2>
            );
          return <h3 key={idx} className="text-sm font-semibold text-[#3A3530] pt-1">{renderInline(block.text)}</h3>;
        }
        if (block.type === "ordered-list")
          return (
            <ol key={idx} className="space-y-2">
              {block.items.map((item, li) => (
                <li key={li} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F0E6CC] text-[10px] font-bold text-[#8A6A20] ring-1 ring-[#E7DED0]">{li + 1}</span>
                  <span className="flex-1 text-sm leading-6 text-[#3A3530]">{renderInline(item)}</span>
                </li>
              ))}
            </ol>
          );
        if (block.type === "unordered-list")
          return (
            <ul key={idx} className="space-y-2">
              {block.items.map((item, li) => (
                <li key={li} className="flex gap-2.5">
                  <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8963E]" />
                  <span className="flex-1 text-sm leading-6 text-[#3A3530]">{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        return <p key={idx} className="text-sm leading-7 text-[#3A3530]">{renderInline(block.text)}</p>;
      })}
    </div>
  );
}

// ─── RetentionBlock (AXE 2 — livrable final) ─────────────────────────────────

function RetentionBlock({
  value,
  onChange,
  feedback,
  onFeedbackChange,
  onGenerateFinal,
  generatingFinal,
  validated,
}: {
  value: string;
  onChange: (v: string) => void;
  feedback: string;
  onFeedbackChange: (v: string) => void;
  onGenerateFinal: () => void;
  generatingFinal: boolean;
  validated: boolean;
}) {
  const isFilled = Boolean(value.trim());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!generatingFinal) {
      setElapsedSeconds(0);
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [generatingFinal]);

  const progressSteps = [
    "J'analyse le diagnostic et vos ajouts",
    "Je structure les idées en version dossier",
    "Je peaufine le fond, la clarté et les nuances",
    "Je nettoie la formulation finale",
  ];
  const activeProgressStep = elapsedSeconds < 25 ? 0 : elapsedSeconds < 80 ? 1 : elapsedSeconds < 140 ? 2 : 3;
  const progressMessage =
    elapsedSeconds < 25
      ? "Je suis en train d'identifier les points les plus importants à conserver."
      : elapsedSeconds < 80
        ? "Je transforme le cadrage en document structuré, lisible et exploitable."
        : elapsedSeconds < 140
          ? "Je peaufine les formulations pour obtenir un rendu plus professionnel."
          : "Patientez encore un instant, la version finale est presque prête.";
  const progressPercent = Math.min(92, Math.max(12, Math.round((elapsedSeconds / 180) * 100)));

  return (
    <div className="space-y-4 rounded-xl border border-[#E7DED0] bg-[#FFFCF7] p-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PenLine className="h-3.5 w-3.5 text-[#B8963E]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A6A20]">
            Finalisation du cadrage
          </span>
        </div>
        <span className="rounded-full bg-white/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-[#B8963E] ring-1 ring-[#E7DED0]">
          {validated ? "validée" : isFilled ? "version prête" : "à rédiger"}
        </span>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#B8963E]">
          Votre avis ou vos ajouts (optionnel)
        </p>
        <textarea
          value={feedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          placeholder="Ex : garde cette idée, mais précise que je cible surtout les PME de services ; ajoute aussi l'angle gain de temps et réduction des coûts."
          rows={3}
          className="w-full resize-none rounded-xl border border-[#E7DED0] bg-white/70 px-3.5 py-3 text-sm leading-relaxed text-[#101015] placeholder:text-[#C8B88A]/80 focus:border-[#B8963E] focus:outline-none"
        />
        <p className="mt-2 text-[11px] leading-relaxed text-[#6F6A60]">
          Si vous n'ajoutez rien, Founder considère que vous validez le cadrage et rédige directement la version finale.
        </p>
      </div>
      <button
        type="button"
        onClick={onGenerateFinal}
        disabled={generatingFinal}
        className="inline-flex items-center gap-2 rounded-full bg-[#101015] px-5 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-[#B8963E]/20 transition hover:bg-[#1A1A20] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {generatingFinal ? "Founder prépare le document…" : isFilled ? "Re-rédiger la version finale complète" : "Rédiger la version finale complète"}
      </button>
      {generatingFinal ? (
        <div className="rounded-2xl border border-[#E7DED0] bg-white/80 p-4 shadow-[0_12px_35px_rgba(184,150,62,0.08)]">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#101015]">Préparation d'un document complet</p>
              <p className="mt-1 text-xs leading-relaxed text-[#6F6A60]">
                Pour un meilleur rendu, Founder peut prendre 2 à 3 minutes afin de bien analyser, structurer et peaufiner la version dossier.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#F0E6CC] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#8A6A20]">
              {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#F0E6CC]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#B8963E] via-[#D4AE5C] to-[#B8963E] transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {progressSteps.map((step, index) => {
              const isActive = index === activeProgressStep;
              const isDone = index < activeProgressStep;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                    isActive
                      ? "border-[#E7DED0] bg-[#FFFCF7] text-[#101015]"
                      : isDone
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                        : "border-[#E7DED0] bg-[#F7F4EE] text-[#6F6A60]"
                  }`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone ? "bg-emerald-500 text-white" : isActive ? "bg-[#B8963E] text-white" : "bg-white text-[#6F6A60]"
                  }`}>
                    {isDone ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 animate-pulse text-xs font-medium text-[#8A6A20]">{progressMessage}</p>
        </div>
      ) : null}
      <div className="rounded-xl border border-[#E7DED0] bg-white/70 p-3.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A6A20]">Version dossier</p>
          <span className="text-[9px] font-medium italic text-[#B8963E]/70">sera utilisée dans l'export final</span>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="La version finale rédigée par Founder apparaîtra ici. Vous pourrez encore la modifier avant validation."
          rows={12}
          className="min-h-[320px] w-full resize-y bg-transparent text-sm leading-relaxed text-[#101015] placeholder:text-[#C8B88A]/80 focus:outline-none"
        />
      </div>
    </div>
  );
}

// ─── localStorage ─────────────────────────────────────────────────────────────

function storageKey(cid: string) { return `kx-founder-ws-${cid}`; }
function loadWs(cid: string): WorkspaceData {
  try { const raw = localStorage.getItem(storageKey(cid)); if (raw) return JSON.parse(raw) as WorkspaceData; } catch {}
  return {};
}
function saveWs(cid: string, data: WorkspaceData) {
  try { localStorage.setItem(storageKey(cid), JSON.stringify(data)); } catch {}
}
function defaultMs(): ModuleState { return { inputs: {}, output: null, status: "empty" }; }
function getMs(ws: WorkspaceData, id: string): ModuleState { return ws[id] ?? defaultMs(); }
function normalizeTitle(value?: string | null) { return value?.trim() || "Nouvelle conversation"; }
function formatConversationDate(value?: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

// ─── GeneratingCard ───────────────────────────────────────────────────────────

const GENERATING_MSGS = [
  "Je mobilise le corpus Fondateur…",
  "J'analyse votre situation sous tous les angles…",
  "Je structure une réponse adaptée à votre projet…",
  "Je peaufine pour que ce soit vraiment utile…",
  "Presque là — je finalise pour vous…",
];

function GeneratingCard({ firstName }: { firstName?: string }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    setPhase(0);
    const id = setInterval(() => setPhase((p) => (p + 1) % GENERATING_MSGS.length), 2800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E7DED0] bg-white px-5 py-4 shadow-[0_4px_24px_rgba(184,150,62,0.08)]">
      <div className="flex items-center gap-2.5">
        <div className="flex items-end gap-[5px]">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="kx-thinking-dot inline-block rounded-full bg-[#B8963E]"
              style={{ width: i === 1 || i === 2 ? "7px" : "5px", height: i === 1 || i === 2 ? "7px" : "5px", animationDelay: `${i * 0.13}s` }}
            />
          ))}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8963E]">ChatLAYA réfléchit</span>
      </div>
      <p key={phase} className="kx-thinking-msg text-sm leading-relaxed text-[#3A3530]">
        {firstName ? GENERATING_MSGS[phase] : GENERATING_MSGS[phase]}
      </p>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#F0E6CC]">
        <div className="kx-thinking-scan h-full w-1/3 rounded-full bg-gradient-to-r from-[#B8963E] via-[#D4AE5C] to-[#B8963E]" />
      </div>
    </div>
  );
}

// ─── HTML Export (AXE 3 — premium document) ───────────────────────────────────

function inlineToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/`([^`\n]+)`/g, "<code>$1</code>");
}

// Strict: final document uses ONLY user's own formulation — never AI coaching output
function getDocContent(mws: ModuleState): string | null {
  return mws.retention?.trim() || null;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cleanExportText(value: string): string {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .trim();
}

function splitExportParagraphs(value: string): string[] {
  return cleanExportText(value)
    .split(/\n\s*\n/g)
    .map((item) => item.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function buildSectionHeadline(label: string): string {
  const words = label.split(/\s+/);
  if (words.length <= 3) return escapeHtml(label);
  const mid = Math.ceil(words.length / 2);
  return `${escapeHtml(words.slice(0, mid).join(" "))}<br>${escapeHtml(words.slice(mid).join(" "))}`;
}

function buildEditorialContentHtml(retention: string, docLabel: { title: string; tagline: string }, index: number): string {
  const paragraphs = splitExportParagraphs(retention);
  if (!paragraphs.length) return "";

  const intro = paragraphs[0];
  const rest = paragraphs.slice(1);
  const leadIndex = Math.min(1, rest.length - 1);
  const lead = leadIndex >= 0 ? rest[leadIndex] : intro;
  const normalBlocks = rest.filter((_, idx) => idx !== leadIndex);
  const firstBlocks = normalBlocks.slice(0, 2);
  const remainingBlocks = normalBlocks.slice(2);
  const sectionTone = index % 3;

  const firstHtml = firstBlocks.length
    ? `<div class="block">
        <div class="block-title">${escapeHtml(docLabel.title)}</div>
        ${firstBlocks.map((item) => `<p>${inlineToHtml(item)}</p>`).join("")}
      </div>`
    : "";

  const calloutHtml = lead
    ? `<div class="callout">
        <div class="callout-label">Synthèse stratégique</div>
        <p>${inlineToHtml(lead)}</p>
      </div>`
    : "";

  const grouped = remainingBlocks.reduce<string[][]>((acc, item, idx) => {
    const groupIndex = Math.floor(idx / 2);
    if (!acc[groupIndex]) acc[groupIndex] = [];
    acc[groupIndex].push(item);
    return acc;
  }, []);

  const detailHtml = grouped.map((group, groupIndex) => {
    if (group.length === 2 && groupIndex === 0) {
      return `<div class="two-col">
        ${group.map((item, cardIndex) => `<div class="card">
          <div class="card-title">${cardIndex === 0 ? "Point d'appui" : "Angle de validation"}</div>
          <p>${inlineToHtml(item)}</p>
        </div>`).join("")}
      </div>`;
    }
    if (group.length >= 2 && sectionTone === 1) {
      return `<div class="criteria">
        ${group.map((item, itemIndex) => `<div class="criteria-item">
          <div class="criteria-num">${groupIndex * 2 + itemIndex + 1}</div>
          <div class="criteria-text">${inlineToHtml(item)}</div>
        </div>`).join("")}
      </div>`;
    }
    if (group.length >= 2 && sectionTone === 2) {
      return `<div class="pillars">
        ${group.slice(0, 3).map((item, itemIndex) => `<div class="pillar">
          <div class="pillar-num">${itemIndex + 1}</div>
          <div class="pillar-title">Pilier ${itemIndex + 1}</div>
          <p>${inlineToHtml(item)}</p>
        </div>`).join("")}
      </div>`;
    }
    return `<div class="block">
      <div class="block-title">${groupIndex === 0 ? "Développement" : "Précision complémentaire"}</div>
      ${group.map((item) => `<p>${inlineToHtml(item)}</p>`).join("")}
    </div>`;
  }).join("");

  return `${firstHtml}${calloutHtml}${detailHtml}`;
}

function generateHtmlExport(ws: WorkspaceData, modules: ModuleDef[], firstName?: string): string {
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  const completed = modules.filter((m) => getMs(ws, m.id).status === "completed");
  const requiredTotal = modules.filter((m) => !m.optional).length;

  // Strict counts: only user-formulated sections count as truly ready for the document
  const requiredWithFormulation = modules.filter((m) => !m.optional && !!getMs(ws, m.id).retention?.trim()).length;
  const missingFormulation = completed.filter((m) => !m.optional && !getMs(ws, m.id).retention?.trim());
  const isDossierComplete = requiredWithFormulation === requiredTotal;

  const displayName = firstName?.trim() || "Projet Founder";
  const exportSections = completed.length ? completed : modules.filter((m) => getMs(ws, m.id).retention?.trim());
  const coverPills = exportSections.slice(0, 6).map((mod) => {
    const label = DOC_LABELS[mod.id] ?? { title: mod.label, tagline: mod.tagline };
    return `<span class="section-pill">${escapeHtml(label.title)}</span>`;
  }).join("");

  // Incomplete document banner — shown when required sections lack user formulation
  const incompleteHtml = missingFormulation.length > 0 ? `
  <div class="alert-box export-alert">
    <div class="alert-title">Dossier incomplet</div>
    <p>${missingFormulation.length} section${missingFormulation.length > 1 ? "s" : ""} sans formulation rédigée : <strong>${missingFormulation.map((m) => escapeHtml(DOC_LABELS[m.id]?.title ?? m.label)).join(", ")}</strong>. Ces sections apparaissent comme non finalisées ci-dessous.</p>
  </div>` : "";

  // Section bodies — STRICT: only user formulation, never AI coaching output
  const sections = exportSections.map((mod, idx) => {
    const mws = getMs(ws, mod.id);
    const docLabel = DOC_LABELS[mod.id] ?? { title: mod.label, tagline: mod.tagline };
    const retention = getDocContent(mws);
    const sectionNumber = String(idx + 1).padStart(2, "0");

    const contentHtml = retention ? buildEditorialContentHtml(retention, docLabel, idx) : `
        <div class="alert-box">
          <div class="alert-title">Formulation non rédigée</div>
          <p>Cette section a été analysée en mode coaching, mais sa version dossier finale n'a pas encore été rédigée. Le contenu coaching n'est pas inclus dans ce document.</p>
        </div>`;

    return `
  <section class="section" id="s${sectionNumber}">
    <div class="section-sidebar">
      <span class="section-num">${sectionNumber}</span>
      <span class="section-label">${escapeHtml(docLabel.title)}</span>
      <span class="section-title-side">${escapeHtml(docLabel.tagline)}</span>
    </div>
    <div class="section-content">
      <h2 class="section-headline">${buildSectionHeadline(docLabel.title)}</h2>
      <p class="section-subtitle">${escapeHtml(docLabel.tagline)}</p>
      ${contentHtml}
    </div>
  </section>`;
  }).join("\n");

  const toc = exportSections.map((mod, idx) => {
    const docLabel = DOC_LABELS[mod.id] ?? { title: mod.label, tagline: mod.tagline };
    const sectionNumber = String(idx + 1).padStart(2, "0");
    return `<a href="#s${sectionNumber}" class="toc-item">
        <div class="toc-item-num">${sectionNumber}</div>
        <div class="toc-item-content">
          <div class="toc-item-title">${escapeHtml(docLabel.title)}</div>
          <div class="toc-item-desc">${escapeHtml(docLabel.tagline)}</div>
        </div>
      </a>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dossier Projet${firstName ? ` · ${firstName}` : ""} — KORYXA Founder</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #0D0D0F;
    --paper: #F5F2EC;
    --gold: #B8963E;
    --gold-light: #D4AE5C;
    --gold-pale: #F0E6CC;
    --smoke: #E8E4DC;
    --mist: #C8C3B8;
    --charcoal: #2C2C30;
    --accent-red: #8B2020;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  body {
    background: var(--paper);
    color: var(--ink);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-action {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 20;
    background: var(--ink);
    color: #fff;
    border: 1px solid rgba(184,150,62,0.45);
    border-radius: 999px;
    padding: 12px 18px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.08em;
    cursor: pointer;
    box-shadow: 0 20px 45px rgba(0,0,0,0.22);
  }

  .cover {
    min-height: 100vh;
    background: var(--ink);
    display: grid;
    grid-template-rows: auto 1fr auto;
    padding: 56px 72px;
    position: relative;
    overflow: hidden;
  }
  .cover::before {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 420px; height: 420px;
    background: radial-gradient(circle at top right, rgba(184,150,62,0.18) 0%, transparent 70%);
    pointer-events: none;
  }
  .cover::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 320px; height: 2px;
    background: linear-gradient(90deg, var(--gold) 0%, transparent 100%);
  }
  .cover-header, .cover-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
    z-index: 1;
  }
  .brand-mark {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 500;
    font-size: 13px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .cover-meta {
    text-align: right;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--mist);
    letter-spacing: 0.05em;
    line-height: 2;
  }
  .cover-center {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 80px 0 40px;
    position: relative;
    z-index: 1;
  }
  .cover-tag {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 32px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .cover-tag::before {
    content: '';
    width: 40px; height: 1px;
    background: var(--gold);
  }
  .cover-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
    font-size: clamp(52px, 6vw, 88px);
    line-height: 1.0;
    color: #fff;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }
  .cover-title em {
    font-style: italic;
    color: var(--gold-light);
  }
  .cover-subtitle {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 400;
    font-size: 22px;
    color: var(--mist);
    margin-top: 24px;
    font-style: italic;
  }
  .cover-divider {
    width: 80px; height: 1px;
    background: var(--gold);
    margin: 40px 0;
  }
  .cover-desc {
    font-size: 13px;
    color: #888;
    max-width: 520px;
    line-height: 1.9;
    letter-spacing: 0.02em;
  }
  .cover-footer {
    align-items: flex-end;
    border-top: 1px solid rgba(255,255,255,0.08);
    padding-top: 32px;
  }
  .cover-footer-left {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #555;
    letter-spacing: 0.1em;
  }
  .sections-list {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
    max-width: 720px;
  }
  .section-pill {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--gold);
    border: 1px solid rgba(184,150,62,0.3);
    padding: 6px 14px;
    border-radius: 2px;
  }

  .toc-page {
    background: var(--smoke);
    padding: 96px 72px;
    border-bottom: 1px solid var(--mist);
  }
  .toc-inner { max-width: 1100px; margin: 0 auto; }
  .toc-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #8f887c;
    margin-bottom: 56px;
  }
  .toc-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
  }
  .toc-item {
    display: flex;
    align-items: center;
    padding: 28px 0;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
  }
  .toc-item:hover { color: var(--gold); }
  .toc-item-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 48px;
    font-weight: 300;
    color: var(--mist);
    line-height: 1;
    width: 72px;
    flex-shrink: 0;
    transition: color 0.2s;
  }
  .toc-item:hover .toc-item-num { color: var(--gold); }
  .toc-item-content { flex: 1; padding-right: 32px; }
  .toc-item-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    font-weight: 500;
    line-height: 1.2;
    margin-bottom: 6px;
  }
  .toc-item-desc {
    font-size: 12px;
    color: #888;
    letter-spacing: 0.03em;
  }

  .document-shell { background: #fff; padding: 40px 0; }
  .document-body {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 72px;
  }
  .section {
    padding: 96px 0;
    border-bottom: 1px solid var(--smoke);
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 64px;
    align-items: start;
  }
  .section:last-child { border-bottom: none; }
  .section-sidebar {
    position: sticky;
    top: 40px;
  }
  .section-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 80px;
    font-weight: 300;
    line-height: 1;
    color: var(--smoke);
    display: block;
    margin-bottom: 16px;
    letter-spacing: -0.04em;
  }
  .section-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--gold);
    display: block;
    margin-bottom: 8px;
  }
  .section-title-side {
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px;
    font-weight: 400;
    color: var(--charcoal);
    line-height: 1.4;
  }
  .section-headline {
    font-family: 'Cormorant Garamond', serif;
    font-size: 38px;
    font-weight: 500;
    line-height: 1.15;
    color: var(--ink);
    margin-bottom: 8px;
    letter-spacing: -0.01em;
  }
  .section-subtitle {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    font-style: italic;
    color: var(--gold);
    margin-bottom: 48px;
    padding-bottom: 32px;
    border-bottom: 1px solid var(--smoke);
  }
  .block { margin-bottom: 40px; }
  .block-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--charcoal);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .block-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--smoke);
  }
  .block p {
    font-size: 14px;
    line-height: 1.85;
    color: #3A3A3E;
    margin-bottom: 12px;
  }
  .callout {
    background: var(--ink);
    color: #fff;
    padding: 36px 40px;
    margin: 40px 0;
    position: relative;
    overflow: hidden;
  }
  .callout::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 4px; height: 100%;
    background: var(--gold);
  }
  .callout-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 16px;
  }
  .callout p {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    line-height: 1.6;
    font-weight: 300;
    color: #eee;
  }
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin: 32px 0;
  }
  .card {
    padding: 28px 32px;
    border: 1px solid var(--smoke);
    position: relative;
  }
  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 2px;
    background: linear-gradient(90deg, var(--gold) 0%, transparent 100%);
  }
  .card-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 14px;
  }
  .card p {
    font-size: 13px;
    line-height: 1.8;
    color: var(--charcoal);
  }
  .criteria { display: grid; gap: 12px; margin: 24px 0 40px; }
  .criteria-item {
    display: flex;
    gap: 20px;
    padding: 20px 24px;
    background: var(--smoke);
    align-items: flex-start;
  }
  .criteria-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 300;
    color: var(--gold);
    line-height: 1;
    width: 32px;
    flex-shrink: 0;
  }
  .criteria-text {
    font-size: 13px;
    line-height: 1.7;
    color: var(--charcoal);
    padding-top: 4px;
  }
  .pillars {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    margin: 32px 0 40px;
  }
  .pillar {
    background: var(--smoke);
    padding: 32px 28px;
    position: relative;
  }
  .pillar-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 48px;
    font-weight: 300;
    color: var(--gold-pale);
    line-height: 1;
    margin-bottom: 16px;
  }
  .pillar-title {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--charcoal);
    margin-bottom: 12px;
  }
  .pillar p {
    font-size: 13px;
    line-height: 1.75;
    color: #555;
  }
  .alert-box {
    background: rgba(139,32,32,0.06);
    border-left: 3px solid var(--accent-red);
    padding: 24px 28px;
    margin: 28px 0 40px;
  }
  .export-alert {
    max-width: 1100px;
    margin: 56px auto 0;
  }
  .alert-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent-red);
    margin-bottom: 10px;
  }
  .alert-box p {
    font-size: 13px;
    line-height: 1.75;
    color: var(--charcoal);
  }
  strong { font-weight: 600; color: var(--ink); }
  em { font-style: italic; }
  code { font-family: 'DM Mono', monospace; background: var(--smoke); padding: 1px 5px; border-radius: 3px; }
  .doc-footer {
    background: var(--ink);
    padding: 56px 72px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .footer-brand {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px;
    font-weight: 500;
    color: var(--gold);
    letter-spacing: 0.1em;
  }
  .footer-info {
    text-align: right;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #555;
    line-height: 2;
    letter-spacing: 0.05em;
  }
  @media print {
    .print-action { display: none !important; }
    .cover { page-break-after: always; min-height: auto; }
    .toc-page { page-break-after: always; }
    .section { page-break-inside: avoid; }
  }
  @media (max-width: 900px) {
    .cover, .toc-page, .document-body, .doc-footer { padding-left: 28px; padding-right: 28px; }
    .section { grid-template-columns: 1fr; gap: 24px; }
    .section-sidebar { position: static; }
    .section-num { font-size: 48px; }
    .toc-grid, .two-col, .pillars { grid-template-columns: 1fr; }
    .sections-list { display: none; }
    .print-action { right: 16px; bottom: 16px; }
  }
</style>
</head>
<body>
<button class="print-action" onclick="window.print()">IMPRIMER · PDF</button>

<div class="cover">
  <div class="cover-header">
    <div class="brand-mark">KORYXA · MODE FONDATEUR</div>
    <div class="cover-meta">
      <div>Outil · ChatLAYA Founder</div>
      <div>Date · ${date}</div>
      <div>Sections · ${requiredWithFormulation} / ${requiredTotal} rédigées</div>
    </div>
  </div>

  <div class="cover-center">
    <div class="cover-tag">Dossier Projet Confidentiel</div>
    <div class="cover-title"><em>${escapeHtml(displayName.split(/\s+/)[0] || "Projet")}</em>${displayName.split(/\s+/).length > 1 ? `<br>${escapeHtml(displayName.split(/\s+/).slice(1).join(" "))}` : ""}</div>
    <div class="cover-subtitle">Synthèse de cadrage business · ChatLAYA Founder</div>
    <div class="cover-divider"></div>
    <p class="cover-desc">
      Ce dossier présente le cadrage stratégique généré avec ChatLAYA Founder : client idéal, problème central, offre, prix, modèle économique, pitch commercial et plan d'action.
    </p>
  </div>

  <div class="cover-footer">
    <div class="cover-footer-left">${isDossierComplete ? "DOCUMENT CONFIDENTIEL" : "BROUILLON DE TRAVAIL"}</div>
    <div class="sections-list">${coverPills}</div>
  </div>
</div>

<div class="toc-page">
  <div class="toc-inner">
    <div class="toc-label">Sommaire du Dossier</div>
    <div class="toc-grid">${toc}</div>
  </div>
</div>

${incompleteHtml}

<div class="document-shell">
  <div class="document-body">
    ${sections}
  </div>
</div>

<div class="doc-footer">
  <div>
    <div class="footer-brand">KORYXA</div>
    <div style="font-family:'DM Mono',monospace; font-size:11px; color:#444; letter-spacing:0.05em; margin-top:8px;">MODE FONDATEUR · ChatLAYA Founder</div>
  </div>
  <div class="footer-info">
    <div>Document Confidentiel</div>
    <div>${escapeHtml(displayName)} · Dossier Projet</div>
    <div>${date}</div>
  </div>
</div>
</body>
</html>`;
}

// ─── SynthesisView ────────────────────────────────────────────────────────────

interface SynthesisViewProps {
  ws: WorkspaceData;
  modules: ModuleDef[];
  firstName?: string;
  onBack: () => void;
  onExport: () => void;
}

function SynthesisView({ ws, modules, firstName, onBack, onExport }: SynthesisViewProps) {
  const [exportConfirm, setExportConfirm] = useState(false);
  const completed = modules.filter((m) => getMs(ws, m.id).status === "completed");
  // Only required sections matter for export readiness
  const withoutFormulation = completed.filter((m) => !m.optional && !getMs(ws, m.id).retention?.trim());
  const isExportReady = withoutFormulation.length === 0;

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#E7DED0] bg-[#FFFCF7] shadow-[0_2px_16px_rgba(16,16,21,0.06)]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#E7DED0] bg-gradient-to-r from-[#FFFCF7] to-[#F7F4EE] px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#6F6A60] transition hover:bg-white/80 hover:text-[#101015]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Retour
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6F6A60]">Dossier projet final</p>
            <p className="text-sm font-bold text-[#101015]">
              {firstName ? `Projet de ${firstName}` : "Votre dossier consolidé"}
            </p>
          </div>
          <button
            type="button"
            onClick={isExportReady ? onExport : () => setExportConfirm((v) => !v)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] ${isExportReady ? "bg-[#101015] ring-1 ring-[#B8963E]/30 hover:bg-[#1A1A20]" : "bg-amber-500 hover:bg-amber-600"}`}
          >
            <Download className="h-3.5 w-3.5" />
            {isExportReady ? "Exporter PDF" : `Exporter (${withoutFormulation.length} section${withoutFormulation.length > 1 ? "s" : ""} incomplète${withoutFormulation.length > 1 ? "s" : ""})`}
          </button>
        </div>
      </div>

      {/* Export confirmation — shown when required sections have no user formulation */}
      {exportConfirm ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-3">
          <div className="flex flex-wrap items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-amber-800">
                {withoutFormulation.length} section{withoutFormulation.length > 1 ? "s" : ""} sans formulation — le document exporté affichera des espaces vides à ces endroits.
              </p>
              <p className="mt-0.5 text-[11px] text-amber-700">
                Sections : {withoutFormulation.map((m) => DOC_LABELS[m.id]?.title ?? m.label).join(", ")}. Le contenu coaching ne sera pas inclus.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => setExportConfirm(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100">
                Annuler
              </button>
              <button type="button" onClick={() => { setExportConfirm(false); onExport(); }}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700">
                Exporter quand même
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto max-w-2xl">

          {/* Missing formulation hint */}
          {withoutFormulation.length > 0 ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">
                    {withoutFormulation.length} section{withoutFormulation.length > 1 ? "s" : ""} sans formulation finale
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">
                    <span className="font-medium">{withoutFormulation.map((m) => m.label).join(", ")}</span>
                    {" "}— ces sections apparaîtront comme non finalisées dans le document exporté. Le contenu coaching n'y sera pas inclus.
                    Retournez dans chaque étape pour rédiger votre formulation propre.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Intro */}
          <div className="mb-8 rounded-2xl border border-[#E7DED0] bg-gradient-to-br from-[#FFFCF7] to-[#F7F4EE] px-5 py-5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#B8963E]">Dossier Projet — Synthèse complète</p>
            <p className="text-sm leading-relaxed text-[#6F6A60]">
              {completed.length} section{completed.length > 1 ? "s" : ""} validée{completed.length > 1 ? "s" : ""}.{" "}
              Ce document présente votre projet cadré. Cliquez <strong className="font-semibold text-[#8A6A20]">Exporter PDF</strong> pour générer le dossier premium.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {completed.map((mod, modIdx) => {
              const mws = getMs(ws, mod.id);
              const Icon = mod.icon;
              const docLabel = DOC_LABELS[mod.id] ?? { title: mod.label, tagline: mod.tagline };
              const hasRetention = !!mws.retention?.trim();
              return (
                <div key={mod.id}>
                  {modIdx > 0 && <div className="mb-8 border-t border-slate-100" />}

                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#101015] text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6F6A60]">
                        Étape {mod.step}{mod.optional ? " · Optionnelle" : ""}
                      </p>
                      <p className="text-sm font-bold text-[#101015]">{docLabel.title}</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <Check className="h-3 w-3" />
                      Validée
                    </div>
                  </div>

                  {/* Main content — retention (project) or AI output (coaching fallback) */}
                  {hasRetention ? (
                    <div className="rounded-xl border border-[#E7DED0] bg-[#FFFCF7]/60 p-5">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#B8963E]">
                        Formulation finale
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#101015]">{mws.retention}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#E7DED0] bg-[#F7F4EE]/40 p-5">
                      <p className="mb-2 text-[10px] font-medium text-[#6F6A60]">
                        Réponse de coaching (formulation finale non renseignée)
                      </p>
                      <FounderOutput content={mws.output!} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={isExportReady ? onExport : () => setExportConfirm((v) => !v)}
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md transition active:scale-[0.98] ${isExportReady ? "bg-[#101015] ring-1 ring-[#B8963E]/30 hover:bg-[#1A1A20]" : "bg-amber-500 hover:bg-amber-600"}`}
            >
              <Download className="h-4 w-4" />
              {isExportReady ? "Télécharger le dossier HTML · Imprimer en PDF" : "Exporter le dossier incomplet"}
            </button>
          </div>

          <div className="h-8" />
        </div>
      </div>
    </section>
  );
}

// ─── FounderWorkspace ─────────────────────────────────────────────────────────

interface FounderWorkspaceProps {
  conversationId: string | null;
  firstName?: string;
  loginHref?: string;
  signupHref?: string;
  authRequired?: boolean;
  conversations?: FounderConversation[];
  selectedConversationId?: string | null;
  historyLoading?: boolean;
  onSelectConversation?: (conversationId: string) => void;
  onCreateConversation?: () => void;
  onArchiveConversation?: (conversationId: string) => void;
  onExit: () => void;
}

function FounderAccountButton({ firstName }: { firstName?: string }) {
  const label = firstName ? "Ouvrir l'espace Founder" : "Se connecter a Founder";
  const href = resolveFounderLoginHref();

  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#101015] text-white shadow-[0_12px_28px_rgba(16,16,21,0.22)] ring-1 ring-[#B8963E]/20 transition hover:-translate-y-0.5 hover:bg-[#B8963E] hover:shadow-[0_16px_34px_rgba(184,150,62,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] focus-visible:ring-offset-2"
    >
      <UserRound className="h-4 w-4" />
    </a>
  );
}

export default function FounderWorkspace({
  conversationId,
  firstName,
  loginHref,
  signupHref,
  authRequired = false,
  conversations = [],
  selectedConversationId,
  historyLoading = false,
  onSelectConversation,
  onCreateConversation,
  onArchiveConversation,
  onExit,
}: FounderWorkspaceProps) {
  const effectiveLoginHref = resolveFounderLoginHref(loginHref);
  const effectiveSignupHref = resolveFounderSignupHref(signupHref);
  const [activeId, setActiveId] = useState(MODULES[0].id);
  const [ws, setWs] = useState<WorkspaceData>({});
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [starterProject, setStarterProject] = useState("");
  const [generating, setGenerating] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedOutput, setCopiedOutput] = useState<string | null>(null);
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setWorkspaceLoaded(false);
    if (!conversationId) {
      setWs({});
      setWorkspaceLoaded(true);
      return;
    }
    const stored = loadWs(conversationId);
    setWs(stored);
    setStarterProject((stored.client?.inputs?.activite ?? "").trim());
    const firstIncomplete = MODULES.find((m) => { const s = stored[m.id]; return !s || s.status !== "completed"; });
    setActiveId(firstIncomplete?.id ?? MODULES[0].id);
    setWorkspaceLoaded(true);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !workspaceLoaded) return;
    saveWs(conversationId, ws);
  }, [conversationId, workspaceLoaded, ws]);
  useEffect(() => { contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [activeId]);
  useEffect(() => () => { streamAbortRef.current?.abort(); }, []);

  const updateMs = useCallback((id: string, patch: Partial<ModuleState>) => {
    setWs((prev) => { const cur = prev[id] ?? defaultMs(); return { ...prev, [id]: { ...cur, ...patch } }; });
  }, []);

  function updateInput(moduleId: string, fieldId: string, value: string) {
    setWs((prev) => {
      const cur = prev[moduleId] ?? defaultMs();
      const inputs = { ...cur.inputs, [fieldId]: value };
      const hasAnyInput = Object.values(inputs).some(Boolean);
      const status: ModuleStatus = cur.status === "completed" ? "completed" : hasAnyInput ? "in_progress" : "empty";
      return { ...prev, [moduleId]: { ...cur, inputs, status } };
    });
  }

  function updateRetention(moduleId: string, value: string) {
    setWs((prev) => {
      const cur = prev[moduleId] ?? defaultMs();
      const status: ModuleStatus = cur.status === "completed" ? "in_progress" : cur.status;
      return { ...prev, [moduleId]: { ...cur, retention: value, status } };
    });
  }

  function updateFinalFeedback(moduleId: string, value: string) {
    setWs((prev) => {
      const cur = prev[moduleId] ?? defaultMs();
      const status: ModuleStatus = cur.status === "completed" ? "in_progress" : cur.status;
      return { ...prev, [moduleId]: { ...cur, finalFeedback: value, status } };
    });
  }

  function startFounderFromBrief() {
    if (!conversationId) {
      window.location.assign(effectiveLoginHref);
      return;
    }
    const brief = starterProject.trim();
    if (!brief) return;
    setActiveId("client");
    updateInput("client", "activite", brief);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function generate(moduleId: string) {
    if (!conversationId || generating || finalizing) return;

    const current = getMs(ws, moduleId);
    const prompt = buildPrompt(moduleId, current.inputs, ws);

    setError(null);
    setGenerating(moduleId);
    // Preserve previous output for the revision UX
    updateMs(moduleId, { previousOutput: current.output ?? null, output: null });

    streamAbortRef.current?.abort();
    const ctrl = new AbortController();
    streamAbortRef.current = ctrl;

    try {
      const res = await fetch(apiUrl("/chatlaya/message"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversation_id: conversationId, message: prompt }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Erreur de génération.");
      }
      if (!(res.headers.get("content-type") || "").includes("text/event-stream"))
        throw new Error("Format de réponse inattendu.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let output = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        let boundary: number;
        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const packet = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          if (!packet.trim()) continue;
          let event = "message";
          const dataLines: string[] = [];
          for (const line of packet.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            if (line.startsWith("data:")) dataLines.push(line.slice(5));
          }
          const data = dataLines.join("\n");
          if (event === "token") { output += data; updateMs(moduleId, { output }); }
          else if (event === "done") {
            updateMs(moduleId, { output, status: output ? "in_progress" : getMs(ws, moduleId).status });
            return;
          } else if (event === "error") throw new Error(data || "Erreur de streaming.");
        }
      }
      if (output) updateMs(moduleId, { output, status: "in_progress" });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      updateMs(moduleId, { output: getMs(ws, moduleId).output });
    } finally {
      setGenerating(null);
    }
  }

  async function draftFinal(moduleId: string) {
    if (!conversationId || generating || finalizing) return;

    const current = getMs(ws, moduleId);
    if (!current.output?.trim()) return;
    const prompt = buildFinalDraftPrompt(moduleId, current, ws);

    setError(null);
    setFinalizing(moduleId);
    updateMs(moduleId, {
      previousRetention: current.retention ?? null,
      retention: "",
      status: current.status === "completed" ? "in_progress" : current.status,
    });

    streamAbortRef.current?.abort();
    const ctrl = new AbortController();
    streamAbortRef.current = ctrl;

    try {
      const res = await fetch(apiUrl("/chatlaya/message"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversation_id: conversationId, message: prompt }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Erreur de rédaction finale.");
      }
      if (!(res.headers.get("content-type") || "").includes("text/event-stream"))
        throw new Error("Format de réponse inattendu.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let output = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        let boundary: number;
        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const packet = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          if (!packet.trim()) continue;
          let event = "message";
          const dataLines: string[] = [];
          for (const line of packet.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            if (line.startsWith("data:")) dataLines.push(line.slice(5));
          }
          const data = dataLines.join("\n");
          if (event === "token") {
            output += data;
            updateMs(moduleId, { retention: cleanDossierText(output) });
          } else if (event === "done") {
            updateMs(moduleId, { retention: cleanDossierText(output), status: "in_progress" });
            return;
          } else if (event === "error") throw new Error(data || "Erreur de streaming.");
        }
      }
      if (output) updateMs(moduleId, { retention: cleanDossierText(output), status: "in_progress" });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      updateMs(moduleId, { retention: current.retention ?? "" });
    } finally {
      setFinalizing(null);
    }
  }

  function validate(moduleId: string) {
    const current = getMs(ws, moduleId);
    const retention = current.retention?.trim();
    if (!retention) return;
    updateMs(moduleId, { status: "completed", retention });
    const idx = MODULES.findIndex((m) => m.id === moduleId);
    const next = MODULES[idx + 1];
    if (next) setActiveId(next.id);
  }

  function reopen(moduleId: string) {
    updateMs(moduleId, { status: "in_progress" });
  }

  function copyOutput(moduleId: string, content: string) {
    const plain = content.replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/\*([^*\n]+)\*/g, "$1")
      .replace(/`([^`\n]+)`/g, "$1").replace(/^#{1,3}\s+/gm, "").trim();
    navigator.clipboard.writeText(plain).then(() => {
      setCopiedOutput(moduleId);
      setTimeout(() => setCopiedOutput((c) => (c === moduleId ? null : c)), 2000);
    }).catch(() => {});
  }

  function exportToHtml() {
    const html = generateHtmlExport(ws, MODULES, firstName);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) { setTimeout(() => URL.revokeObjectURL(url), 10000); }
    else {
      const a = document.createElement("a");
      a.href = url;
      a.download = `dossier-founder-koryxa-${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    }
  }

  const activeModule = MODULES.find((m) => m.id === activeId) ?? MODULES[0];
  const activeMs = getMs(ws, activeId);
  const isGenerating = generating === activeId;
  const isFinalizing = finalizing === activeId;
  const canValidateActive = Boolean(activeMs.retention?.trim()) && !isFinalizing;
  const isRevision = activeMs.status === "in_progress" && !!activeMs.previousOutput;
  const hasWorkspaceContent = Object.values(ws).some((state) =>
    state.status !== "empty" ||
    !!state.output ||
    !!state.previousOutput ||
    !!state.previousRetention ||
    !!state.retention?.trim() ||
    !!state.finalFeedback?.trim() ||
    Object.values(state.inputs).some((value) => !!value.trim()),
  );
  const showStarterPanel = workspaceLoaded && !hasWorkspaceContent && !generating && !finalizing;

  const completedCount = REQUIRED_MODULES.filter((m) => getMs(ws, m.id).status === "completed").length;
  const allDone = completedCount === REQUIRED_MODULES.length;

  const activeIdx = MODULES.findIndex((m) => m.id === activeId);
  const nextModule = activeIdx < MODULES.length - 1 ? MODULES[activeIdx + 1] : null;
  const historyItems = conversations.filter((item) => item.assistant_mode === "launch_structure_sell");
  const visibleHistory = historyItems.length ? historyItems : conversations;

  function selectHistoryConversation(nextConversationId: string) {
    setMobileHistoryOpen(false);
    onSelectConversation?.(nextConversationId);
  }

  function archiveHistoryConversation(nextConversationId: string) {
    onArchiveConversation?.(nextConversationId);
    if (selectedConversationId === nextConversationId) {
      setMobileHistoryOpen(false);
    }
  }

  if (!workspaceLoaded) {
    return (
      <main className="flex h-full min-h-0 items-center justify-center overflow-hidden">
        <div className="rounded-3xl border border-[#E7DED0] bg-[#FFFCF7]/90 px-6 py-4 text-sm font-medium text-[#6F6A60] shadow-[0_18px_48px_rgba(16,16,21,0.08)]">
          Préparation de l&apos;espace Founder...
        </div>
      </main>
    );
  }

  if (authRequired) {
    return (
      <main className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-[#E7DED0] bg-[#FFFCF7]/92 px-7 py-6 text-center shadow-[0_18px_48px_rgba(16,16,21,0.08)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0E6CC] ring-1 ring-[#E7DED0]">
            <UserRound className="h-5 w-5 text-[#B8963E]" />
          </div>
          <p className="text-base font-semibold text-[#101015]">Connexion requise pour Founder</p>
          <p className="mt-2 text-sm leading-relaxed text-[#6F6A60]">
            Connectez-vous pour retrouver vos dossiers Founder, continuer votre cadrage guidé et exporter votre document final.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3">
            {effectiveLoginHref ? (
              <div className="flex flex-col items-center gap-2">
                <a
                  href={effectiveLoginHref}
                  className="inline-flex items-center justify-center rounded-full bg-[#101015] px-5 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-[#B8963E]/20 transition hover:bg-[#1A1A20]"
                >
                  Se connecter
                </a>
                <a
                  href={effectiveLoginHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[#8A6A20] underline underline-offset-4 transition hover:text-[#101015]"
                >
                  Ouvrir la connexion Founder dans un nouvel onglet
                </a>
              </div>
            ) : null}
            <button
              type="button"
              onClick={onExit}
              className="text-xs text-slate-400 transition hover:text-slate-600"
            >
              Revenir au mode général
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Synthesis view ──
  if (showSynthesis) {
    return (
      <main className="h-full min-h-0 overflow-hidden">
        <SynthesisView ws={ws} modules={MODULES} firstName={firstName} onBack={() => setShowSynthesis(false)} onExport={exportToHtml} />
      </main>
    );
  }

  function renderHistoryPanel(collapsed = false) {
    return (
      <div className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#E7DED0] bg-[#FFFCF7] shadow-[0_2px_16px_rgba(16,16,21,0.06)] ${collapsed ? "items-center" : ""}`}>
        <div className={`shrink-0 border-b border-[#E7DED0] ${collapsed ? "w-full px-2 py-3" : "px-4 pb-3 pt-4"}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setHistoryCollapsed(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7DED0] bg-white text-[#6F6A60] transition hover:border-[#B8963E]/40 hover:bg-[#F0E6CC] hover:text-[#8A6A20]"
                title="Agrandir l'historique"
                aria-label="Agrandir l'historique"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onCreateConversation?.()}
                disabled={!onCreateConversation}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#101015] text-white shadow-sm ring-1 ring-[#B8963E]/20 transition hover:bg-[#1A1A20] disabled:cursor-not-allowed disabled:opacity-50"
                title="Nouveau dossier Founder"
                aria-label="Nouveau dossier Founder"
              >
                <MessageSquarePlus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6F6A60]">Historique Founder</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-[#101015]">
                  {firstName ? `Dossiers de ${firstName}` : "Vos conversations"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileHistoryOpen(false);
                    onCreateConversation?.();
                  }}
                  disabled={!onCreateConversation}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#101015] text-white shadow-sm ring-1 ring-[#B8963E]/20 transition hover:bg-[#1A1A20] disabled:cursor-not-allowed disabled:opacity-50"
                  title="Nouveau dossier Founder"
                  aria-label="Nouveau dossier Founder"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryCollapsed(true)}
                  className="hidden h-9 w-9 items-center justify-center rounded-xl border border-[#E7DED0] bg-white text-[#6F6A60] transition hover:border-[#B8963E]/40 hover:bg-[#F0E6CC] hover:text-[#8A6A20] lg:inline-flex"
                  title="Réduire l'historique"
                  aria-label="Réduire l'historique"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMobileHistoryOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7DED0] bg-white text-[#6F6A60] transition hover:bg-[#F0E6CC] hover:text-[#8A6A20] lg:hidden"
                  title="Fermer"
                  aria-label="Fermer l'historique"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`min-h-0 flex-1 overflow-y-auto ${collapsed ? "w-full px-2 py-2" : "px-2 py-2"}`}>
          {historyLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={`mb-1.5 animate-pulse rounded-xl bg-[#F0E6CC]/60 ${collapsed ? "mx-auto h-10 w-10" : "h-[68px]"}`} />
            ))
          ) : visibleHistory.length === 0 ? (
            collapsed ? (
              <div className="mx-auto mt-2 h-10 w-10 rounded-xl border border-dashed border-[#E7DED0]" title="Aucun dossier Founder" />
            ) : (
              <div className="rounded-xl border border-dashed border-[#E7DED0] px-3 py-4 text-xs text-[#6F6A60]">
                Aucun dossier Founder pour le moment.
              </div>
            )
          ) : (
            visibleHistory.map((conversation) => {
              const active = conversation.conversation_id === selectedConversationId;
              const title = normalizeTitle(conversation.title);
              if (collapsed) {
                return (
                  <button
                    key={conversation.conversation_id}
                    type="button"
                    onClick={() => selectHistoryConversation(conversation.conversation_id)}
                    title={title}
                    aria-label={title}
                    className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl border text-[#6F6A60] transition ${
                      active ? "border-[#B8963E]/30 bg-[#F0E6CC]/60 text-[#8A6A20] shadow-sm" : "border-transparent bg-white hover:border-[#E7DED0] hover:bg-[#F7F4EE]"
                    }`}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                );
              }
              return (
                <div
                  key={conversation.conversation_id}
                  className={`mb-1.5 rounded-xl border px-3 py-3 text-left transition ${
                    active ? "border-[#B8963E]/30 bg-[#F0E6CC]/40 shadow-[0_1px_4px_rgba(184,150,62,0.12)]" : "border-transparent bg-white hover:border-[#E7DED0] hover:bg-[#F7F4EE]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectHistoryConversation(conversation.conversation_id)}
                    className="block w-full text-left"
                  >
                    <p className={`truncate text-xs font-semibold leading-snug ${active ? "text-[#8A6A20]" : "text-[#101015]"}`}>
                      {title}
                    </p>
                    <p className="mt-1 text-[10px] text-[#6F6A60]">
                      {formatConversationDate(conversation.updated_at || conversation.created_at) || "Nouveau dossier"}
                    </p>
                  </button>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#F7F4EE] px-2 py-1 text-[10px] font-medium text-[#6F6A60] ring-1 ring-[#E7DED0]">
                      {active ? "Dossier actif" : "Dossier Founder"}
                    </span>
                    <button
                      type="button"
                      onClick={() => archiveHistoryConversation(conversation.conversation_id)}
                      disabled={!onArchiveConversation}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-[#6F6A60] transition hover:bg-[#F7F4EE] hover:text-[#101015] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Archive className="h-3 w-3" />
                      Archiver
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={`shrink-0 border-t border-[#E7DED0] ${collapsed ? "w-full px-2 py-3" : "px-3 py-3"}`}>
          <button
            type="button"
            onClick={onExit}
            className={collapsed
              ? "mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7DED0] text-[#6F6A60] transition hover:border-[#B8963E]/30 hover:bg-[#F0E6CC] hover:text-[#8A6A20]"
              : "w-full rounded-xl border border-[#E7DED0] px-3 py-2 text-[11px] font-medium text-[#6F6A60] transition hover:border-[#B8963E]/30 hover:bg-[#F0E6CC] hover:text-[#8A6A20]"
            }
            title="Mode général"
            aria-label="Mode général"
          >
            {collapsed ? <ChevronLeft className="h-4 w-4" /> : "← Mode général"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className={`grid h-full min-h-0 gap-3 overflow-hidden ${historyCollapsed ? "lg:grid-cols-[72px_minmax(0,1fr)]" : "lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]"}`}>

      <aside className="hidden min-h-0 lg:block">
        {renderHistoryPanel(historyCollapsed)}
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#E7DED0] bg-[#FFFCF7] shadow-[0_2px_16px_rgba(16,16,21,0.06)]">

        {error ? (
          <div className="shrink-0 border-b border-rose-100 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600">{error}</div>
        ) : null}

        {/* Module header */}
        <div className="shrink-0 border-b border-[#E7DED0] bg-[#F7F4EE]/80 px-5 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileHistoryOpen(true)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E7DED0] bg-white text-[#6F6A60] transition hover:border-[#B8963E]/30 hover:bg-[#F0E6CC] hover:text-[#8A6A20] lg:hidden"
              title="Historique Founder"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white ${isRevision ? "bg-amber-500" : "bg-[#101015]"}`}>
              {(() => { const Icon = activeModule.icon; return <Icon className="h-4 w-4" />; })()}
            </div>
            <p className="hidden flex-1 text-center font-serif text-[13px] italic leading-snug tracking-wide text-[#6F6A60] lg:block">
              {activeModule.description}
            </p>
            <div className="flex-1 lg:hidden" />
            <div className="flex shrink-0 items-center gap-2">
              {activeMs.status === "completed" ? (
                <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 lg:inline-flex">
                  <Check className="h-3 w-3" />
                  Validée
                </div>
              ) : null}
              <FounderAccountButton firstName={firstName} />
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MODULES.map((m) => {
              const mws = getMs(ws, m.id);
              const isCurrent = m.id === activeId;
              const isDone = mws.status === "completed";
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveId(m.id)}
                  className={`group flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-left transition ${
                    isCurrent
                      ? "border-[#B8963E]/40 bg-[#F0E6CC] text-[#8A6A20]"
                      : isDone
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-[#E7DED0] bg-white text-[#6F6A60] hover:border-[#B8963E]/30 hover:text-[#8A6A20]"
                  }`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone ? "bg-emerald-500 text-white" : isCurrent ? "bg-[#101015] text-white" : "bg-[#F7F4EE] text-[#6F6A60]"
                  }`}>
                    {isDone ? <Check className="h-3 w-3" /> : m.step}
                  </span>
                  <span className="hidden text-[11px] font-semibold sm:inline">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable content */}
        <div ref={contentRef}
          className="sidebar-nav min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-6 touch-pan-y [-webkit-overflow-scrolling:touch]">
          <div className={showStarterPanel ? "mx-auto flex min-h-full w-full max-w-5xl items-center py-2" : "mx-auto max-w-2xl space-y-5"}>
            {showStarterPanel ? (
              <div className="grid w-full items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_410px]">
                <div className="overflow-hidden rounded-[28px] border border-[#E7DED0] bg-[radial-gradient(circle_at_20%_20%,rgba(184,150,62,0.10),transparent_34%),linear-gradient(135deg,#F7F4EE_0%,#FFFCF7_48%,#F7F4EE_100%)] p-6 shadow-[0_18px_60px_rgba(16,16,21,0.07)] sm:p-7">
                  <div className="mb-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#E7DED0] bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A6A20] shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-[#B8963E]" />
                      ChatLAYA Founder
                    </div>
                  </div>

                  <div className="max-w-2xl">
                    <h2 className="text-[30px] font-black leading-[1.05] tracking-tight text-[#101015] sm:text-[38px]">
                      Cadrez votre projet.
                      <span className="block bg-gradient-to-r from-[#B8963E] via-[#8A6A20] to-[#101015] bg-clip-text text-transparent">
                        Repartez avec un dossier exploitable.
                      </span>
                    </h2>
                    <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#6F6A60]">
                      Un coach IA vous accompagne étape par étape pour clarifier votre client, votre problème, votre offre, votre prix, votre modèle économique et votre pitch commercial.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                    {REQUIRED_MODULES.map((mod) => {
                      const Icon = mod.icon;
                      return (
                        <div key={mod.id} className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-3.5 py-3 shadow-sm backdrop-blur">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0E6CC] text-[#8A6A20] ring-1 ring-[#E7DED0]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#101015]">{mod.label}</p>
                            <p className="truncate text-xs text-[#6F6A60]">{mod.tagline}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#E7DED0] bg-white/70 px-4 py-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#101015] text-white">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#101015]">Le livrable vendu</p>
                        <p className="mt-1 text-sm leading-6 text-[#6F6A60]">
                          Un dossier projet rédigé dans les mots de l'utilisateur, exportable et présentable à un partenaire, une équipe ou un investisseur.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-[28px] border border-[#E7DED0] bg-[#FFFCF7] p-5 shadow-[0_18px_60px_rgba(16,16,21,0.08)] sm:p-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6F6A60]">Point de départ</p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-[#101015]">
                      Décrivez votre projet en quelques phrases.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#6F6A60]">
                      Donnez l'idée, le client visé, ce que vous vendez ou ce que vous voulez lancer. Founder transformera ça en parcours de cadrage.
                    </p>

                    <textarea
                      value={starterProject}
                      onChange={(event) => setStarterProject(event.target.value)}
                      rows={7}
                      placeholder="Ex : Je veux vendre des PC portables performants aux étudiants et jeunes professionnels avec paiement échelonné..."
                      className="mt-5 w-full resize-none rounded-2xl border border-[#E7DED0] bg-[#F7F4EE]/70 px-4 py-4 text-base leading-7 text-[#101015] placeholder:text-[#B8963E]/40 transition focus:border-[#B8963E] focus:bg-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(184,150,62,0.08)]"
                    />
                  </div>

                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      onClick={startFounderFromBrief}
                      disabled={!starterProject.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101015] px-5 py-4 text-base font-bold text-white shadow-[0_12px_30px_rgba(16,16,21,0.18)] ring-1 ring-[#B8963E]/20 transition hover:bg-[#1A1A20] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {conversationId ? "Commencer le cadrage" : "Se connecter pour commencer"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {!conversationId ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <a
                          href={effectiveLoginHref}
                          className="inline-flex items-center justify-center rounded-2xl border border-[#B8963E]/40 bg-white px-4 py-3 text-sm font-bold text-[#8A6A20] transition hover:border-[#B8963E]/70 hover:bg-[#F0E6CC]"
                        >
                          Se connecter
                        </a>
                        <a
                          href={effectiveSignupHref}
                          className="inline-flex items-center justify-center rounded-2xl border border-[#E7DED0] bg-white px-4 py-3 text-sm font-bold text-[#101015] transition hover:border-[#B8963E]/30 hover:bg-[#F7F4EE]"
                        >
                          Créer un compte
                        </a>
                      </div>
                    ) : null}
                    <p className="text-center text-xs leading-5 text-[#6F6A60]">
                      {conversationId
                        ? "Ensuite, cette intro disparaît et vous travaillez étape par étape avec le coach."
                        : "Connexion securisee, puis retour direct sur ChatLAYA Founder."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>

            {/* Product intro — visible only on a fresh workspace */}
            {completedCount === 0 && !hasWorkspaceContent && !activeMs.output && !isGenerating ? (
              <div className="rounded-xl border border-[#E7DED0] bg-[#F7F4EE] px-4 py-4">
                <p className="text-xs font-semibold text-[#3A3530]">Espace de cadrage business guidé</p>
                <p className="mt-1 text-xs leading-5 text-[#6F6A60]">
                  En 6 étapes, Founder vous aide à clarifier votre client cible, votre problème, votre offre, votre prix, votre modèle de revenus et votre pitch commercial — et à rédiger un dossier projet structuré, exportable à la fin du parcours.
                </p>
              </div>
            ) : null}

            {/* Completion banner */}
            {allDone ? (
              <div className="rounded-2xl border border-[#B8963E]/30 bg-gradient-to-r from-[#F0E6CC]/40 to-[#FFFCF7] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#101015]">{firstName ? `Bravo ${firstName} !` : "Félicitations !"}</p>
                    <p className="text-xs text-[#6F6A60]">Les 6 étapes sont validées. Votre dossier est prêt.</p>
                  </div>
                  <button type="button" onClick={() => setShowSynthesis(true)}
                    className="flex shrink-0 items-center gap-2 rounded-full bg-[#101015] px-4 py-2 text-xs font-semibold text-white shadow-sm ring-1 ring-[#B8963E]/20 transition hover:bg-[#1A1A20]">
                    <BookOpen className="h-3.5 w-3.5" />
                    Dossier final
                  </button>
                </div>
              </div>
            ) : null}

            {/* Revision banner (AXE 1) */}
            {isRevision && !isGenerating ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <p className="text-xs font-semibold text-amber-800">Mode révision</p>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">
                  Modifiez vos réponses ci-dessous et régénérez pour affiner, ou revalidez directement la version existante.
                </p>
              </div>
            ) : null}

            {/* Input fields */}
            <div className="space-y-4">
              {activeModule.inputs.map((field) => (
                <div key={field.id}>
                  <label className="mb-1.5 block text-xs font-semibold text-[#101015]">
                    {field.label}
                    {field.optional ? <span className="ml-1.5 font-normal text-[#6F6A60]">(optionnel)</span> : null}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea value={activeMs.inputs[field.id] ?? ""} onChange={(e) => updateInput(activeId, field.id, e.target.value)}
                      placeholder={field.placeholder} rows={field.rows ?? 3} disabled={isGenerating}
                      className="w-full resize-none rounded-xl border border-[#E7DED0] bg-[#F7F4EE]/60 px-4 py-3 text-sm leading-relaxed text-[#101015] placeholder:text-[#B8963E]/40 transition focus:border-[#B8963E] focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(184,150,62,0.08)] disabled:opacity-60"
                    />
                  ) : (
                    <input type="text" value={activeMs.inputs[field.id] ?? ""} onChange={(e) => updateInput(activeId, field.id, e.target.value)}
                      placeholder={field.placeholder} disabled={isGenerating}
                      className="w-full rounded-xl border border-[#E7DED0] bg-[#F7F4EE]/60 px-4 py-3 text-sm text-[#101015] placeholder:text-[#B8963E]/40 transition focus:border-[#B8963E] focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(184,150,62,0.08)] disabled:opacity-60"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Generate button */}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => void generate(activeId)}
                disabled={!!generating || !!finalizing || !conversationId}
                className="flex items-center gap-2 rounded-full bg-[#101015] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(16,16,21,0.18)] ring-1 ring-[#B8963E]/20 transition hover:bg-[#1A1A20] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                <Sparkles className="h-3.5 w-3.5 text-[#B8963E]" />
                {isGenerating ? "Génération en cours…" : activeMs.output ? "Peaufiner avec ChatLAYA" : "Générer avec ChatLAYA"}
              </button>
              {isGenerating ? (
                <button type="button" onClick={() => streamAbortRef.current?.abort()}
                  className="text-xs text-[#6F6A60] transition hover:text-[#101015]">
                  Annuler
                </button>
              ) : null}
              {!isGenerating && generating && generating !== activeId ? (
                <span className="text-[11px] text-[#6F6A60]">Génération en cours sur une autre étape…</span>
              ) : null}
            </div>

            {/* Previous output (revision mode, while generating) */}
            {isGenerating && !activeMs.output && activeMs.previousOutput ? (
              <details className="rounded-xl border border-[#E7DED0]">
                <summary className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-medium text-[#6F6A60] hover:bg-[#F7F4EE]">
                  Voir la version précédente
                </summary>
                <div className="px-4 pb-4 pt-2 opacity-60">
                  <FounderOutput content={activeMs.previousOutput} />
                </div>
              </details>
            ) : null}

            {/* Generating animation */}
            {isGenerating && !activeMs.output ? <GeneratingCard firstName={firstName} /> : null}

            {/* AI output (coaching layer) */}
            {activeMs.output ? (
              <div className="group relative rounded-2xl border border-[#E7DED0] bg-white p-5 shadow-[0_4px_24px_rgba(184,150,62,0.08)]">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#101015]">
                    <span className="text-[8px] font-bold text-[#B8963E]">L</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8963E]">Analyse ChatLAYA</span>
                  {isGenerating ? (
                    <span className="ml-auto animate-pulse text-[10px] text-[#6F6A60]">En cours…</span>
                  ) : (
                    <button type="button" onClick={() => copyOutput(activeId, activeMs.output!)}
                      className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-[#6F6A60] opacity-0 transition-all hover:bg-[#F7F4EE] hover:text-[#101015] group-hover:opacity-100"
                      title="Copier">
                      {copiedOutput === activeId ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      {copiedOutput === activeId ? "Copié !" : "Copier"}
                    </button>
                  )}
                </div>
                <FounderOutput content={activeMs.output} />
              </div>
            ) : null}

            {/* Retention block — livrable final (AXE 2) */}
            {activeMs.output && !isGenerating ? (
              <RetentionBlock
                value={activeMs.retention ?? ""}
                onChange={(v) => updateRetention(activeId, v)}
                feedback={activeMs.finalFeedback ?? ""}
                onFeedbackChange={(v) => updateFinalFeedback(activeId, v)}
                onGenerateFinal={() => void draftFinal(activeId)}
                generatingFinal={isFinalizing}
                validated={activeMs.status === "completed"}
              />
            ) : null}

            {/* Actions bar */}
            {activeMs.output && !isGenerating ? (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {activeMs.status !== "completed" ? (
                  <button type="button" onClick={() => validate(activeId)}
                    disabled={!canValidateActive}
                    className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45">
                    <Check className="h-3.5 w-3.5" />
                    {isRevision ? "Revalider pour le dossier" : "Valider pour le dossier"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <Check className="h-3.5 w-3.5" />
                    Version dossier validée
                  </div>
                )}
                {activeMs.status === "completed" ? (
                  <button type="button" onClick={() => reopen(activeId)}
                    className="flex items-center gap-1.5 rounded-full border border-[#E7DED0] px-4 py-2 text-sm font-medium text-[#6F6A60] transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Modifier cette étape
                  </button>
                ) : null}
                {nextModule ? (
                  <button type="button" onClick={() => { if (activeMs.status !== "completed") validate(activeId); else setActiveId(nextModule.id); }}
                    disabled={activeMs.status !== "completed" && !canValidateActive}
                    className="ml-auto flex items-center gap-2 rounded-full border border-[#B8963E]/40 bg-[#F0E6CC]/40 px-5 py-2 text-sm font-semibold text-[#8A6A20] transition hover:bg-[#F0E6CC] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45">
                    {nextModule.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* Empty state */}
            {!activeMs.output && !isGenerating && !Object.values(activeMs.inputs).some(Boolean) ? (
              <div className="rounded-2xl border border-dashed border-[#E7DED0] px-5 py-6 text-center">
                <p className="text-sm font-semibold text-[#3A3530]">{activeModule.tagline}</p>
                <p className="mt-1 text-xs leading-6 text-[#6F6A60]">
                  Renseignez les champs ci-dessus puis cliquez sur{" "}
                  <span className="font-semibold text-[#B8963E]">Générer avec ChatLAYA</span>.
                </p>
              </div>
            ) : null}

            <div className="h-6" />
              </>
            )}
          </div>
        </div>
      </section>

      {mobileHistoryOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          {renderHistoryPanel(false)}
        </div>
      ) : null}
    </main>
  );
}

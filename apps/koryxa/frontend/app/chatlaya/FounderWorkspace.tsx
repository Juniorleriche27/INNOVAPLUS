"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Users, Target, Package, DollarSign, BarChart2, MessageCircle, FileText,
  Check, RotateCcw, ArrowRight, X, Sparkles, ChevronLeft,
  Copy, Download, BookOpen, PenLine, AlertCircle, UserRound, Menu, Archive,
  MessageSquarePlus,
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
      return `${SITE_BASE_URL}${path}?redirect=${encodeURIComponent(redirectTarget)}`;
    } catch {
      // Fall through to the server-safe fallback below.
    }
  }
  return fallback || `${SITE_BASE_URL}${path}?redirect=${encodeURIComponent(FOUNDER_AUTH_REDIRECT)}`;
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
  status: ModuleStatus;
  retention?: string;
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
    label: "Message de vente",
    tagline: "Comment convaincre et déclencher l'achat ?",
    description: "Rédigez des messages de vente courts, directs et adaptés à vos canaux.",
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
  vente:          { title: "Message de vente",                tagline: "Notre discours commercial" },
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

  switch (moduleId) {
    case "client":
      return (
        `Je travaille sur : ${inputs.activite || "(non précisé)"}. ` +
        `Mon client cible selon moi est : ${inputs.client_idee || "(non précisé)"}. ` +
        `Aide-moi à définir clairement mon client cible : qui il est vraiment, ses caractéristiques principales, ce qui le motive à acheter, et comment le trouver concrètement. Sois précis et actionnable.`
      );
    case "probleme":
      return (
        `Mon client cible est : ${client || "(non défini)"}. ` +
        `Je pense résoudre ce problème : ${inputs.probleme_idee || "(non précisé)"}. ` +
        `Aide-moi à formuler clairement ce problème : en quoi c'est douloureux pour le client, ce qu'il perd ou rate sans solution, et pourquoi ce problème vaut la peine d'être résolu. Sois concret.`
      );
    case "offre":
      return (
        `Mon client ${client ? `est : ${short(client)}` : "(défini à l'étape précédente)"}. ` +
        `${probleme ? `Le problème qu'il rencontre : ${short(probleme)}. ` : ""}` +
        `Mon offre est : ${inputs.offre_detail || "(non précisée)"}. ` +
        `Le client gagne ou évite : ${inputs.gain_client || "(non précisé)"}. ` +
        `Aide-moi à structurer une proposition de valeur claire et percutante : ce que je propose, pour qui, pourquoi c'est différent, et le bénéfice concret. En 3 à 5 points actionnables.`
      );
    case "prix":
      return (
        `${offre ? `Mon offre : ${short(offre)}. ` : ""}` +
        `Mon client : ${short(client || "(défini précédemment)")}. ` +
        `Je pense facturer : ${inputs.modele_prix || "(non précisé)"}` +
        `${inputs.niveau_prix ? `, avec un niveau de prix de : ${inputs.niveau_prix}` : ""}. ` +
        `Aide-moi à valider ma stratégie de prix : est-ce cohérent avec la valeur apportée, quelles questions je dois me poser, et comment tester mon prix rapidement.`
      );
    case "business_model":
      return (
        `${offre ? `Mon offre : ${short(offre)}. ` : ""}` +
        `${client ? `Mon client : ${short(client)}. ` : ""}` +
        `${prix ? `Mon prix : ${short(prix)}. ` : ""}` +
        `Je génère des revenus via : ${inputs.revenus || "(non précisé)"}. ` +
        `Aide-moi à structurer mon business model : flux de revenus principaux, coûts clés à anticiper, et comment le rendre plus solide ou scalable.`
      );
    case "vente":
      return (
        `${offre ? `Mon offre : ${short(offre, 120)}. ` : ""}` +
        `${client ? `Mon client : ${short(client, 100)}. ` : ""}` +
        `${probleme ? `Son problème : ${short(probleme, 100)}. ` : ""}` +
        `Je vends via : ${inputs.canal || "mes canaux habituels"}. ` +
        `Rédige un message de vente court, direct et convaincant adapté à ${inputs.canal || "ce canal"}. ` +
        `Il doit capter l'attention, montrer la valeur et appeler à l'action. Donne 2 à 3 variantes courtes.`
      );
    case "business_plan":
      return (
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
          return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*"))
          return <em key={i} className="italic text-slate-700">{part.slice(1, -1)}</em>;
        if (part.startsWith("`") && part.endsWith("`"))
          return <code key={i} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px] text-sky-700">{part.slice(1, -1)}</code>;
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
            return <h1 key={idx} className="text-base font-bold text-slate-900 pt-1">{renderInline(block.text)}</h1>;
          if (block.level === 2)
            return (
              <h2 key={idx} className="flex items-center gap-2.5 text-sm font-bold text-slate-800 pt-2">
                <span className="h-3.5 w-0.5 shrink-0 rounded-full bg-sky-400" />
                {renderInline(block.text)}
              </h2>
            );
          return <h3 key={idx} className="text-sm font-semibold text-slate-700 pt-1">{renderInline(block.text)}</h3>;
        }
        if (block.type === "ordered-list")
          return (
            <ol key={idx} className="space-y-2">
              {block.items.map((item, li) => (
                <li key={li} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-50 text-[10px] font-bold text-sky-600 ring-1 ring-sky-100">{li + 1}</span>
                  <span className="flex-1 text-sm leading-6 text-slate-700">{renderInline(item)}</span>
                </li>
              ))}
            </ol>
          );
        if (block.type === "unordered-list")
          return (
            <ul key={idx} className="space-y-2">
              {block.items.map((item, li) => (
                <li key={li} className="flex gap-2.5">
                  <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                  <span className="flex-1 text-sm leading-6 text-slate-700">{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        return <p key={idx} className="text-sm leading-7 text-slate-700">{renderInline(block.text)}</p>;
      })}
    </div>
  );
}

// ─── RetentionBlock (AXE 2 — livrable final) ─────────────────────────────────

function RetentionBlock({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PenLine className="h-3.5 w-3.5 text-violet-600" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-violet-700">
            Ma formulation pour le dossier
          </span>
        </div>
        <span className="text-[9px] font-medium text-violet-400 italic">
          apparaît dans le livrable final
        </span>
      </div>
      <p className="mb-2.5 text-[11px] leading-relaxed text-violet-500">
        Rédigez ici comme si vous présentiez ce point à un partenaire ou investisseur — sans jargon de coaching.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex : Ma cible principale sont les femmes entrepreneures de 28-42 ans qui veulent lancer une activité en ligne sans avoir de compétences techniques…"
        rows={4}
        className="w-full resize-none bg-transparent text-sm leading-relaxed text-violet-900 placeholder:text-violet-300/80 focus:outline-none"
      />
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
    <div className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-white px-5 py-4 shadow-[0_4px_24px_rgba(14,165,233,0.08)]">
      <div className="flex items-center gap-2.5">
        <div className="flex items-end gap-[5px]">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="kx-thinking-dot inline-block rounded-full bg-sky-500"
              style={{ width: i === 1 || i === 2 ? "7px" : "5px", height: i === 1 || i === 2 ? "7px" : "5px", animationDelay: `${i * 0.13}s` }}
            />
          ))}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">ChatLAYA réfléchit</span>
      </div>
      <p key={phase} className="kx-thinking-msg text-sm leading-relaxed text-slate-600">
        {firstName ? GENERATING_MSGS[phase] : GENERATING_MSGS[phase]}
      </p>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-slate-100">
        <div className="kx-thinking-scan h-full w-1/3 rounded-full bg-gradient-to-r from-sky-400 via-violet-400 to-sky-400" />
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

function extractCardSummary(mws: ModuleState, max = 110): string {
  const content = mws.retention?.trim();
  if (!content) return "";
  const clean = content.replace(/^#{1,3}\s+/gm, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "").trim();
  const sentence = clean.split(/\.\s/)[0].replace(/\n/g, " ");
  return sentence.length > max ? sentence.slice(0, max) + "…" : sentence;
}

function generateHtmlExport(ws: WorkspaceData, modules: ModuleDef[], firstName?: string): string {
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  const completed = modules.filter((m) => getMs(ws, m.id).status === "completed");
  const requiredTotal = modules.filter((m) => !m.optional).length;

  // Strict counts: only user-formulated sections count as truly ready for the document
  const requiredWithFormulation = modules.filter((m) => !m.optional && !!getMs(ws, m.id).retention?.trim()).length;
  const missingFormulation = completed.filter((m) => !m.optional && !getMs(ws, m.id).retention?.trim());
  const isDossierComplete = requiredWithFormulation === requiredTotal;

  // Summary cards — ONLY if user formulation exists (never coaching fallback)
  const summaryIds = ["client", "offre", "prix"];
  const summaryCards = summaryIds.map((id) => {
    const mws = getMs(ws, id);
    if (mws.status !== "completed") return "";
    const summary = extractCardSummary(mws);
    if (!summary) return "";
    const label = DOC_LABELS[id];
    return `<div class="card">
      <div class="card-label">${label.title}</div>
      <div class="card-value">${inlineToHtml(summary)}</div>
    </div>`;
  }).filter(Boolean).join("");

  // Incomplete document banner — shown when required sections lack user formulation
  const incompleteHtml = missingFormulation.length > 0 ? `
  <div class="incomplet-banner">
    <strong>Dossier incomplet</strong>
    <p>${missingFormulation.length} section${missingFormulation.length > 1 ? "s" : ""} sans formulation rédigée : <strong>${missingFormulation.map((m) => DOC_LABELS[m.id]?.title ?? m.label).join(", ")}</strong>. Ces sections apparaissent comme non finalisées ci-dessous. Retournez dans l'espace de travail pour rédiger vos formulations dossier.</p>
  </div>` : "";

  // Section bodies — STRICT: only user formulation, never AI coaching output
  const sections = completed.map((mod, idx) => {
    const mws = getMs(ws, mod.id);
    const docLabel = DOC_LABELS[mod.id] ?? { title: mod.label, tagline: mod.tagline };
    const retention = getDocContent(mws);

    const contentHtml = retention
      ? `<div class="prose-text">${retention.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>").replace(/^/, "<p>").replace(/$/, "</p>")}</div>`
      : `<div class="section-incomplete">
          <span class="section-incomplete-label">Formulation non rédigée</span>
          <p class="section-incomplete-hint">Cette section a été analysée en mode coaching mais la formulation finale n'a pas encore été rédigée. Le contenu coaching n'est pas inclus dans ce dossier.</p>
        </div>`;

    return `
    <div class="section">
      <div class="section-head">
        <div class="section-num">0${mod.step}</div>
        <div class="section-info">
          <div class="section-bar${retention ? "" : " section-bar-missing"}"></div>
          <div class="section-title">${docLabel.title}</div>
          <div class="section-tagline">${docLabel.tagline}</div>
        </div>
      </div>
      <div class="section-body">
        <div class="content">${contentHtml}</div>
      </div>
    </div>
    ${idx < completed.length - 1 ? '<hr class="rule">' : ""}`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dossier Projet${firstName ? ` · ${firstName}` : ""} — KORYXA Founder</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --blue:        #0ea5e9;
    --blue-dk:     #0284c7;
    --violet:      #7c3aed;
    --ink:         #0f172a;
    --ink-mid:     #334155;
    --ink-light:   #64748b;
    --ink-faint:   #94a3b8;
    --surface:     #f8fafc;
    --border:      #e2e8f0;
    --border-lite: #f1f5f9;
    --green:       #16a34a;
    --green-bg:    #f0fdf4;
    --green-bd:    #bbf7d0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
    background: #fff;
    color: var(--ink);
    line-height: 1.65;
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ─ Sticky print bar ─ */
  .print-bar {
    background: var(--ink);
    color: #fff;
    padding: 11px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    font-size: 12px;
  }
  .print-bar-label {
    font-weight: 600;
    letter-spacing: 0.06em;
    font-size: 11px;
    text-transform: uppercase;
    opacity: 0.55;
  }
  .print-btn {
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 7px 18px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    letter-spacing: 0.01em;
  }
  .print-btn:hover { background: var(--blue-dk); }

  /* ─ Document wrapper ─ */
  .doc { max-width: 820px; margin: 0 auto; padding: 64px 56px 80px; }

  /* ─ Cover ─ */
  .cover { margin-bottom: 56px; padding-bottom: 48px; border-bottom: 1px solid var(--border); }
  .cover-eyebrow {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 28px;
  }
  .cover-eyebrow::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border) 0%, transparent 100%);
    max-width: 300px;
  }
  .cover-main { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 24px; }
  .cover-left {}
  .cover-title {
    font-size: 38px;
    font-weight: 800;
    color: var(--ink);
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-bottom: 10px;
  }
  .cover-subtitle { font-size: 15px; color: var(--ink-light); }
  .cover-right { text-align: right; }
  .cover-meta { font-size: 12px; color: var(--ink-faint); line-height: 2; }
  .cover-meta strong { color: var(--ink-mid); font-weight: 600; }
  .cover-badge {
    display: inline-block;
    margin-top: 6px;
    background: var(--green-bg);
    color: var(--green);
    border: 1px solid var(--green-bd);
    border-radius: 20px;
    padding: 3px 12px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  /* ─ Summary cards ─ */
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 60px; }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 18px;
  }
  .card-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: var(--ink-faint);
    margin-bottom: 8px;
  }
  .card-value { font-size: 13px; font-weight: 500; color: var(--ink-mid); line-height: 1.55; }

  /* ─ Sections ─ */
  .section { margin-bottom: 48px; }
  .section-head { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 22px; }
  .section-num {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--border);
    line-height: 1;
    padding-top: 2px;
    min-width: 36px;
    font-variant-numeric: tabular-nums;
  }
  .section-info { flex: 1; }
  .section-bar {
    width: 32px;
    height: 2px;
    background: linear-gradient(90deg, var(--blue) 0%, var(--violet) 100%);
    border-radius: 1px;
    margin-bottom: 10px;
  }
  .section-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.02em;
    margin-bottom: 4px;
    line-height: 1.2;
  }
  .section-tagline { font-size: 12px; color: var(--ink-faint); letter-spacing: 0.01em; }

  /* ─ Content ─ */
  .section-body { padding-left: 56px; }
  .content h1 { font-size: 15px; font-weight: 700; color: var(--ink); margin: 18px 0 8px; }
  .content h2 {
    font-size: 13px; font-weight: 700; color: var(--ink-mid);
    margin: 16px 0 8px;
    display: flex; align-items: center; gap: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-lite);
  }
  .content h2::before {
    content: '';
    width: 3px; height: 13px;
    background: var(--blue);
    border-radius: 2px;
    flex-shrink: 0;
  }
  .content h3 { font-size: 12.5px; font-weight: 600; color: var(--ink-mid); margin: 12px 0 5px; }
  .content p  { font-size: 13.5px; line-height: 1.8; color: #374151; margin: 8px 0; }
  .content ul { margin: 10px 0; padding: 0; list-style: none; }
  .content ul li {
    position: relative; padding: 5px 0 5px 18px;
    font-size: 13.5px; color: #374151; line-height: 1.72;
  }
  .content ul li + li { border-top: 1px solid var(--border-lite); }
  .content ul li::before {
    content: ''; position: absolute; left: 0; top: 13px;
    width: 6px; height: 6px;
    background: var(--blue); border-radius: 50%;
  }
  .content ol { margin: 10px 0; padding: 0; list-style: none; counter-reset: li; }
  .content ol li {
    position: relative; padding: 6px 0 6px 36px;
    font-size: 13.5px; color: #374151; line-height: 1.72;
    counter-increment: li;
  }
  .content ol li + li { border-top: 1px solid var(--border-lite); }
  .content ol li::before {
    content: counter(li);
    position: absolute; left: 0; top: 7px;
    width: 22px; height: 22px;
    background: #e0f2fe; color: var(--blue);
    font-size: 10px; font-weight: 700;
    border-radius: 50%; text-align: center; line-height: 22px;
  }
  .content strong { font-weight: 600; color: var(--ink); }
  .content em     { font-style: italic; color: var(--ink-mid); }
  .content code   { background: #f1f5f9; color: var(--blue-dk); padding: 1px 5px; border-radius: 4px; font-size: 12px; }

  /* User-written formulation (retention) — rendered as plain text */
  .prose-text p { font-size: 13.5px; line-height: 1.8; color: #374151; margin: 6px 0; }

  /* Incomplete section placeholder (no user formulation — coaching not included) */
  .section-incomplete { border: 1px dashed var(--border); border-radius: 8px; padding: 20px 24px; background: var(--surface); }
  .section-incomplete-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--ink-faint); display: block; margin-bottom: 8px; }
  .section-incomplete-hint { font-size: 12px; color: var(--ink-faint); line-height: 1.7; font-style: italic; margin: 0; }
  .section-bar-missing { background: var(--border) !important; }

  /* Incomplete document warning banner */
  .incomplet-banner { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px 22px; margin-bottom: 40px; }
  .incomplet-banner strong { color: #92400e; font-weight: 700; }
  .incomplet-banner p { color: #78350f; font-size: 12px; margin-top: 6px; line-height: 1.75; }
  .cover-badge-incomplete { background: #fffbeb !important; color: #92400e !important; border-color: #fde68a !important; }

  /* ─ Divider ─ */
  .rule { border: none; border-top: 1px solid var(--border-lite); margin: 48px 0; }

  /* ─ Footer ─ */
  .footer {
    margin-top: 72px; padding-top: 24px;
    border-top: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
    font-size: 11px; color: var(--ink-faint);
  }
  .footer-brand { font-weight: 700; color: var(--ink-mid); letter-spacing: 0.04em; }

  /* ─ Print ─ */
  @media print {
    .print-bar { display: none !important; }
    .doc { padding: 28px 32px 40px; }
    .cover-title { font-size: 28px; }
    body { font-size: 12px; }
    .content p, .content li { font-size: 12px; }
    .section { page-break-inside: avoid; }
    .cards { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="print-bar">
  <span class="print-bar-label">KORYXA · Dossier Fondateur</span>
  <button class="print-btn" onclick="window.print()">Imprimer · Sauvegarder en PDF</button>
</div>
<div class="doc">

  <!-- Cover -->
  <div class="cover">
    <div class="cover-eyebrow">KORYXA · Mode Fondateur</div>
    <div class="cover-main">
      <div class="cover-left">
        <div class="cover-title">Dossier Projet${firstName ? `<br><span style="color:#0ea5e9">${firstName}</span>` : ""}</div>
        <div class="cover-subtitle">Synthèse de cadrage business · ChatLAYA Founder</div>
      </div>
      <div class="cover-right">
        <div class="cover-meta">
          <div><strong>Date</strong> · ${date}</div>
          <div><strong>Sections rédigées</strong> · ${requiredWithFormulation} / ${requiredTotal}</div>
          <div><strong>Outil</strong> · ChatLAYA Founder</div>
        </div>
        <div class="cover-badge${isDossierComplete ? "" : " cover-badge-incomplete"}">${isDossierComplete ? "Dossier complet" : requiredWithFormulation === 0 ? "Brouillon" : "Dossier incomplet"}</div>
      </div>
    </div>
  </div>

  ${incompleteHtml}

  ${summaryCards ? `<!-- Summary cards -->\n  <div class="cards">${summaryCards}</div>` : ""}

  <!-- Sections -->
  ${sections}

  <!-- Footer -->
  <div class="footer">
    <div><span class="footer-brand">KORYXA</span> &mdash; Document confidentiel &mdash; ChatLAYA Founder</div>
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
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.06)]">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-sky-50/60 to-violet-50/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-white/80 hover:text-slate-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Retour
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dossier projet final</p>
            <p className="text-sm font-bold text-slate-800">
              {firstName ? `Projet de ${firstName}` : "Votre dossier consolidé"}
            </p>
          </div>
          <button
            type="button"
            onClick={isExportReady ? onExport : () => setExportConfirm((v) => !v)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] ${isExportReady ? "bg-sky-600 hover:bg-sky-700" : "bg-amber-500 hover:bg-amber-600"}`}
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
          <div className="mb-8 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-violet-50 px-5 py-5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-sky-600">Dossier Projet — Synthèse complète</p>
            <p className="text-sm leading-relaxed text-slate-600">
              {completed.length} section{completed.length > 1 ? "s" : ""} validée{completed.length > 1 ? "s" : ""}.{" "}
              Ce document présente votre projet cadré. Cliquez <strong className="font-semibold text-sky-700">Exporter PDF</strong> pour générer le dossier premium.
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        Étape {mod.step}{mod.optional ? " · Optionnelle" : ""}
                      </p>
                      <p className="text-sm font-bold text-slate-800">{docLabel.title}</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <Check className="h-3 w-3" />
                      Validée
                    </div>
                  </div>

                  {/* Main content — retention (project) or AI output (coaching fallback) */}
                  {hasRetention ? (
                    <div className="rounded-xl border border-violet-200 bg-violet-50/30 p-5">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-violet-600">
                        Formulation finale
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-violet-900">{mws.retention}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-5">
                      <p className="mb-2 text-[10px] font-medium text-slate-400">
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
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md transition active:scale-[0.98] ${isExportReady ? "bg-sky-600 hover:bg-sky-700" : "bg-amber-500 hover:bg-amber-600"}`}
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
  const label = firstName ? "Ouvrir l'accès KORYXA" : "Se connecter a KORYXA";
  const href = resolveFounderLoginHref();

  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/10 transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-[0_16px_34px_rgba(2,132,199,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
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
  const [error, setError] = useState<string | null>(null);
  const [copiedOutput, setCopiedOutput] = useState<string | null>(null);
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
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
    setWs((prev) => { const cur = prev[moduleId] ?? defaultMs(); return { ...prev, [moduleId]: { ...cur, retention: value } }; });
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
    if (!conversationId || generating) return;

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

  function validate(moduleId: string) {
    updateMs(moduleId, { status: "completed" });
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
  const isRevision = activeMs.status === "in_progress" && !!activeMs.previousOutput;
  const hasWorkspaceContent = Object.values(ws).some((state) =>
    state.status !== "empty" ||
    !!state.output ||
    !!state.previousOutput ||
    !!state.retention?.trim() ||
    Object.values(state.inputs).some((value) => !!value.trim()),
  );
  const showStarterPanel = workspaceLoaded && !hasWorkspaceContent && !generating;

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
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 px-6 py-4 text-sm font-medium text-slate-600 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          Préparation de l&apos;espace Founder...
        </div>
      </main>
    );
  }

  if (authRequired) {
    return (
      <main className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/92 px-7 py-6 text-center shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100">
            <UserRound className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-base font-semibold text-slate-800">Connexion requise pour Founder</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Connectez-vous pour retrouver vos dossiers Founder, continuer votre cadrage guidé et exporter votre document final.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3">
            {effectiveLoginHref ? (
              <div className="flex flex-col items-center gap-2">
                <a
                  href={effectiveLoginHref}
                  className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                >
                  Se connecter
                </a>
                <a
                  href={effectiveLoginHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-sky-700 underline underline-offset-4 transition hover:text-sky-900"
                >
                  Ouvrir la connexion KORYXA dans un nouvel onglet
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

  const historyPanel = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.06)]">
      <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Historique Founder</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">
              {firstName ? `Dossiers de ${firstName}` : "Vos conversations"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setMobileHistoryOpen(false);
              onCreateConversation?.();
            }}
            disabled={!onCreateConversation}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Nouveau dossier Founder"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {historyLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="mb-1.5 h-[68px] animate-pulse rounded-xl bg-slate-100" />
          ))
        ) : visibleHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-xs text-slate-400">
            Aucun dossier Founder pour le moment.
          </div>
        ) : (
          visibleHistory.map((conversation) => {
            const active = conversation.conversation_id === selectedConversationId;
            return (
              <div
                key={conversation.conversation_id}
                className={`mb-1.5 rounded-xl border px-3 py-3 text-left transition ${
                  active ? "border-sky-200 bg-sky-50 shadow-[0_1px_4px_rgba(14,165,233,0.10)]" : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectHistoryConversation(conversation.conversation_id)}
                  className="block w-full text-left"
                >
                  <p className={`truncate text-xs font-semibold leading-snug ${active ? "text-sky-700" : "text-slate-800"}`}>
                    {normalizeTitle(conversation.title)}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {formatConversationDate(conversation.updated_at || conversation.created_at) || "Nouveau dossier"}
                  </p>
                </button>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                    {active ? "Dossier actif" : "Dossier Founder"}
                  </span>
                  <button
                    type="button"
                    onClick={() => archiveHistoryConversation(conversation.conversation_id)}
                    disabled={!onArchiveConversation}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
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

      <div className="shrink-0 border-t border-slate-100 px-3 py-3">
        <button
          type="button"
          onClick={onExit}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-medium text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
        >
          ← Mode général
        </button>
      </div>
    </div>
  );

  return (
    <main className="grid h-full min-h-0 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.06)]">

        {error ? (
          <div className="shrink-0 border-b border-rose-100 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600">{error}</div>
        ) : null}

        {/* Module header */}
        <div className="shrink-0 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileHistoryOpen(true)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 lg:hidden"
              title="Historique Founder"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white ${isRevision ? "bg-amber-500" : "bg-sky-600"}`}>
              {(() => { const Icon = activeModule.icon; return <Icon className="h-4 w-4" />; })()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Étape {activeModule.step}{activeModule.optional ? " · Optionnelle" : ""}
                {isRevision ? " · Révision" : ""}
              </p>
              <p className="text-sm font-bold text-slate-800">{activeModule.label}</p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {activeMs.status === "completed" ? (
                <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 lg:inline-flex">
                  <Check className="h-3 w-3" />
                  Validée
                </div>
              ) : null}
              <FounderAccountButton firstName={firstName} />
            </div>
          </div>
          <p className="mt-1.5 hidden text-xs text-slate-500 lg:block">{activeModule.description}</p>
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
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : isDone
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone ? "bg-emerald-500 text-white" : isCurrent ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"
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
                <div className="overflow-hidden rounded-[28px] border border-sky-100 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.16),transparent_34%),linear-gradient(135deg,#f8fbff_0%,#ffffff_48%,#f5f3ff_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-7">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                      ChatLAYA Founder
                    </div>
                    <FounderAccountButton firstName={firstName} />
                  </div>

                  <div className="max-w-2xl">
                    <h2 className="text-[30px] font-black leading-[1.05] tracking-tight text-slate-950 sm:text-[38px]">
                      Cadrez votre projet.
                      <span className="block bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
                        Repartez avec un dossier exploitable.
                      </span>
                    </h2>
                    <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600">
                      Un coach IA vous accompagne étape par étape pour clarifier votre client, votre problème, votre offre, votre prix, votre modèle économique et votre message de vente.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                    {REQUIRED_MODULES.map((mod) => {
                      const Icon = mod.icon;
                      return (
                        <div key={mod.id} className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-3.5 py-3 shadow-sm backdrop-blur">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800">{mod.label}</p>
                            <p className="truncate text-xs text-slate-500">{mod.tagline}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-2xl border border-violet-100 bg-white/70 px-4 py-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 text-white">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Le livrable vendu</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Un dossier projet rédigé dans les mots de l'utilisateur, exportable et présentable à un partenaire, une équipe ou un investisseur.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.10)] sm:p-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Point de départ</p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                      Décrivez votre projet en quelques phrases.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Donnez l'idée, le client visé, ce que vous vendez ou ce que vous voulez lancer. Founder transformera ça en parcours de cadrage.
                    </p>

                    <textarea
                      value={starterProject}
                      onChange={(event) => setStarterProject(event.target.value)}
                      rows={7}
                      placeholder="Ex : Je veux vendre des PC portables performants aux étudiants et jeunes professionnels avec paiement échelonné..."
                      className="mt-5 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-base leading-7 text-slate-800 placeholder:text-slate-400 transition focus:border-sky-300 focus:bg-white focus:outline-none focus:shadow-[0_0_0_4px_rgba(14,165,233,0.08)]"
                    />
                  </div>

                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      onClick={startFounderFromBrief}
                      disabled={!starterProject.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-4 text-base font-bold text-white shadow-[0_12px_30px_rgba(2,132,199,0.24)] transition hover:bg-sky-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {conversationId ? "Commencer le cadrage" : "Se connecter pour commencer"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {!conversationId ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <a
                          href={effectiveLoginHref}
                          className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
                        >
                          Se connecter
                        </a>
                        <a
                          href={effectiveSignupHref}
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Créer un compte
                        </a>
                      </div>
                    ) : null}
                    <p className="text-center text-xs leading-5 text-slate-400">
                      {conversationId
                        ? "Ensuite, cette intro disparaît et vous travaillez étape par étape avec le coach."
                        : "L'authentification se fait sur KORYXA, puis vous revenez directement sur ChatLAYA Founder."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>

            {/* Product intro — visible only on a fresh workspace */}
            {completedCount === 0 && !hasWorkspaceContent && !activeMs.output && !isGenerating ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-4">
                <p className="text-xs font-semibold text-slate-600">Espace de cadrage business guidé</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  En 6 étapes, Founder vous aide à clarifier votre client cible, votre problème, votre offre, votre prix, votre modèle de revenus et votre message de vente — et à rédiger un dossier projet structuré, exportable à la fin du parcours.
                </p>
              </div>
            ) : null}

            {/* Completion banner */}
            {allDone ? (
              <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-violet-50 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">{firstName ? `Bravo ${firstName} !` : "Félicitations !"}</p>
                    <p className="text-xs text-slate-600">Les 6 étapes sont validées. Votre dossier est prêt.</p>
                  </div>
                  <button type="button" onClick={() => setShowSynthesis(true)}
                    className="flex shrink-0 items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700">
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
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    {field.label}
                    {field.optional ? <span className="ml-1.5 font-normal text-slate-400">(optionnel)</span> : null}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea value={activeMs.inputs[field.id] ?? ""} onChange={(e) => updateInput(activeId, field.id, e.target.value)}
                      placeholder={field.placeholder} rows={field.rows ?? 3} disabled={isGenerating}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 transition focus:border-sky-300 focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(14,165,233,0.07)] disabled:opacity-60"
                    />
                  ) : (
                    <input type="text" value={activeMs.inputs[field.id] ?? ""} onChange={(e) => updateInput(activeId, field.id, e.target.value)}
                      placeholder={field.placeholder} disabled={isGenerating}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-300 focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(14,165,233,0.07)] disabled:opacity-60"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Generate button */}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => void generate(activeId)}
                disabled={!!generating || !conversationId}
                className="flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                <Sparkles className="h-3.5 w-3.5" />
                {isGenerating ? "Génération en cours…" : activeMs.output ? "Régénérer" : "Générer avec ChatLAYA"}
              </button>
              {isGenerating ? (
                <button type="button" onClick={() => streamAbortRef.current?.abort()}
                  className="text-xs text-slate-400 transition hover:text-slate-600">
                  Annuler
                </button>
              ) : null}
              {!isGenerating && generating && generating !== activeId ? (
                <span className="text-[11px] text-slate-400">Génération en cours sur une autre étape…</span>
              ) : null}
            </div>

            {/* Previous output (revision mode, while generating) */}
            {isGenerating && !activeMs.output && activeMs.previousOutput ? (
              <details className="rounded-xl border border-slate-200">
                <summary className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
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
              <div className="group relative rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_4px_24px_rgba(14,165,233,0.07)]">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600">
                    <span className="text-[8px] font-bold text-white">L</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">Analyse ChatLAYA</span>
                  {isGenerating ? (
                    <span className="ml-auto animate-pulse text-[10px] text-slate-400">En cours…</span>
                  ) : (
                    <button type="button" onClick={() => copyOutput(activeId, activeMs.output!)}
                      className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
                      title="Copier">
                      {copiedOutput === activeId ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      {copiedOutput === activeId ? "Copié !" : "Copier"}
                    </button>
                  )}
                </div>
                <FounderOutput content={activeMs.output} />
              </div>
            ) : null}

            {/* Actions bar */}
            {activeMs.output && !isGenerating ? (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {activeMs.status !== "completed" ? (
                  <button type="button" onClick={() => validate(activeId)}
                    className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]">
                    <Check className="h-3.5 w-3.5" />
                    {isRevision ? "Revalider cette version" : "Valider cette étape"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <Check className="h-3.5 w-3.5" />
                    Étape validée
                  </div>
                )}
                {activeMs.status === "completed" ? (
                  <button type="button" onClick={() => reopen(activeId)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Modifier cette étape
                  </button>
                ) : null}
                {nextModule ? (
                  <button type="button" onClick={() => { if (activeMs.status !== "completed") validate(activeId); else setActiveId(nextModule.id); }}
                    className="ml-auto flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-5 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 active:scale-[0.98]">
                    {nextModule.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* Retention block — livrable final (AXE 2) */}
            {activeMs.status === "completed" && activeMs.output && !isGenerating ? (
              <RetentionBlock value={activeMs.retention ?? ""} onChange={(v) => updateRetention(activeId, v)} />
            ) : null}

            {/* Empty state */}
            {!activeMs.output && !isGenerating && !Object.values(activeMs.inputs).some(Boolean) ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-6 text-center">
                <p className="text-sm font-semibold text-slate-600">{activeModule.tagline}</p>
                <p className="mt-1 text-xs leading-6 text-slate-400">
                  Renseignez les champs ci-dessus puis cliquez sur{" "}
                  <span className="font-semibold text-sky-600">Générer avec ChatLAYA</span>.
                </p>
              </div>
            ) : null}

            <div className="h-6" />
              </>
            )}
          </div>
        </div>
      </section>

      <aside className="hidden min-h-0 lg:block">
        {historyPanel}
      </aside>

      {mobileHistoryOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fermer l'historique Founder"
            onClick={() => setMobileHistoryOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
          />
          <div className="absolute inset-y-0 left-0 w-[86vw] max-w-sm p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/90">Historique Founder</p>
              <button
                type="button"
                onClick={() => setMobileHistoryOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {historyPanel}
          </div>
        </div>
      ) : null}
    </main>
  );
}

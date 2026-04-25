"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Clock, Zap } from "lucide-react";
import { PUBLIC_ROUTES } from "@/config/routes";
import { INNOVA_API_BASE } from "@/lib/env";
import { FLOW_STORAGE_KEY, type TrajectoryFlowResponse } from "./flow";

// ─── Types ────────────────────────────────────────────────────────────────────

type AnswerState = {
  current_status: string;
  current_sector: string;
  daily_description: string;
  main_task: string;
  automate_wish: string;
  ai_maturity: string;
  ai_tools_used: string[];
  tech_unknown_reaction: string;
  existing_skills: string[];
  portfolio_status: string;
  ex_data: string;
  ex_ambiguity: string;
  ex_production: string;
  target_roles: string[];
  goal_type: string;
  target_timeline: string;
  weekly_hours: string;
  support_style: string;
  work_mode: string;
  budget_range: string;
  project_topic: string;
  success_metric: string;
  past_abandon_reason: string;
};

type PhaseId =
  | "realite" | "quotidien" | "maturite" | "base"
  | "ex_data" | "ex_ambiguity" | "ex_production"
  | "visee" | "capacite" | "cas_reel";

type PhaseConfig = {
  id: PhaseId;
  number: string;
  label: string;
};

type QuestionConfig = {
  id: keyof AnswerState;
  phaseId: PhaseId;
  title: string;
  hint?: string;
  isExercise?: boolean;
  timedSeconds?: number;
};

type Option = { value: string; label: string; hint?: string; emoji?: string; exclusive?: boolean };

// ─── Phases (for strip) ───────────────────────────────────────────────────────

const PHASES: PhaseConfig[] = [
  { id: "realite",       number: "01", label: "Réalité" },
  { id: "quotidien",     number: "02", label: "Quotidien" },
  { id: "maturite",      number: "03", label: "Maturité IA" },
  { id: "base",          number: "04", label: "Base" },
  { id: "ex_data",       number: "05", label: "Exercice 1" },
  { id: "ex_ambiguity",  number: "06", label: "Exercice 2" },
  { id: "ex_production", number: "07", label: "Exercice 3" },
  { id: "visee",         number: "08", label: "Visée" },
  { id: "capacite",      number: "09", label: "Capacité" },
  { id: "cas_reel",      number: "10", label: "Cas réel" },
];

// ─── Questions (flat, one per screen) ─────────────────────────────────────────

const QUESTIONS: QuestionConfig[] = [
  // Phase 01 — Réalité
  { id: "current_status",  phaseId: "realite",  title: "Quelle est votre situation professionnelle aujourd'hui ?" },
  { id: "current_sector",  phaseId: "realite",  title: "Dans quel domaine IA souhaitez-vous vous positionner ?" },
  // Phase 02 — Quotidien
  { id: "daily_description", phaseId: "quotidien", title: "Décrivez votre quotidien professionnel", hint: "Que faites-vous vraiment ? Quels outils, quels livrables, quels interlocuteurs ? (min. 20 caractères)" },
  { id: "main_task",         phaseId: "quotidien", title: "Quel type d'intervention IA vous correspond le mieux ?" },
  { id: "automate_wish",     phaseId: "quotidien", title: "Ce que vous aimeriez le plus automatiser ou déléguer à l'IA ?" },
  // Phase 03 — Maturité IA
  { id: "ai_maturity",           phaseId: "maturite", title: "Où en êtes-vous vraiment avec l'intelligence artificielle ?" },
  { id: "ai_tools_used",         phaseId: "maturite", title: "Quels outils IA avez-vous déjà utilisés ?" },
  { id: "tech_unknown_reaction", phaseId: "maturite", title: "Votre premier réflexe face à un outil ou concept technique inconnu ?" },
  // Phase 04 — Base
  { id: "existing_skills",  phaseId: "base", title: "Quelles compétences êtes-vous capable de mobiliser aujourd'hui ?" },
  { id: "portfolio_status", phaseId: "base", title: "Quel est l'état actuel de vos preuves et livrables ?" },
  // Phase 05 — Exercice 1
  { id: "ex_data", phaseId: "ex_data", title: "Exercice — Réflexe analytique", hint: "Lisez la situation et répondez en 45 secondes. Si le temps expire sans réponse, on continue automatiquement.", isExercise: true, timedSeconds: 45 },
  // Phase 06 — Exercice 2
  { id: "ex_ambiguity", phaseId: "ex_ambiguity", title: "Exercice — Gestion de l'ambiguïté", hint: "Situation incomplète. Votre réflexe spontané en 60 secondes.", isExercise: true, timedSeconds: 60 },
  // Phase 07 — Exercice 3
  { id: "ex_production", phaseId: "ex_production", title: "Exercice — Instinct de production", hint: "Situation de livraison rapide. Votre premier geste en 45 secondes.", isExercise: true, timedSeconds: 45 },
  // Phase 08 — Visée
  { id: "target_roles",    phaseId: "visee", title: "Quel(s) rôle(s) visez-vous dans l'IA ?", hint: "2 maximum. Le diagnostic peut recommander autre chose selon vos exercices." },
  { id: "goal_type",       phaseId: "visee", title: "Quel est votre objectif principal ?" },
  { id: "target_timeline", phaseId: "visee", title: "Dans quel délai souhaitez-vous l'atteindre ?" },
  // Phase 09 — Capacité
  { id: "weekly_hours",  phaseId: "capacite", title: "Combien de temps pouvez-vous vraiment consacrer chaque semaine ?" },
  { id: "support_style", phaseId: "capacite", title: "Quel cadre d'accompagnement correspond le mieux à votre façon de progresser ?" },
  { id: "work_mode",     phaseId: "capacite", title: "Comment préférez-vous intervenir sur une mission ?", hint: "Cette information aide KORYXA à vous proposer des opportunités qui correspondent à votre mode de travail." },
  { id: "budget_range",  phaseId: "capacite", title: "Quel est votre budget mensuel disponible pour votre montée en compétences ?" },
  // Phase 10 — Cas réel
  { id: "project_topic",       phaseId: "cas_reel", title: "Quel problème concret voulez-vous résoudre avec l'IA ?", hint: "Plus c'est précis, plus le diagnostic sera actionnable. (min. 15 caractères)" },
  { id: "success_metric",      phaseId: "cas_reel", title: "À quoi ressemble le succès pour vous ?", hint: "Un chiffre, un livrable, un signal mesurable. (min. 15 caractères)" },
  { id: "past_abandon_reason", phaseId: "cas_reel", title: "Qu'est-ce qui vous a déjà fait arrêter une formation ou un apprentissage ?" },
];

// ─── Option arrays ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS: Option[] = [
  { value: "Étudiant ou en formation", label: "Étudiant ou en formation", emoji: "🎓", hint: "Vous construisez encore votre base académique." },
  { value: "Salarié en poste", label: "Salarié en poste", emoji: "💼", hint: "Vous voulez évoluer sans repartir de zéro." },
  { value: "En reconversion professionnelle", label: "En reconversion", emoji: "🔄", hint: "Vous changez de trajectoire professionnelle." },
  { value: "Freelance ou indépendant", label: "Freelance / Indépendant", emoji: "🧭", hint: "Vous cherchez une offre ou des missions plus solides." },
  { value: "Entrepreneur", label: "Entrepreneur", emoji: "🚀", hint: "Vous voulez intégrer l'IA dans un service ou produit." },
  { value: "En recherche d'emploi", label: "En recherche d'emploi", emoji: "🔎", hint: "Vous avez besoin d'un positionnement plus crédible." },
];

const SECTOR_OPTIONS: Option[] = [
  { value: "ia_data_reporting",    label: "Data & Reporting IA",       emoji: "📊", hint: "Tableaux de bord automatisés, KPIs en temps réel, analyse prédictive." },
  { value: "ia_automatisation",    label: "Automatisation IA",         emoji: "🤖", hint: "Suppression des tâches répétitives, workflows intelligents, scripts." },
  { value: "ia_marketing_content", label: "Marketing & Contenu IA",    emoji: "📣", hint: "Génération de contenu, personnalisation, acquisition assistée par IA." },
  { value: "ia_sales_crm",         label: "Sales & CRM IA",            emoji: "🤝", hint: "Scoring de leads, relances automatiques, pipeline intelligent." },
  { value: "ia_ops_process",       label: "Ops & Process IA",          emoji: "⚙️", hint: "Optimisation des processus, détection d'anomalies, coordination IA." },
  { value: "ia_rh_talent",         label: "RH & Talent IA",            emoji: "🤲", hint: "Recrutement IA, matching RH, analyse des compétences." },
  { value: "ia_finance_pilotage",  label: "Finance & Pilotage IA",     emoji: "💳", hint: "Prévisions financières IA, détection de fraude, contrôle de gestion." },
  { value: "ia_produit_tech",      label: "Produit & Tech IA",         emoji: "💻", hint: "Intégration IA dans un produit, APIs IA, LLMs, no-code IA." },
  { value: "ia_service_client",    label: "Service Client IA",         emoji: "💬", hint: "Chatbots, réponses automatisées, analyse sentiment, tickets IA." },
  { value: "ia_strategie",         label: "Stratégie & Décision IA",   emoji: "🎯", hint: "Aide à la décision, diagnostic IA, veille et intelligence compétitive." },
];

const MAIN_TASK_OPTIONS: Option[] = [
  { value: "automatisation",     label: "Automatisation IA",           emoji: "🤖", hint: "Construire des workflows IA qui remplacent les tâches manuelles." },
  { value: "analyse_reporting",  label: "Analyse & Reporting IA",      emoji: "📊", hint: "Dashboards, modèles de données, insights actionnables." },
  { value: "llm_prompting",      label: "LLM & Prompting",             emoji: "🧠", hint: "Intégration de modèles de langage, prompt engineering, agents IA." },
  { value: "ml_prediction",      label: "ML & Prédiction",             emoji: "📈", hint: "Modèles prédictifs, scoring, recommandations, détection d'anomalies." },
  { value: "ia_marketing",       label: "IA Marketing & Contenu",      emoji: "📣", hint: "Génération de contenu IA, personnalisation, SEO automatisé." },
  { value: "ia_produit",         label: "IA dans un produit",          emoji: "💻", hint: "Intégrer l'IA dans une application, un service ou une API." },
  { value: "formation_ia",       label: "Formation & Montée en IA",    emoji: "🎓", hint: "Acculturer une équipe, former des collaborateurs, coacher en IA." },
  { value: "audit_strategie_ia", label: "Audit & Stratégie IA",        emoji: "🔍", hint: "Diagnostiquer la maturité IA, définir une roadmap, choisir les bons outils." },
  { value: "ia_ops",             label: "IA Ops & Infrastructure",     emoji: "🏗️", hint: "Déploiement de modèles, MLOps, orchestration, monitoring IA." },
];

const AUTOMATE_OPTIONS: Option[] = [
  { value: "La saisie manuelle et les copier-coller", label: "Saisie manuelle / copier-coller" },
  { value: "La consolidation de fichiers Excel", label: "Consolidation de fichiers Excel" },
  { value: "La rédaction de comptes-rendus ou rapports", label: "Comptes-rendus et rapports" },
  { value: "Le suivi et les relances", label: "Suivi et relances" },
  { value: "La veille ou la recherche d'information", label: "Veille et recherche d'info" },
  { value: "La production de visuels ou présentations", label: "Visuels et présentations" },
  { value: "Les tâches répétitives de communication", label: "Communication répétitive" },
  { value: "Je ne sais pas encore", label: "Je ne sais pas encore" },
];

const AI_MATURITY_OPTIONS: Option[] = [
  { value: "Je n'ai jamais vraiment utilisé l'IA", label: "Je n'ai jamais vraiment utilisé l'IA", emoji: "🌱", hint: "Je connais le mot mais je n'ai rien produit avec." },
  { value: "J'ai testé ChatGPT mais sans cadre", label: "J'ai testé, sans méthode ni cadre", emoji: "🧪", hint: "Quelques prompts, des essais, mais rien de structuré ni reproductible." },
  { value: "J'utilise l'IA sur quelques cas précis", label: "J'utilise l'IA sur des cas précis", emoji: "⚡", hint: "Quelques outils intégrés, des résultats visibles." },
  { value: "J'ai des résultats mesurables avec l'IA", label: "J'ai des résultats mesurables", emoji: "🔥", hint: "Je peux citer des gains de temps, des livrables ou des chiffres." },
];

const AI_TOOLS_OPTIONS: Option[] = [
  { value: "ChatGPT / Claude", label: "ChatGPT / Claude" },
  { value: "Copilot (Microsoft)", label: "Copilot (Microsoft)" },
  { value: "Gemini (Google)", label: "Gemini (Google)" },
  { value: "Midjourney / DALL·E", label: "Midjourney / DALL·E" },
  { value: "Make / Zapier", label: "Make / Zapier" },
  { value: "Notion AI / Perplexity", label: "Notion AI / Perplexity" },
  { value: "Power BI / Tableau", label: "Power BI / Tableau" },
  { value: "Python / LangChain", label: "Python / LangChain" },
  { value: "Aucun outil IA à ce jour", label: "Aucun outil à ce jour", exclusive: true },
];

const TECH_REACTION_OPTIONS: Option[] = [
  { value: "Je cherche un tutoriel ou une formation", label: "Je cherche un tutoriel ou une formation", hint: "Apprendre avant d'essayer." },
  { value: "Je plonge directement dedans", label: "Je plonge directement dedans", hint: "Essayer, me tromper, comprendre." },
  { value: "Je cherche quelqu'un qui s'y connaît", label: "Je cherche quelqu'un qui s'y connaît", hint: "Trouver un expert ou un pair." },
  { value: "J'attends que ça soit plus accessible", label: "J'attends que ça soit plus accessible", hint: "Ne pas toucher jusqu'à ce que ce soit clair." },
];

const SKILL_OPTIONS: Option[] = [
  { value: "Excel / Google Sheets", label: "Excel / Google Sheets" },
  { value: "SQL", label: "SQL" },
  { value: "Python", label: "Python" },
  { value: "Power BI / Tableau", label: "Power BI / Tableau" },
  { value: "Prompting avancé", label: "Prompting avancé" },
  { value: "No-code (Make, Zapier, Airtable)", label: "No-code (Make, Zapier…)" },
  { value: "Machine Learning / Modélisation", label: "Machine Learning / Modèles" },
  { value: "Gestion de projet (Jira, Notion…)", label: "Gestion de projet" },
  { value: "Contenu / Copywriting", label: "Contenu / Copywriting" },
  { value: "Statistiques appliquées", label: "Statistiques appliquées" },
  { value: "Aucune de ces compétences", label: "Aucune pour l'instant", exclusive: true },
];

const PORTFOLIO_OPTIONS: Option[] = [
  { value: "Aucune preuve visible aujourd'hui", label: "Aucune preuve visible", hint: "Rien de présentable, je pars de zéro." },
  { value: "Quelques notes ou essais personnels", label: "Quelques notes ou essais perso", hint: "Des traces, pas encore défendables." },
  { value: "Un ou deux mini-projets réalisés", label: "Un ou deux mini-projets", hint: "Quelque chose de montrable, même imparfait." },
  { value: "Des livrables ou missions réels", label: "Des livrables ou missions réels", hint: "Des preuves sur de vrais projets ou clients." },
];

const EX_DATA_OPTIONS: Option[] = [
  { value: "analyse_data_first", label: "Je cherche d'abord quelles colonnes ou indicateurs peuvent expliquer la baisse.", hint: "→ Réflexe analytique / data-driven" },
  { value: "automate_process_first", label: "Je regarde le processus de saisie et je cherche où il y a des erreurs ou pertes.", hint: "→ Réflexe opérationnel / process" },
  { value: "structure_message_first", label: "Je commence par formuler les bonnes questions à poser avant de toucher aux données.", hint: "→ Réflexe cadrage / communication" },
  { value: "tool_first", label: "Je demande directement à ChatGPT ou un outil d'analyser le fichier.", hint: "→ Réflexe outillage / rapidité" },
];

const EX_AMBIGUITY_OPTIONS: Option[] = [
  { value: "seek_data_signal", label: "Je demande les chiffres les plus récents et je construis une hypothèse.", hint: "→ Profil analytique" },
  { value: "map_process_signal", label: "Je cartographie ce qui a changé dans le processus commercial ces 3 derniers mois.", hint: "→ Profil opérationnel" },
  { value: "clarify_stakeholder", label: "Je reformule le besoin avec la directrice pour savoir ce qu'elle entend vraiment.", hint: "→ Profil conseil / management" },
  { value: "test_tool_now", label: "Je génère une synthèse rapide avec les données disponibles et je la soumets dès ce soir.", hint: "→ Profil action / livraison" },
];

const EX_PRODUCTION_OPTIONS: Option[] = [
  { value: "dashboard_reflex", label: "Je crée un mini dashboard ou une vue synthétique qui rend un problème visible.", hint: "→ Profil Data / Visualisation" },
  { value: "automation_reflex", label: "Je construis une petite automatisation ou un workflow qui fait gagner du temps.", hint: "→ Profil Automatisation / Ops" },
  { value: "content_reflex", label: "Je produis un prompt, un template ou un contenu prêt à l'emploi pour l'équipe.", hint: "→ Profil Contenu / Marketing IA" },
  { value: "framing_reflex", label: "Je cadre le problème, j'identifie la valeur attendue et je présente un plan clair.", hint: "→ Profil Conseil / Produit IA" },
];

const TARGET_ROLES_OPTIONS: Option[] = [
  { value: "Data Analyst IA", label: "Data Analyst IA" },
  { value: "AI Automation Specialist", label: "AI Automation Specialist" },
  { value: "AI Marketing Operator", label: "AI Marketing Operator" },
  { value: "AI Productivity & Ops", label: "AI Productivity & Ops" },
  { value: "Consultant / Freelance IA", label: "Consultant / Freelance IA" },
  { value: "AI Product Manager", label: "AI Product Manager" },
  { value: "Data Scientist", label: "Data Scientist" },
  { value: "ML Engineer", label: "ML Engineer" },
  { value: "Entrepreneur IA", label: "Entrepreneur IA" },
  { value: "Je ne sais pas encore", label: "Je ne sais pas encore", exclusive: true },
];

const GOAL_TYPE_OPTIONS: Option[] = [
  { value: "Décrocher un emploi dans l'IA", label: "Décrocher un emploi dans l'IA", hint: "Être recruté sur un poste IA." },
  { value: "Évoluer en interne vers un rôle IA", label: "Évoluer en interne", hint: "Changer de rôle dans mon entreprise actuelle." },
  { value: "Lancer une activité IA", label: "Lancer une activité IA", hint: "Créer un produit, service ou offre IA." },
  { value: "Décrocher des missions freelance", label: "Missions freelance IA", hint: "Facturer des projets IA à la mission." },
  { value: "Intégrer l'IA dans mon métier actuel", label: "Intégrer l'IA dans mon métier", hint: "Garder mon poste, monter en compétence IA." },
  { value: "Explorer et m'orienter", label: "Explorer / M'orienter", hint: "Comprendre d'abord ce qui m'est accessible." },
];

const TIMELINE_OPTIONS: Option[] = [
  { value: "3 mois", label: "3 mois", emoji: "⚡", hint: "Urgence, rythme intense, résultats rapides." },
  { value: "6 mois", label: "6 mois", emoji: "🎯", hint: "Rythme soutenu, progression solide." },
  { value: "1 an", label: "1 an", emoji: "🌱", hint: "Construction durable, pas de pression." },
  { value: "À mon rythme", label: "À mon rythme", emoji: "♾️", hint: "Pas de deadline fixe." },
];

const WEEKLY_HOURS_OPTIONS: Option[] = [
  { value: "Moins de 2h", label: "Moins de 2h / semaine", hint: "Sessions courtes, morceaux de 15-30 min." },
  { value: "2h à 5h", label: "2h à 5h / semaine", hint: "1 à 2 sessions bien bloquées." },
  { value: "5h à 10h", label: "5h à 10h / semaine", hint: "Engagement régulier, 3-4 sessions." },
  { value: "Plus de 10h", label: "Plus de 10h / semaine", hint: "Immersion intensive." },
];

const SUPPORT_OPTIONS: Option[] = [
  { value: "Autonomie — un plan clair suffit", label: "Autonomie totale", hint: "Donnez-moi la carte, je trace ma route." },
  { value: "Guidage — étapes précises à valider", label: "Guidage pas à pas", hint: "Je veux savoir exactement quoi faire chaque semaine." },
  { value: "Validation humaine à des jalons", label: "Points de validation humains", hint: "Des moments de contrôle avec un expert." },
  { value: "Focus livrables et portfolio", label: "Focus livrables et preuves", hint: "J'apprends surtout en construisant des choses réelles." },
];

const BUDGET_OPTIONS: Option[] = [
  { value: "Aucun budget formation", label: "Aucun budget pour l'instant", hint: "Ressources gratuites uniquement." },
  { value: "Moins de 50€/mois", label: "Moins de 50€ / mois", hint: "Je priorise les essentiels." },
  { value: "50€ à 150€/mois", label: "50€ à 150€ / mois", hint: "J'investis si ça vaut la peine." },
  { value: "Plus de 150€/mois", label: "Plus de 150€ / mois", hint: "Je considère ça comme un investissement." },
];

const COLLAB_MODE_OPTIONS: Option[] = [
  { value: "mission_courte",         label: "Mission courte (1-4 semaines)",  hint: "Livrable précis, démarrage rapide." },
  { value: "mission_longue",         label: "Mission longue (1-6 mois)",      hint: "Accompagnement continu, engagement durable." },
  { value: "retainer",               label: "Récurrent / Retainer",           hint: "Quelques heures par semaine sur la durée." },
  { value: "remote",                 label: "100% Remote",                    hint: "Tout à distance, asynchrone possible." },
  { value: "presentiel",             label: "Présentiel possible",            hint: "Je peux me déplacer selon les besoins." },
  { value: "execution_autonome",     label: "Exécution autonome",             hint: "Je travaille seul et rends les livrables." },
  { value: "collaboration_integree", label: "Collaboration avec l'équipe",    hint: "Je m'intègre dans l'équipe en place." },
];

const ABANDON_OPTIONS: Option[] = [
  { value: "Le manque de structure claire", label: "Le manque de structure claire" },
  { value: "La perte de motivation après quelques semaines", label: "La perte de motivation" },
  { value: "Le contenu trop théorique ou déconnecté", label: "Contenu trop théorique / déconnecté" },
  { value: "Le manque de temps dans mon quotidien", label: "Le manque de temps" },
  { value: "La difficulté technique trop élevée", label: "La difficulté technique trop haute" },
  { value: "Jamais vraiment commencé une formation", label: "Je n'ai jamais vraiment commencé" },
];

const INITIAL: AnswerState = {
  current_status: "", current_sector: "",
  daily_description: "", main_task: "", automate_wish: "",
  ai_maturity: "", ai_tools_used: [], tech_unknown_reaction: "",
  existing_skills: [], portfolio_status: "",
  ex_data: "", ex_ambiguity: "", ex_production: "",
  target_roles: [], goal_type: "", target_timeline: "",
  weekly_hours: "", support_style: "", work_mode: "", budget_range: "",
  project_topic: "", success_metric: "", past_abandon_reason: "",
};

// ─── Per-question completion check ────────────────────────────────────────────

function isQuestionComplete(q: QuestionConfig, a: AnswerState): boolean {
  switch (q.id) {
    case "current_status":        return !!a.current_status;
    case "current_sector":        return !!a.current_sector;
    case "daily_description":     return a.daily_description.trim().length >= 20;
    case "main_task":             return !!a.main_task;
    case "automate_wish":         return !!a.automate_wish;
    case "ai_maturity":           return !!a.ai_maturity;
    case "ai_tools_used":         return a.ai_tools_used.length > 0;
    case "tech_unknown_reaction": return !!a.tech_unknown_reaction;
    case "existing_skills":       return a.existing_skills.length > 0;
    case "portfolio_status":      return !!a.portfolio_status;
    case "ex_data":               return true;
    case "ex_ambiguity":          return true;
    case "ex_production":         return true;
    case "target_roles":          return a.target_roles.length > 0;
    case "goal_type":             return !!a.goal_type;
    case "target_timeline":       return !!a.target_timeline;
    case "weekly_hours":          return !!a.weekly_hours;
    case "support_style":         return !!a.support_style;
    case "work_mode":             return !!a.work_mode;
    case "budget_range":          return !!a.budget_range;
    case "project_topic":         return a.project_topic.trim().length >= 15;
    case "success_metric":        return a.success_metric.trim().length >= 15;
    case "past_abandon_reason":   return !!a.past_abandon_reason;
    default:                      return false;
  }
}

// ─── Payload builder ──────────────────────────────────────────────────────────

function exSignal(k: string): string {
  const m: Record<string, string> = {
    analyse_data_first: "analytique/data", automate_process_first: "opérationnel/process",
    structure_message_first: "cadrage/communication", tool_first: "outillage/rapidité",
    seek_data_signal: "analytique", map_process_signal: "opérationnel",
    clarify_stakeholder: "conseil/management", test_tool_now: "action/livraison",
    dashboard_reflex: "data/visualisation", automation_reflex: "automatisation/ops",
    content_reflex: "contenu/marketing IA", framing_reflex: "conseil/produit IA",
    no_response: "non répondu sous pression",
  };
  return m[k] ?? k;
}

function buildPayload(a: AnswerState) {
  const roles = a.target_roles.filter((r) => r !== "Je ne sais pas encore");
  const skills = a.existing_skills.filter((s) => s !== "Aucune de ces compétences");
  const cognitiveProfile = [
    a.ex_data ? `Réflexe analytique → ${exSignal(a.ex_data)}` : "",
    a.ex_ambiguity ? `Gestion ambiguïté → ${exSignal(a.ex_ambiguity)}` : "",
    a.ex_production ? `Instinct production → ${exSignal(a.ex_production)}` : "",
  ].filter(Boolean).join(" | ");
  const contextParts = [
    `Situation : ${a.current_status || "non précisé"}.`,
    `Secteur : ${a.current_sector || "non précisé"}.`,
    a.daily_description.trim() ? `Quotidien : ${a.daily_description.trim()}.` : "",
    a.main_task ? `Tâche principale : ${a.main_task}.` : "",
    a.automate_wish ? `Souhait d'automatisation : ${a.automate_wish}.` : "",
    `Maturité IA : ${a.ai_maturity || "non précisé"}.`,
    a.ai_tools_used.length ? `Outils IA : ${a.ai_tools_used.join(", ")}.` : "",
    `Réaction technique : ${a.tech_unknown_reaction || "non précisé"}.`,
    skills.length ? `Compétences : ${skills.join(", ")}.` : "Aucune compétence technique déclarée.",
    `Portfolio : ${a.portfolio_status || "non précisé"}.`,
    cognitiveProfile ? `Profil cognitif (exercices) : ${cognitiveProfile}.` : "",
    a.support_style ? `Cadre préféré : ${a.support_style}.` : "",
    a.budget_range ? `Budget formation : ${a.budget_range}.` : "",
    a.project_topic.trim() ? `Sujet concret : ${a.project_topic.trim()}.` : "",
    a.success_metric.trim() ? `Signal de succès : ${a.success_metric.trim()}.` : "",
    a.past_abandon_reason ? `Frein passé : ${a.past_abandon_reason}.` : "",
  ].filter(Boolean);
  return {
    objective: roles.length ? `Se positionner sur ${roles.join(" / ")} · ${a.goal_type || ""}` : `${a.goal_type || "Orientation à clarifier"}`,
    current_level: a.ai_maturity,
    domain_interest: a.current_sector,
    weekly_rhythm: a.weekly_hours,
    target_outcome: roles.join(" / ") || "à clarifier",
    context: contextParts.join(" "),
    constraints: [a.past_abandon_reason].filter(Boolean),
    preferences: [a.support_style, a.tech_unknown_reaction].filter(Boolean),
    current_status: a.current_status,
    current_sector: a.current_sector,
    target_roles: roles,
    existing_skills: skills,
    portfolio_status: a.portfolio_status,
    ai_tools_used: a.ai_tools_used,
    exercise_results: {
      data_reflex: a.ex_data || "no_response",
      ambiguity_reflex: a.ex_ambiguity || "no_response",
      production_reflex: a.ex_production || "no_response",
    },
    project_topic: a.project_topic.trim(),
    success_metric: a.success_metric.trim(),
    work_mode: a.work_mode,
  };
}

// ─── UI atoms ─────────────────────────────────────────────────────────────────

function OptionCard({ option, active, onClick }: { option: Option; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-checked={active} role="radio"
      className={`group relative w-full rounded-[18px] border px-4 py-3.5 text-left transition-all duration-150 sm:rounded-[20px] sm:px-5 sm:py-4 ${active ? "border-slate-900 bg-slate-900 text-white shadow-[0_20px_40px_rgba(15,23,42,0.15)]" : "border-slate-200 bg-white text-slate-900 hover:border-slate-400 hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)]"}`}
    >
      <div className="flex items-start gap-3 pr-8 sm:pr-9">
        {option.emoji ? <span className="mt-0.5 text-base leading-none sm:text-lg">{option.emoji}</span> : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-6 sm:text-[13.5px]">{option.label}</p>
          {option.hint ? <p className={`mt-1 text-xs leading-5 sm:text-[11.5px] ${active ? "text-slate-300" : "text-slate-500"}`}>{option.hint}</p> : null}
        </div>
      </div>
      <span className={`absolute right-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full border transition ${active ? "border-white bg-white text-slate-900" : "border-slate-200 bg-white text-transparent"}`}>
        <Check className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-150 sm:w-auto ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}
    >
      {active ? <Check className="h-3.5 w-3.5" /> : null}
      {label}
    </button>
  );
}

function ExerciseSituation({ children, timedSeconds, secondsLeft }: { children: React.ReactNode; timedSeconds: number; secondsLeft: number | null }) {
  const pct = secondsLeft !== null ? (secondsLeft / timedSeconds) * 100 : 0;
  const color = secondsLeft !== null ? (secondsLeft > timedSeconds * 0.5 ? "#10b981" : secondsLeft > timedSeconds * 0.2 ? "#f59e0b" : "#ef4444") : "#6b7280";
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-800 bg-slate-950 text-white">
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
            <Zap className="h-3 w-3" />Situation
          </span>
          {secondsLeft !== null ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tabular-nums" style={{ borderColor: `${color}50`, color }}>
              <Clock className="h-3 w-3" />{secondsLeft}s
            </span>
          ) : null}
        </div>
        <div className="text-sm leading-7 text-slate-100">{children}</div>
      </div>
      {secondsLeft !== null ? (
        <div className="h-1.5 w-full bg-slate-800">
          <div className="h-1.5 transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      ) : null}
    </div>
  );
}

function PhaseStrip({ phases, currentPhaseIndex }: { phases: PhaseConfig[]; currentPhaseIndex: number }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      <div className="flex min-w-max gap-1.5 sm:gap-2">
        {phases.map((phase, i) => {
          const isDone = i < currentPhaseIndex;
          const isCurrent = i === currentPhaseIndex;
          return (
            <div key={phase.id} className={`flex items-center gap-2 rounded-full border px-3 py-2 transition-all sm:gap-2.5 sm:px-4 sm:py-2.5 ${isCurrent ? "border-slate-900 bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.12)]" : isDone ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-400"}`}>
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${isCurrent ? "bg-white text-slate-900" : isDone ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                {isDone ? <Check className="h-3.5 w-3.5" /> : phase.number}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] sm:text-[11px]">{phase.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TrajectoryFlowClient() {
  const router = useRouter();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>(INITIAL);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = QUESTIONS[questionIndex];
  const currentPhaseIndex = PHASES.findIndex((p) => p.id === currentQuestion.phaseId);
  const progressPct = Math.round(((questionIndex + 1) / QUESTIONS.length) * 100);
  const complete = isQuestionComplete(currentQuestion, answers);
  const isLast = questionIndex === QUESTIONS.length - 1;

  // ── Timer for exercises ──────────────────────────────────────────────────────
  useEffect(() => {
    setTimedOut(false);
    if (!currentQuestion.isExercise || !currentQuestion.timedSeconds) {
      setSecondsLeft(null);
      return;
    }
    const key = currentQuestion.id as "ex_data" | "ex_ambiguity" | "ex_production";
    const existingAnswer = answers[key];
    if (existingAnswer && existingAnswer !== "no_response") {
      setSecondsLeft(null);
      return;
    }
    setSecondsLeft(currentQuestion.timedSeconds);
    const interval = window.setInterval(() => {
      setSecondsLeft((v) => {
        if (v === null) return null;
        if (v <= 1) {
          window.clearInterval(interval);
          setAnswers((prev) => ({ ...prev, [key]: "no_response" }));
          setTimedOut(true);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion.id]);

  // ── Auto-advance after exercise timeout ──────────────────────────────────────
  useEffect(() => {
    if (!timedOut) return;
    const t = window.setTimeout(() => setQuestionIndex((i) => Math.min(i + 1, QUESTIONS.length - 1)), 700);
    return () => window.clearTimeout(t);
  }, [timedOut]);

  // ── Navigation ───────────────────────────────────────────────────────────────
  function goNext() { setQuestionIndex((i) => Math.min(i + 1, QUESTIONS.length - 1)); }
  function goBack() {
    if (submitting) return;
    if (questionIndex === 0) { router.push(PUBLIC_ROUTES.trajectoire); return; }
    setQuestionIndex((i) => Math.max(i - 1, 0));
  }

  // ── Answer setters ────────────────────────────────────────────────────────────
  function setSingle(key: keyof AnswerState, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setError(null);
    if (currentQuestion.isExercise) setSecondsLeft(null);
  }

  function setText(key: keyof AnswerState, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function toggleMulti(key: "ai_tools_used" | "existing_skills" | "target_roles", option: Option, max?: number) {
    setAnswers((prev) => {
      const current = prev[key] as string[];
      const has = current.includes(option.value);
      const allOpts = key === "ai_tools_used" ? AI_TOOLS_OPTIONS : key === "existing_skills" ? SKILL_OPTIONS : TARGET_ROLES_OPTIONS;
      const exSet = new Set(allOpts.filter((o) => o.exclusive).map((o) => o.value));
      let next: string[];
      if (has) { next = current.filter((v) => v !== option.value); }
      else if (option.exclusive) { next = [option.value]; }
      else {
        next = [...current.filter((v) => !exSet.has(v)), option.value];
        if (max && next.length > max) next = next.slice(next.length - max);
      }
      return { ...prev, [key]: next };
    });
    setError(null);
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!complete) return;
    setSubmitting(true); setError(null);
    try {
      const r1 = await fetch(`${INNOVA_API_BASE}/trajectoire/onboarding`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(buildPayload(answers)) });
      if (!r1.ok) { const d = await r1.json().catch(() => ({})); throw new Error((d as { detail?: string })?.detail || "Enregistrement impossible."); }
      const d1: TrajectoryFlowResponse = await r1.json();
      const r2 = await fetch(`${INNOVA_API_BASE}/trajectoire/diagnostic`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ flow_id: d1.flow_id }) });
      if (!r2.ok) { const d = await r2.json().catch(() => ({})); throw new Error((d as { detail?: string })?.detail || "Diagnostic impossible."); }
      const d2: TrajectoryFlowResponse = await r2.json();
      if (typeof window !== "undefined") window.localStorage.setItem(FLOW_STORAGE_KEY, d2.flow_id);
      router.push(`/trajectoire/resultat/${encodeURIComponent(d2.flow_id)}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur inattendue."); setSubmitting(false); }
  }

  // ── Question body (one per screen) ────────────────────────────────────────────
  function renderBody() {
    switch (currentQuestion.id) {
      case "current_status":
        return <div className="grid gap-3 lg:grid-cols-2">{STATUS_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.current_status === o.value} onClick={() => setSingle("current_status", o.value)} />)}</div>;

      case "current_sector":
        return <div className="grid gap-3 lg:grid-cols-2">{SECTOR_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.current_sector === o.value} onClick={() => setSingle("current_sector", o.value)} />)}</div>;

      case "daily_description":
        return (
          <div>
            <textarea value={answers.daily_description} onChange={(e) => setText("daily_description", e.target.value)} rows={6} maxLength={500} placeholder="Exemple : je gère les reportings commerciaux chaque semaine, je consolide des données de vente dans Excel, je prépare des synthèses pour la direction..." className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white placeholder:text-slate-400 sm:rounded-[20px] sm:px-5 sm:py-4" />
            <p className="mt-1.5 text-right text-[11px] text-slate-400">{answers.daily_description.length} / 500</p>
          </div>
        );

      case "main_task":
        return <div className="grid gap-3 lg:grid-cols-2">{MAIN_TASK_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.main_task === o.value} onClick={() => setSingle("main_task", o.value)} />)}</div>;

      case "automate_wish":
        return <div className="grid gap-3 lg:grid-cols-2">{AUTOMATE_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.automate_wish === o.value} onClick={() => setSingle("automate_wish", o.value)} />)}</div>;

      case "ai_maturity":
        return <div className="grid gap-3 lg:grid-cols-2">{AI_MATURITY_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.ai_maturity === o.value} onClick={() => setSingle("ai_maturity", o.value)} />)}</div>;

      case "ai_tools_used":
        return <div className="flex flex-wrap gap-2">{AI_TOOLS_OPTIONS.map((o) => <Chip key={o.value} label={o.label} active={answers.ai_tools_used.includes(o.value)} onClick={() => toggleMulti("ai_tools_used", o)} />)}</div>;

      case "tech_unknown_reaction":
        return <div className="grid gap-3 lg:grid-cols-2">{TECH_REACTION_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.tech_unknown_reaction === o.value} onClick={() => setSingle("tech_unknown_reaction", o.value)} />)}</div>;

      case "existing_skills":
        return <div className="flex flex-wrap gap-2">{SKILL_OPTIONS.map((o) => <Chip key={o.value} label={o.label} active={answers.existing_skills.includes(o.value)} onClick={() => toggleMulti("existing_skills", o)} />)}</div>;

      case "portfolio_status":
        return <div className="grid gap-3 lg:grid-cols-2">{PORTFOLIO_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.portfolio_status === o.value} onClick={() => setSingle("portfolio_status", o.value)} />)}</div>;

      case "ex_data":
        return (
          <div className="space-y-5">
            <ExerciseSituation timedSeconds={currentQuestion.timedSeconds!} secondsLeft={secondsLeft}>
              <p>Une PME constate que ses ventes ont baissé de <strong className="text-white">15 % en 3 mois</strong>. Son responsable vous donne accès à un fichier Excel de 2 000 transactions clients.</p>
              <p className="mt-3 font-semibold text-white">Par où commencez-vous ?</p>
            </ExerciseSituation>
            <div className="grid gap-3 lg:grid-cols-2">{EX_DATA_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.ex_data === o.value} onClick={() => setSingle("ex_data", o.value)} />)}</div>
          </div>
        );

      case "ex_ambiguity":
        return (
          <div className="space-y-5">
            <ExerciseSituation timedSeconds={currentQuestion.timedSeconds!} secondsLeft={secondsLeft}>
              <p>Une directrice commerciale vous dit : <em className="text-slate-300">"Nos ventes baissent, j'ai besoin d'une réponse utile pour demain matin."</em></p>
              <p className="mt-2">Elle repart en réunion. Vous n'avez pas accès à ses données. Pas de brief supplémentaire.</p>
              <p className="mt-3 font-semibold text-white">Quelle est votre première démarche ?</p>
            </ExerciseSituation>
            <div className="grid gap-3 lg:grid-cols-2">{EX_AMBIGUITY_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.ex_ambiguity === o.value} onClick={() => setSingle("ex_ambiguity", o.value)} />)}</div>
          </div>
        );

      case "ex_production":
        return (
          <div className="space-y-5">
            <ExerciseSituation timedSeconds={currentQuestion.timedSeconds!} secondsLeft={secondsLeft}>
              <p>Vous avez <strong className="text-white">45 minutes</strong> pour apporter quelque chose de visible et utile à une équipe qui ne connaît pas l'IA.</p>
              <p className="mt-2">Pas de brief précis. Juste une occasion de montrer de la valeur concrète.</p>
              <p className="mt-3 font-semibold text-white">Qu'est-ce que vous faites en premier ?</p>
            </ExerciseSituation>
            <div className="grid gap-3 lg:grid-cols-2">{EX_PRODUCTION_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.ex_production === o.value} onClick={() => setSingle("ex_production", o.value)} />)}</div>
          </div>
        );

      case "target_roles":
        return <div className="flex flex-wrap gap-2">{TARGET_ROLES_OPTIONS.map((o) => <Chip key={o.value} label={o.label} active={answers.target_roles.includes(o.value)} onClick={() => toggleMulti("target_roles", o, 2)} />)}</div>;

      case "goal_type":
        return <div className="grid gap-3 lg:grid-cols-2">{GOAL_TYPE_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.goal_type === o.value} onClick={() => setSingle("goal_type", o.value)} />)}</div>;

      case "target_timeline":
        return <div className="grid gap-3 lg:grid-cols-2">{TIMELINE_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.target_timeline === o.value} onClick={() => setSingle("target_timeline", o.value)} />)}</div>;

      case "weekly_hours":
        return <div className="grid gap-3 lg:grid-cols-2">{WEEKLY_HOURS_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.weekly_hours === o.value} onClick={() => setSingle("weekly_hours", o.value)} />)}</div>;

      case "support_style":
        return <div className="grid gap-3 lg:grid-cols-2">{SUPPORT_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.support_style === o.value} onClick={() => setSingle("support_style", o.value)} />)}</div>;

      case "work_mode":
        return <div className="grid gap-3 lg:grid-cols-2">{COLLAB_MODE_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.work_mode === o.value} onClick={() => setSingle("work_mode", o.value)} />)}</div>;

      case "budget_range":
        return <div className="grid gap-3 lg:grid-cols-2">{BUDGET_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.budget_range === o.value} onClick={() => setSingle("budget_range", o.value)} />)}</div>;

      case "project_topic":
        return (
          <div>
            <textarea value={answers.project_topic} onChange={(e) => setText("project_topic", e.target.value)} rows={5} maxLength={400} placeholder="Exemple : automatiser la consolidation mensuelle de fichiers Excel pour produire un reporting en moins de 10 minutes au lieu de 3 heures." className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white placeholder:text-slate-400 sm:rounded-[20px] sm:px-5 sm:py-4" />
            <p className="mt-1.5 text-right text-[11px] text-slate-400">{answers.project_topic.length} / 400</p>
          </div>
        );

      case "success_metric":
        return (
          <div>
            <textarea value={answers.success_metric} onChange={(e) => setText("success_metric", e.target.value)} rows={4} maxLength={300} placeholder="Exemple : un dashboard automatique en prod, une mission freelance signée, 3h gagnées par semaine, un premier recruteur qui répond." className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white placeholder:text-slate-400 sm:rounded-[20px] sm:px-5 sm:py-4" />
            <p className="mt-1.5 text-right text-[11px] text-slate-400">{answers.success_metric.length} / 300</p>
          </div>
        );

      case "past_abandon_reason":
        return <div className="grid gap-3 lg:grid-cols-2">{ABANDON_OPTIONS.map((o) => <OptionCard key={o.value} option={o} active={answers.past_abandon_reason === o.value} onClick={() => setSingle("past_abandon_reason", o.value)} />)}</div>;

      default:
        return null;
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <section className="mx-auto w-full max-w-5xl rounded-[28px] border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:rounded-[36px] sm:p-6">
      <PhaseStrip phases={PHASES} currentPhaseIndex={currentPhaseIndex} />
      <div className="mt-4 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="mt-5 rounded-[24px] border border-slate-200 bg-white sm:rounded-[28px]">
        {/* Header */}
        <div className="border-b border-slate-100 px-4 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Question {questionIndex + 1} / {QUESTIONS.length}
              </span>
              {currentQuestion.isExercise ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                  <Zap className="h-3 w-3" />Exercice chronométré
                </span>
              ) : null}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{progressPct}% complété</p>
          </div>
          <h2 className="mt-4 max-w-3xl text-[1.45rem] font-semibold leading-[1.2] tracking-[-0.04em] text-slate-950 sm:mt-5 sm:text-[1.75rem] lg:text-[2.1rem]">
            {currentQuestion.title}
          </h2>
          {currentQuestion.hint ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:leading-7">{currentQuestion.hint}</p>
          ) : null}
        </div>

        {/* Body */}
        <div className="px-4 py-5 sm:px-8 sm:py-7">{renderBody()}</div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
          <button type="button" onClick={goBack} disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:opacity-50 sm:w-auto">
            <ChevronLeft className="h-4 w-4" />Retour
          </button>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
            {error ? <p className="text-sm font-medium text-rose-600 sm:text-right">{error}</p> : null}
            {isLast ? (
              <button type="button" onClick={() => void handleSubmit()} disabled={!complete || submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 sm:w-auto">
                {submitting ? (<><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Analyse en cours…</>) : (<>Lancer mon diagnostic<ChevronRight className="h-4 w-4" /></>)}
              </button>
            ) : (
              <button type="button" onClick={goNext} disabled={!complete} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 sm:w-auto">
                Continuer<ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

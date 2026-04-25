"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CLIENT_INNOVA_API_BASE } from "@/lib/env";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  LayoutDashboard,
  Loader2,
  Settings2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { DOMAIN_BY_ID, MISSION_TYPE_BY_ID, COLLAB_MODE_BY_ID } from "@/lib/taxonomy";

import {
  ENTERPRISE_STORAGE_KEY,
  type EnterpriseCockpitActivationResponse,
  type EnterpriseSubmissionResponse,
} from "../../flow";

type Props = {
  needId: string;
};

// ─── Types matching ───────────────────────────────────────────────────────────

type TalentMatch = {
  flow_id: string;
  user_id: string | null;
  score: number;
  score_pct: number;
  current_sector: string | null;
  main_task: string | null;
  work_mode: string | null;
  target_roles: string[];
  existing_skills: string[];
  ai_maturity: string | null;
  goal_type: string | null;
  recommended_role: string | null;
  profile_label: string | null;
};

type MatchResult = {
  need_id: string;
  primary_goal: string | null;
  matches: TalentMatch[];
  total_evaluated: number;
};

function clarityConfig(level: string): { className: string; label: string } {
  const normalized = level.toLowerCase();
  if (normalized === "strong") {
    return { className: "border-emerald-200 bg-emerald-50 text-emerald-700", label: "Clarte forte" };
  }
  if (normalized === "qualified") {
    return { className: "border-sky-200 bg-sky-50 text-sky-700", label: "Qualifie" };
  }
  return { className: "border-amber-200 bg-amber-50 text-amber-700", label: "A preciser" };
}

function modeLabel(mode: "prive" | "publie" | "accompagne"): string {
  if (mode === "publie") return "Publication possible";
  if (mode === "prive") return "Traitement prive";
  return "Accompagnement recommande";
}

function modeDescription(mode: "prive" | "publie" | "accompagne"): string {
  if (mode === "publie") {
    return "Le besoin peut etre rendu visible dans le pipeline si l'exposition apporte plus de capacite.";
  }
  if (mode === "prive") {
    return "Le besoin reste traite dans un cadre prive et direct avec KORYXA.";
  }
  return "Le besoin demande un accompagnement encadre, avec structuration et supervision fortes.";
}

function executionModeLabel(mode: string): string {
  if (mode === "publie") return "Publication";
  if (mode === "prive") return "Prive";
  return "Accompagne";
}

function opportunityTypeLabel(type: string): string {
  if (type === "accompagnement") return "Accompagnement";
  if (type === "project") return "Projet";
  if (type === "collaboration") return "Collaboration";
  if (type === "stage") return "Stage";
  return "Mission";
}

export default function EnterpriseResultClient({ needId }: Props) {
  const params = useParams<{ need_id?: string | string[] }>();
  const paramNeedId = Array.isArray(params?.need_id) ? params.need_id[0] : params?.need_id;
  const pathNeedId =
    typeof window !== "undefined"
      ? decodeURIComponent(window.location.pathname.split("/").filter(Boolean).at(-1) ?? "")
      : "";
  const normalizedNeedId =
    (typeof paramNeedId === "string" && paramNeedId.trim()) ||
    (typeof needId === "string" && needId.trim()) ||
    pathNeedId ||
    "";

  const [submission, setSubmission] = useState<EnterpriseSubmissionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingCockpit, setOpeningCockpit] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadNeed() {
      if (!normalizedNeedId || normalizedNeedId === "undefined" || normalizedNeedId === "null") {
        if (!active) return;
        setSubmission(null);
        setError("Identifiant de besoin invalide.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${CLIENT_INNOVA_API_BASE}/enterprise/needs/${encodeURIComponent(normalizedNeedId)}`,
          { cache: "no-store", credentials: "include" },
        );
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.detail || "Impossible de charger ce besoin pour le moment.");
        }

        const payload: EnterpriseSubmissionResponse = await response.json();
        if (!active) return;
        setSubmission(payload);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(ENTERPRISE_STORAGE_KEY, payload.need.id);
        }
        // Lance le matching en parallèle une fois le besoin chargé
        void fetchMatches(payload.need.id);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur inattendue.");
      } finally {
        if (active) setLoading(false);
      }
    }

    async function fetchMatches(id: string) {
      if (!active) return;
      setMatchLoading(true);
      try {
        const res = await fetch(
          `${CLIENT_INNOVA_API_BASE}/enterprise/needs/${encodeURIComponent(id)}/matches?limit=5`,
          { cache: "no-store", credentials: "include" },
        );
        if (res.ok) {
          const data: MatchResult = await res.json();
          if (active) setMatchResult(data);
        }
      } catch {
        // silently ignore — matches are supplementary info
      } finally {
        if (active) setMatchLoading(false);
      }
    }

    void loadNeed();
    return () => {
      active = false;
    };
  }, [normalizedNeedId]);

  const nextActions = useMemo(() => {
    if (!submission) return [];
    const items = [submission.need.next_recommended_action, ...(submission.mission.steps || []).slice(0, 3)].filter(Boolean);
    return items.slice(0, 4);
  }, [submission]);

  async function handleOpenCockpit() {
    if (!normalizedNeedId || normalizedNeedId === "undefined" || normalizedNeedId === "null") {
      setError("Identifiant de besoin invalide.");
      return;
    }

    setOpeningCockpit(true);
    setError(null);

    try {
      const response = await fetch(
        `${CLIENT_INNOVA_API_BASE}/enterprise/needs/${encodeURIComponent(normalizedNeedId)}/cockpit`,
        { method: "POST", credentials: "include" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible d'ouvrir le cockpit entreprise.");
      }

      const payload: EnterpriseCockpitActivationResponse = await response.json();
      window.location.assign(payload.redirect_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setOpeningCockpit(false);
    }
  }

  if (loading) {
    return (
      <main className="px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Chargement du resultat...</p>
          <div className="mt-4 grid w-full gap-4 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-[28px] bg-slate-100" />
            <div className="h-40 animate-pulse rounded-[28px] bg-slate-100" />
            <div className="h-40 animate-pulse rounded-[28px] bg-slate-100" />
            <div className="h-40 animate-pulse rounded-[28px] bg-slate-100" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !submission) {
    return (
      <main className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-rose-100 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
          <div className="border-b border-rose-50 bg-rose-50/50 px-8 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">Resultat indisponible</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              Ce besoin ne peut pas etre affiche.
            </h1>
          </div>
          <div className="px-8 py-6">
            <p className="text-sm leading-7 text-slate-600">
              {error || "Le besoin demande est introuvable ou n'a pas encore ete qualifie."}
            </p>
            <div className="mt-6">
              <Link
                href="/entreprise/cadrage"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Relancer la qualification
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const clarity = clarityConfig(submission.need.clarity_level);
  const scorePercent = Math.min(100, Math.max(0, submission.need.qualification_score));

  const metricCards = [
    {
      label: "Score de qualification",
      value: `${submission.need.qualification_score}/100`,
      detail: "Niveau de structuration du besoin",
      accent: "text-sky-600",
      barWidth: `${scorePercent}%`,
      showBar: true,
    },
    {
      label: "Clarte",
      value: clarity.label,
      detail: "Capacite a etre traite rapidement",
      accent: "text-emerald-600",
      showBar: false,
    },
    {
      label: "Mode mission",
      value: executionModeLabel(submission.mission.execution_mode),
      detail: "Mode d'execution recommande",
      accent: "text-violet-600",
      showBar: false,
    },
    {
      label: "Opportunite",
      value: submission.opportunity ? "Creee" : "Non exposee",
      detail: submission.opportunity ? opportunityTypeLabel(submission.opportunity.type) : "Exposition optionnelle",
      accent: submission.opportunity ? "text-emerald-600" : "text-slate-500",
      showBar: false,
    },
  ];

  const needSummaryItems = [
    { key: "Entreprise", value: submission.need.company_name },
    { key: "Objectif principal", value: submission.need.primary_goal },
    { key: "Type de besoin", value: submission.need.need_type },
    { key: "Resultat attendu", value: submission.need.expected_result },
    { key: "Urgence", value: submission.need.urgency },
  ];

  const treatmentRules = [
    "Le besoin doit etre cadre avant toute logique d'affectation ou de recrutement.",
    "Une mission claire permet ensuite d'activer capacite, supervision et livrables.",
    "L'opportunite peut etre exposee si cela augmente la qualite ou la vitesse d'execution.",
  ];

  return (
    <main className="px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-5">
        <section className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.07)] sm:rounded-[36px]">
          <div className="border-b border-slate-50 bg-slate-50/60 px-5 py-5 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Resultat entreprise
              </span>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${clarity.className}`}>
                {clarity.label}
              </span>
            </div>
          </div>

          <div className="grid gap-5 px-5 py-5 sm:px-8 sm:py-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <p className="break-words text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{submission.need.company_name}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl">
                Votre besoin a ete clarifie.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-[1.85] text-slate-600">{submission.need.structured_summary}</p>
            </div>

            <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Mode recommande</p>
              <p className="mt-2.5 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                {modeLabel(submission.need.recommended_treatment_mode)}
              </p>
              <p className="mt-2.5 text-sm leading-[1.75] text-slate-600">
                {modeDescription(submission.need.recommended_treatment_mode)}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((item) => (
            <article key={item.label} className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
              <p className={`mt-2.5 text-xl font-bold tracking-[-0.03em] ${item.accent}`}>{item.value}</p>
              {item.showBar && (
                <div className="my-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: item.barWidth }} />
                </div>
              )}
              <p className="mt-1.5 text-xs text-slate-500">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Resume du besoin</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {needSummaryItems.map((item) => (
                <div key={item.key} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{item.key}</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#060f22_0%,#0b1a35_100%)] p-6 text-white shadow-[0_8px_32px_rgba(2,6,23,0.20)]">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-sky-500/10 blur-[50px]" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Mission proposee</p>
            <p className="mt-3 text-xl font-semibold leading-tight tracking-[-0.03em] text-white">
              {submission.mission.title}
            </p>
            <p className="mt-3 text-sm leading-[1.85] text-slate-300">{submission.mission.summary}</p>
            <div className="mt-4 rounded-xl border border-sky-400/15 bg-sky-500/8 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Livrable</p>
              <p className="mt-1 text-sm font-semibold text-white">{submission.mission.deliverable}</p>
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Prochaines actions</p>
            <div className="mt-4 grid gap-2.5">
              {nextActions.map((action, index) => (
                <div key={`${index}-${action}`} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium leading-6 text-slate-900">{action}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Traitement et exposition</p>
            <div className="mt-4 grid gap-2.5">
              {treatmentRules.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <p className="text-sm leading-[1.7] text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.04fr_0.96fr]">
          <article className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Etapes de mission</p>
            <div className="mt-4 grid gap-2.5">
              {submission.mission.steps.map((step, index) => (
                <div key={`${index}-${step}`} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium leading-6 text-slate-900">{step}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#0a0f20_0%,#0f1b38_100%)] p-6 text-white shadow-[0_8px_32px_rgba(2,6,23,0.20)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Opportunite et capacite</p>
            <div className="mt-4 grid gap-3">
              {submission.opportunity ? (
                <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-4">
                  <p className="text-sm font-semibold text-white">{submission.opportunity.title}</p>
                  <p className="mt-2 text-sm leading-[1.75] text-slate-300">{submission.opportunity.summary}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                    {submission.opportunity.highlights.join(" - ")}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-[1.75] text-slate-400">
                  Ce besoin peut rester traite sans exposition publique selon le mode recommande.
                </div>
              )}
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-[1.75] text-slate-400">
                Des formateurs partenaires et des talents certifies pourront etre actives pour ameliorer l'execution.
              </div>
            </div>
          </article>
        </section>

        {/* ── Profils talents matchés ─────────────────────────────────────── */}
        <section className="overflow-hidden rounded-[36px] border border-slate-100 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.07)]">
          <div className="border-b border-slate-50 bg-slate-50/60 px-6 py-5 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Matching KORYXA</p>
                  <p className="text-sm font-semibold text-slate-900">Profils talents sélectionnés par l'IA</p>
                </div>
              </div>
              {matchResult && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  <Users className="h-3.5 w-3.5" />
                  {matchResult.total_evaluated} profils analysés
                </span>
              )}
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {matchLoading ? (
              <div className="flex items-center gap-3 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                <p className="text-sm text-slate-500">L'IA analyse les profils disponibles…</p>
              </div>
            ) : matchResult && matchResult.matches.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {matchResult.matches.map((talent, idx) => {
                  const domainLabel = talent.current_sector ? (DOMAIN_BY_ID[talent.current_sector]?.label ?? talent.current_sector) : null;
                  const missionLabel = talent.main_task ? (MISSION_TYPE_BY_ID[talent.main_task]?.label ?? talent.main_task) : null;
                  const modeLabel = talent.work_mode ? (COLLAB_MODE_BY_ID[talent.work_mode]?.label ?? talent.work_mode) : null;
                  const roleLabel = talent.recommended_role ?? (talent.target_roles[0] ?? null);
                  return (
                    <article
                      key={talent.flow_id}
                      className="relative flex flex-col gap-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.05)] transition hover:border-violet-200 hover:shadow-[0_8px_28px_rgba(109,40,217,0.08)]"
                    >
                      {/* Score badge */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                          <Zap className="h-3 w-3" />
                          {talent.score_pct}% de compatibilité
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Profil {String(idx + 1).padStart(2, "0")}
                        </span>
                      </div>

                      {/* Role */}
                      {roleLabel && (
                        <p className="text-base font-semibold tracking-[-0.02em] text-slate-900 leading-tight">
                          {roleLabel}
                        </p>
                      )}

                      {/* Taxonomy chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {domainLabel && (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            {domainLabel}
                          </span>
                        )}
                        {missionLabel && (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            {missionLabel}
                          </span>
                        )}
                        {modeLabel && (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            {modeLabel}
                          </span>
                        )}
                      </div>

                      {/* Skills */}
                      {talent.existing_skills.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Compétences</p>
                          <div className="flex flex-wrap gap-1">
                            {talent.existing_skills.slice(0, 4).map((s) => (
                              <span key={s} className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                                {s}
                              </span>
                            ))}
                            {talent.existing_skills.length > 4 && (
                              <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-400">
                                +{talent.existing_skills.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* AI maturity */}
                      {talent.ai_maturity && (
                        <div className="rounded-[12px] border border-violet-100 bg-violet-50/60 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-400">Maturité IA</p>
                          <p className="mt-0.5 text-[12px] leading-5 text-slate-700">{talent.ai_maturity}</p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : !matchLoading ? (
              <div className="flex items-start gap-4 rounded-[20px] border border-slate-100 bg-slate-50 px-5 py-5">
                <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Aucun profil disponible pour le moment</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    KORYXA constitue continuellement sa base de talents qualifiés. Vous serez notifié dès qu'un profil correspondant à ce besoin sera identifié.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.07)] sm:rounded-[36px]">
          <div className="grid gap-5 px-5 py-6 sm:px-10 sm:py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Passage a l'action</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl">
                La suite se joue dans le cockpit KORYXA.
              </h2>
              <p className="mt-3 text-sm leading-[1.85] text-slate-600">
                Vous y retrouverez le besoin structure, les etapes d'execution, les livrables, la supervision et les activations cote opportunites.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void handleOpenCockpit()}
                disabled={openingCockpit}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {openingCockpit ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ouverture...
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="h-4 w-4" />
                    Ouvrir le cockpit entreprise
                  </>
                )}
              </button>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/entreprise/setup"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white sm:flex-1"
                >
                  <Settings2 className="h-4 w-4" />
                  Setup
                </Link>
                <Link
                  href="/entreprise/ventes"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white sm:flex-1"
                >
                  <BriefcaseBusiness className="h-4 w-4" />
                  Ventes
                </Link>
              </div>
            </div>
          </div>

          {error ? (
            <div className="border-t border-rose-50 bg-rose-50/40 px-8 py-4">
              <p className="text-sm font-medium text-rose-600">{error}</p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

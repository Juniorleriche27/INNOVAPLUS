"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

import {
  ENTERPRISE_STORAGE_KEY,
  type EnterpriseCockpitActivationResponse,
  type EnterpriseSubmissionResponse,
} from "../../flow";

type Props = {
  needId: string;
};

function clarityTone(level: string): string {
  const normalized = level.toLowerCase();
  if (normalized === "strong") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "qualified") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function modeLabel(mode: "prive" | "publie" | "accompagne"): string {
  if (mode === "publie") return "Publication possible";
  if (mode === "prive") return "Traitement privé";
  return "Accompagnement recommandé";
}

function modeDescription(mode: "prive" | "publie" | "accompagne"): string {
  if (mode === "publie") return "Le besoin peut être rendu visible dans le pipeline si l’exposition apporte plus de capacité.";
  if (mode === "prive") return "Le besoin reste traité dans un cadre privé et plus direct avec KORYXA.";
  return "Le besoin demande un accompagnement plus encadré, avec structuration et supervision plus fortes.";
}

export default function EnterpriseResultClient({ needId }: Props) {
  const [submission, setSubmission] = useState<EnterpriseSubmissionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingCockpit, setOpeningCockpit] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadNeed() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${INNOVA_API_BASE}/enterprise/needs/${encodeURIComponent(needId)}`, {
          cache: "no-store",
          credentials: "include",
        });
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
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur inattendue.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadNeed();
    return () => {
      active = false;
    };
  }, [needId]);

  const nextActions = useMemo(() => {
    if (!submission) return [];
    const items = [submission.need.next_recommended_action, ...(submission.mission.steps || []).slice(0, 3)].filter(Boolean);
    return items.slice(0, 4);
  }, [submission]);

  async function handleOpenCockpit() {
    setOpeningCockpit(true);
    setError(null);
    try {
      const response = await fetch(`${INNOVA_API_BASE}/enterprise/needs/${encodeURIComponent(needId)}/cockpit`, {
        method: "POST",
        credentials: "include",
      });
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
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto grid max-w-6xl gap-6">
          <div className="h-40 animate-pulse rounded-[32px] bg-white" />
          <div className="h-80 animate-pulse rounded-[32px] bg-white" />
        </div>
      </main>
    );
  }

  if (error || !submission) {
    return (
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-rose-200 bg-white p-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">Résultat indisponible</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Ce besoin ne peut pas être affiché pour le moment.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {error || "Le besoin demandé est introuvable ou n'a pas encore été qualifié."}
          </p>
          <div className="mt-6">
            <Link href="/entreprise/demarrer" className="btn-primary w-full justify-center sm:w-auto">
              Relancer la qualification
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
              Résultat entreprise
            </span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${clarityTone(submission.need.clarity_level)}`}>
              Clarté {submission.need.clarity_level}
            </span>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                Votre besoin a été clarifié.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {submission.need.structured_summary}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Mode recommandé</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{modeLabel(submission.need.recommended_treatment_mode)}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {modeDescription(submission.need.recommended_treatment_mode)}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Qualification", value: `${submission.need.qualification_score}/100`, detail: "Niveau de structuration du besoin" },
            { label: "Clarté", value: submission.need.clarity_level, detail: "Capacité à être traité rapidement" },
            { label: "Mission", value: submission.mission.execution_mode, detail: submission.mission.status },
            {
              label: "Opportunité",
              value: submission.opportunity ? "Créée" : "Pas encore exposée",
              detail: submission.opportunity ? submission.opportunity.type : "Exposition optionnelle selon mode",
            },
          ].map((item) => (
            <article key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{item.value}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Résumé du besoin</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Objectif principal</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{submission.need.primary_goal}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Type de besoin</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{submission.need.need_type}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Résultat attendu</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{submission.need.expected_result}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Urgence</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{submission.need.urgency}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Mission proposée</p>
            <p className="mt-3 text-2xl font-semibold text-white">{submission.mission.title}</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">{submission.mission.summary}</p>
            <p className="mt-4 text-sm font-semibold text-sky-100">Livrable : {submission.mission.deliverable}</p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">3 prochaines actions</p>
            <div className="mt-5 grid gap-3">
              {nextActions.map((action, index) => (
                <div key={action} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Action {index + 1}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{action}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Traitement & exposition</p>
            <div className="mt-5 grid gap-3">
              {[
                "Le besoin doit être cadré avant toute logique d’affectation ou de recrutement.",
                "Une mission claire permet ensuite d’activer capacité, supervision et livrables.",
                "L’opportunité peut être exposée si cela augmente la qualité ou la vitesse d’exécution.",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.04fr_0.96fr]">
          <article className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Étapes de mission</p>
            <div className="mt-5 grid gap-3">
              {submission.mission.steps.map((step, index) => (
                <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Étape {index + 1}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{step}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Opportunité & capacité</p>
            <div className="mt-5 grid gap-3">
              {submission.opportunity ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm font-semibold text-white">{submission.opportunity.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{submission.opportunity.summary}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                    {submission.opportunity.highlights.join(" • ")}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-300">
                  Ce besoin peut rester traité sans exposition publique si le mode recommandé est plus privé ou plus encadré.
                </div>
              )}
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-300">
                Des formateurs partenaires et des talents certifiés pourront ensuite être activés si cela améliore l’exécution.
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Passage à l'action</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                La suite se joue dans le cockpit entreprise KORYXA.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Vous y retrouverez le besoin structuré, les étapes d’exécution, les livrables, la supervision et
                les éventuelles activations côté opportunités ou capacités humaines.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/community" className="btn-secondary">
                Réseau IA
              </Link>
              <Link href="/formateurs" className="btn-secondary">
                Formateurs
              </Link>
              <Link href="/opportunities" className="btn-secondary">
                Opportunités
              </Link>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}

          <div className="mt-6">
            <button
              type="button"
              onClick={() => void handleOpenCockpit()}
              disabled={openingCockpit}
              className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60"
            >
              {openingCockpit ? "Ouverture du cockpit..." : "Ouvrir mon cockpit entreprise"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

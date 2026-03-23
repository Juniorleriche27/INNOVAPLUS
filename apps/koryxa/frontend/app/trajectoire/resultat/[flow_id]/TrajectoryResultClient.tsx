"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

import {
  FLOW_STORAGE_KEY,
  type TrajectoryCockpitActivationResponse,
  type TrajectoryFlowResponse,
} from "../../flow";

type Props = {
  flowId: string;
};

function readinessTone(score: number): string {
  if (score >= 75) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (score >= 60) return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function opportunityTone(status: "recommended" | "unlocked" | "prioritized"): string {
  if (status === "prioritized") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "unlocked") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function profileTone(status: "not_ready" | "eligible" | "verified"): string {
  if (status === "verified") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "eligible") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function validationLabel(level?: string | null): string {
  if (level === "advanced") return "Validation avancée";
  if (level === "validated") return "Validation atteinte";
  if (level === "building") return "Validation en construction";
  return "Validation initiale";
}

export default function TrajectoryResultClient({ flowId }: Props) {
  const [flow, setFlow] = useState<TrajectoryFlowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingCockpit, setOpeningCockpit] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadFlow() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${INNOVA_API_BASE}/trajectoire/flows/${encodeURIComponent(flowId)}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.detail || "Impossible de charger ce résultat pour le moment.");
        }
        const payload: TrajectoryFlowResponse = await response.json();
        if (!active) return;
        setFlow(payload);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(FLOW_STORAGE_KEY, payload.flow_id);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur inattendue.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadFlow();
    return () => {
      active = false;
    };
  }, [flowId]);

  const nextActions = useMemo(() => {
    const actions = flow?.progress_plan?.next_actions?.length ? flow.progress_plan.next_actions : flow?.diagnostic?.next_steps ?? [];
    const normalized = actions.filter(Boolean).slice(0, 4);
    if (normalized.length > 0) return normalized;
    return [
      "Clarifier votre premier livrable utile",
      "Choisir votre mode d'accompagnement",
      "Ouvrir votre cockpit de progression",
      "Préparer vos premières preuves",
    ];
  }, [flow]);

  const recommendations = useMemo(() => {
    if (!flow?.diagnostic) return [];
    const items: Array<{ eyebrow: string; title: string; description: string }> = [];
    const resource = flow.diagnostic.recommended_resources?.[0];
    const partner = flow.diagnostic.recommended_partners?.[0];

    if (resource) {
      items.push({
        eyebrow: resource.type,
        title: resource.label,
        description: resource.reason,
      });
    }
    if (partner) {
      items.push({
        eyebrow: partner.type,
        title: partner.label,
        description: `${partner.reason} • score ${Math.round(partner.match_score * 100)}%`,
      });
    }
    if (items.length > 0) return items.slice(0, 3);
    return [
      {
        eyebrow: "Recommandation",
        title: "Commencer par une ressource guidée",
        description:
          "Le diagnostic servira ensuite à affiner les partenaires, les preuves et les ressources les plus pertinentes.",
      },
    ];
  }, [flow]);

  const unlocks = useMemo(() => {
    const items: Array<{ label: string; detail: string; tone: string }> = [];
    if (flow?.verified_profile) {
      items.push({
        label:
          flow.verified_profile.profile_status === "verified"
            ? "Profil vérifié KORYXA prêt"
            : flow.verified_profile.profile_status === "eligible"
              ? "Profil KORYXA éligible"
              : "Profil KORYXA en construction",
        detail: `Readiness ${flow.verified_profile.readiness_score}/100 • ${validationLabel(flow.verified_profile.validation_level)}`,
        tone: profileTone(flow.verified_profile.profile_status),
      });
    }
    for (const opportunity of flow?.opportunity_targets ?? []) {
      items.push({
        label: opportunity.label,
        detail: opportunity.reason,
        tone: opportunityTone(opportunity.visibility_status),
      });
    }
    if (items.length > 0) return items.slice(0, 4);
    return [
      {
        label: "Première opportunité à construire",
        detail:
          "Le cockpit servira à transformer cette trajectoire en progression, validation et débouchés plus crédibles.",
        tone: "border-slate-200 bg-slate-50 text-slate-700",
      },
    ];
  }, [flow]);

  async function handleOpenCockpit() {
    setOpeningCockpit(true);
    setError(null);
    try {
      const response = await fetch(`${INNOVA_API_BASE}/trajectoire/flows/${encodeURIComponent(flowId)}/cockpit`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible d'ouvrir le cockpit de progression.");
      }
      const payload: TrajectoryCockpitActivationResponse = await response.json();
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

  if (error || !flow?.diagnostic) {
    return (
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-rose-200 bg-white p-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">Résultat indisponible</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Ce résultat ne peut pas être affiché pour le moment.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {error || "Le flow demandé est introuvable ou n'a pas encore produit de diagnostic."}
          </p>
          <div className="mt-6">
            <Link href="/trajectoire/demarrer" className="btn-primary w-full justify-center sm:w-auto">
              Relancer mon diagnostic
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const readiness = flow.diagnostic.readiness;
  const verifiedProfile = flow.verified_profile;

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
              Résultat KORYXA
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${readinessTone(
                readiness.readiness_score,
              )}`}
            >
              Readiness {readiness.readiness_score}/100
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {validationLabel(readiness.validation_level)}
            </span>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                Votre trajectoire recommandée est prête.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {flow.diagnostic.profile_summary}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trajectoire recommandée</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{flow.diagnostic.recommended_trajectory.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{flow.diagnostic.recommended_trajectory.rationale}</p>
              <p className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm leading-6 text-sky-800">
                Focus mission: {flow.diagnostic.recommended_trajectory.mission_focus}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Score initial", value: `${readiness.initial_score}/100`, detail: "Point de départ actuel" },
            { label: "Progression", value: `${flow.progress_plan?.progress_score ?? readiness.progress_score}/100`, detail: "Niveau déjà consolidé" },
            { label: "Readiness final", value: `${readiness.readiness_score}/100`, detail: readiness.label },
            { label: "Validation", value: validationLabel(readiness.validation_level), detail: readiness.validation_status },
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
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Résumé du profil</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Objectif</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{flow.onboarding.objective}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Domaine</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{flow.onboarding.domain_interest}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Niveau perçu</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{flow.onboarding.current_level}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Rythme disponible</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{flow.onboarding.weekly_rhythm}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Ce que cela peut débloquer</p>
            <div className="mt-5 grid gap-3">
              {unlocks.map((item) => (
                <div key={`${item.label}-${item.detail}`} className={`rounded-2xl border px-4 py-4 ${item.tone}`}>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 opacity-90">{item.detail}</p>
                </div>
              ))}
            </div>
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
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Matching & ressources</p>
            <div className="mt-5 grid gap-3">
              {recommendations.map((item) => (
                <div key={`${item.eyebrow}-${item.title}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.eyebrow}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.04fr_0.96fr]">
          <article className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Profil vérifié & preuves</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Statut</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {verifiedProfile
                    ? verifiedProfile.profile_status === "verified"
                      ? "Profil vérifié"
                      : verifiedProfile.profile_status === "eligible"
                        ? "Profil éligible"
                        : "Profil en construction"
                    : "Profil à créer"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Preuves validées</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {verifiedProfile ? `${verifiedProfile.validated_proof_count} / ${verifiedProfile.minimum_validated_proofs}` : "À construire"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Seuil readiness</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {verifiedProfile ? `${verifiedProfile.minimum_readiness_score}/100 minimum` : "À définir"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Headline partageable</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {verifiedProfile?.shareable_headline || "Votre headline se construira avec la progression."}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Boucle d’activation</p>
            <div className="mt-5 grid gap-3">
              {[
                "Diagnostic et orientation validée",
                "Matching avec ressource ou formateur partenaire",
                "Preuves et validations dans le cockpit",
                "Profil vérifié puis activation sur opportunité utile",
              ].map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Étape {index + 1}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Passage à l'action</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                Le détail de la progression vit dans votre cockpit KORYXA.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Vous y retrouverez les tâches d’exécution, les preuves à ajouter, les validations métier, les
                opportunités débloquées et votre profil KORYXA dans un cadre unique.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/myplanning/profile" className="btn-secondary">
                Voir mon profil
              </Link>
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
              {openingCockpit ? "Ouverture du cockpit..." : "Ouvrir mon cockpit de progression"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

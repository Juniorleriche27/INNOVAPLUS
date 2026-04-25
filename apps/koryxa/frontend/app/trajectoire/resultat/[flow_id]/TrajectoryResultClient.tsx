"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";
import { FLOW_STORAGE_KEY, type TrajectoryFlowResponse, type TrainingContactPayload } from "../../flow";

const COUNTRY_CODES = [
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+32", label: "🇧🇪 +32" },
  { code: "+41", label: "🇨🇭 +41" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+212", label: "🇲🇦 +212" },
  { code: "+213", label: "🇩🇿 +213" },
  { code: "+216", label: "🇹🇳 +216" },
  { code: "+221", label: "🇸🇳 +221" },
  { code: "+225", label: "🇨🇮 +225" },
  { code: "+237", label: "🇨🇲 +237" },
  { code: "+242", label: "🇨🇬 +242" },
  { code: "+243", label: "🇨🇩 +243" },
  { code: "+229", label: "🇧🇯 +229" },
];

export default function TrajectoryResultClient({ flowId }: { flowId: string }) {
  const params = useParams<{ flow_id?: string | string[] }>();
  const paramFlowId = Array.isArray(params?.flow_id) ? params.flow_id[0] : params?.flow_id;
  const pathFlowId =
    typeof window !== "undefined"
      ? decodeURIComponent(window.location.pathname.split("/").filter(Boolean).at(-1) ?? "")
      : "";
  const normalizedFlowId =
    (typeof paramFlowId === "string" && paramFlowId.trim()) ||
    (typeof flowId === "string" && flowId.trim()) ||
    pathFlowId ||
    "";

  const [flow, setFlow] = useState<TrajectoryFlowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [contact, setContact] = useState<TrainingContactPayload>({
    first_name: "",
    last_name: "",
    email: "",
    whatsapp_country_code: "+33",
    whatsapp_number: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadFlow() {
      if (!normalizedFlowId || normalizedFlowId === "undefined" || normalizedFlowId === "null") {
        setError("Identifiant de parcours invalide.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${INNOVA_API_BASE}/trajectoire/flows/${encodeURIComponent(normalizedFlowId)}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error((d as { detail?: string })?.detail || "Impossible de charger ce résultat.");
        }
        const payload: TrajectoryFlowResponse = await res.json();
        if (!active) return;
        setFlow(payload);
        if (typeof window !== "undefined") window.localStorage.setItem(FLOW_STORAGE_KEY, payload.flow_id);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur inattendue.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadFlow();
    return () => { active = false; };
  }, [normalizedFlowId]);

  async function handleSubmitContact() {
    if (!normalizedFlowId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(
        `${INNOVA_API_BASE}/trajectoire/flows/${encodeURIComponent(normalizedFlowId)}/submit-contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(contact),
        }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { detail?: string })?.detail || "Envoi impossible.");
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setSubmitting(false);
    }
  }

  const contactValid =
    contact.first_name.trim().length > 0 &&
    contact.last_name.trim().length > 0 &&
    contact.email.includes("@") &&
    contact.whatsapp_number.trim().length >= 6;

  if (loading) {
    return (
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto grid max-w-4xl gap-6">
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

  const { diagnostic, final_recommendation, onboarding } = flow;

  return (
    <main className="px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">

        {/* Hero — trajectoire recommandée */}
        <section className="rounded-[28px] border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:rounded-[34px] sm:p-8">
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
            Résultat Formation IA
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
            Votre parcours de formation est prêt.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{diagnostic.profile_summary}</p>

          <div className="mt-6 rounded-[22px] border border-sky-100 bg-sky-50/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Trajectoire recommandée</p>
            <p className="mt-3 text-xl font-semibold text-slate-950">{diagnostic.recommended_trajectory.title}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">{diagnostic.recommended_trajectory.rationale}</p>
            <p className="mt-3 rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm leading-6 text-sky-800">
              Focus : {diagnostic.recommended_trajectory.mission_focus}
            </p>
          </div>
        </section>

        {/* Reformulation IA */}
        {final_recommendation && (
          <section className="rounded-[28px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)] sm:rounded-[34px] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Reformulation personnalisée</p>
            <p className="mt-5 text-sm leading-8 text-slate-200 whitespace-pre-line">{final_recommendation}</p>
          </section>
        )}

        {/* Prochaines étapes du diagnostic */}
        {diagnostic.next_steps?.length > 0 && (
          <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Prochaines étapes recommandées</p>
            <div className="mt-5 grid gap-3">
              {diagnostic.next_steps.slice(0, 4).map((step, i) => (
                <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Étape {i + 1}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{step}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Formulaire contact */}
        <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:rounded-[34px] sm:p-8">
          {submitted ? (
            <div className="text-center py-6">
              <p className="text-2xl font-semibold text-slate-950">Envoyé ✓</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                L'équipe KORYXA vous contactera sous peu pour discuter de votre parcours.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Recevoir votre parcours et être contacté</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Entrez vos coordonnées pour que l'équipe vous recontacte.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Votre diagnostic et votre parcours vous seront présentés lors d'un échange avec l'équipe KORYXA.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Prénom</label>
                  <input
                    type="text"
                    value={contact.first_name}
                    onChange={(e) => setContact((p) => ({ ...p, first_name: e.target.value }))}
                    placeholder="Jean"
                    className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Nom</label>
                  <input
                    type="text"
                    value={contact.last_name}
                    onChange={(e) => setContact((p) => ({ ...p, last_name: e.target.value }))}
                    placeholder="Dupont"
                    className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Email</label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                    placeholder="jean@exemple.com"
                    className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Indicatif WhatsApp</label>
                  <select
                    value={contact.whatsapp_country_code}
                    onChange={(e) => setContact((p) => ({ ...p, whatsapp_country_code: e.target.value }))}
                    className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Numéro WhatsApp</label>
                  <input
                    type="tel"
                    value={contact.whatsapp_number}
                    onChange={(e) => setContact((p) => ({ ...p, whatsapp_number: e.target.value }))}
                    placeholder="6 12 34 56 78"
                    className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {submitError && (
                <p className="mt-4 text-sm font-medium text-rose-600">{submitError}</p>
              )}

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => void handleSubmitContact()}
                  disabled={!contactValid || submitting}
                  className="btn-primary w-full justify-center sm:w-auto disabled:opacity-50"
                >
                  {submitting ? "Envoi en cours…" : "Envoyer à l'équipe KORYXA"}
                </button>
              </div>
            </>
          )}
        </section>

      </div>
    </main>
  );
}

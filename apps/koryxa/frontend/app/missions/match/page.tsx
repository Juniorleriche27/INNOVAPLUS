"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { missionsApi, MissionDetail, MissionPayload } from "@/lib/api-client/missions";

type Stage = "idle" | "pending" | "matching" | "completed" | "error";

const todayIso = () => new Date().toISOString().split("T")[0];

export default function MissionMatchPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<MissionPayload>({
    title: "",
    description: "",
    deliverables: "",
    deadline: todayIso(),
    duration_days: 1,
    budget: { currency: "EUR" },
    language: "fr",
    work_mode: "remote",
    allow_expansion: false,
    collect_multiple_quotes: true,
    location_hint: "",
  });
  const [rewrite, setRewrite] = useState<string | null>(null);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [mission, setMission] = useState<MissionDetail | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const canSubmit = payload.title.trim().length > 6 && payload.description.trim().length > 12;

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (missionId && stage === "matching") {
      setPolling(true);
      const poll = async () => {
        try {
          const data = await missionsApi.detail(missionId);
          setMission(data);
          if ((data.offers ?? []).some((o) => o.status === "accepted" || o.status === "pending")) {
            setStage("completed");
          } else {
            timer = setTimeout(poll, 4000);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Impossible de récupérer la mission");
          setStage("error");
        }
      };
      poll();
    }
    return () => {
      if (timer) clearTimeout(timer);
      setPolling(false);
    };
  }, [missionId, stage]);

  const offersSorted = useMemo(() => {
    if (!mission?.offers) return [];
    return [...mission.offers].sort((a, b) => (b.scores?.match ?? 0) - (a.scores?.match ?? 0));
  }, [mission]);

  async function handlePreview() {
    setError(null);
    try {
      const res = await missionsApi.preview(payload);
      const summary = (res.summary?.summary as string | undefined) || payload.description;
      setRewrite(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de reformuler");
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setStage("pending");
    try {
      const safeDescription =
        payload.description.length >= 60
          ? payload.description
          : `${payload.description.trim()} Contexte: précisez le volume, l'exigence qualité, le délai et le format de rendu.`;
      const safeDeliverables =
        payload.deliverables && payload.deliverables.length >= 20
          ? payload.deliverables
          : `Livrable principal: ${payload.title || "résultat attendu"} (rapport + fichier).`;
      const created = await missionsApi.create({
        ...payload,
        description: safeDescription,
        deliverables: safeDeliverables,
      });
      setMissionId(created.mission_id);
      await missionsApi.dispatch(created.mission_id, { wave_size: 5, timeout_minutes: 5 });
      setStage("matching");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de lancer le matching");
      setStage("error");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <header className="rounded-3xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-700 px-6 py-6 text-white shadow-lg shadow-sky-400/20">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">Matching express</p>
        <h1 className="mt-2 text-3xl font-semibold">Trouve un profil dès maintenant</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/85">
          Décris ton besoin en une phrase, l’IA reformule, crée la mission et envoie une vague. Tu vois les offres en direct et tu confirmes dès qu’un profil te convient.
        </p>
      </header>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Brief rapide</p>
              <p className="text-sm text-slate-600">Une phrase suffit. On reformule et on envoie.</p>
            </div>
            <button
              onClick={handlePreview}
              disabled={!canSubmit}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              Reformuler (IA)
            </button>
          </div>
          <label className="text-sm text-slate-600">
            Titre / besoin
            <input
              value={payload.title}
              onChange={(e) => setPayload((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ex : Besoin d’un data cleaner pour nettoyer mes données clients"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="text-sm text-slate-600">
            Contexte / détail
            <textarea
              value={payload.description}
              onChange={(e) => setPayload((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Ex : 20k lignes, incohérences d’emails, doublons, vérifications à croiser avec CRM..."
              className="mt-1 h-28 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-600">
              Livrable attendu
              <input
                value={payload.deliverables}
                onChange={(e) => setPayload((prev) => ({ ...prev, deliverables: e.target.value }))}
                placeholder="Ex : fichier nettoyé, rapport de contrôles"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </label>
            <label className="text-sm text-slate-600">
              Deadline
              <input
                type="date"
                value={payload.deadline}
                onChange={(e) => setPayload((prev) => ({ ...prev, deadline: e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </label>
          </div>
          {rewrite && (
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-800">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Reformulation IA</p>
              <p className="mt-1">{rewrite}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || stage === "pending"}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {stage === "pending" ? "Envoi en cours…" : "Lancer le matching"}
            </button>
            <Link href="/missions/manage" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
              Voir mes missions
            </Link>
          </div>
          {stage === "matching" && <p className="text-xs text-slate-500">Matching en cours… (rafraîchissement auto)</p>}
          {stage === "completed" && <p className="text-xs text-emerald-600">Offres reçues. Choisis un profil ci-contre.</p>}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Offres reçues</p>
              <p className="text-sm text-slate-600">Classement par score de matching.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{offersSorted.length} offres</span>
          </div>
          {offersSorted.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
              {stage === "matching" ? "Recherche en cours… Les offres arrivent." : "En attente de lancement."}
            </div>
          )}
          <div className="grid gap-3">
            {offersSorted.map((offer) => (
              <div key={offer.offer_id} className="rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Wave {offer.wave}</p>
                    <p className="text-xs text-slate-500">Score match : {(offer.scores?.match ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{offer.message || "Proposition reçue"}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      offer.status === "accepted"
                        ? "bg-emerald-50 text-emerald-700"
                        : offer.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {offer.status}
                  </span>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={async () => {
                      if (!missionId) return;
                      await missionsApi.confirm(missionId, offer.offer_id);
                      setStage("completed");
                      const data = await missionsApi.detail(missionId);
                      setMission(data);
                    }}
                    className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { missionsApi, MissionDetail } from "@/lib/api-client/missions";
import { useAuth } from "@/components/auth/AuthProvider";

type Props = { params: Promise<{ missionId: string }> | { missionId: string } };
type JournalEvent = { ts: string; payload?: Record<string, unknown> };

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR");
}

export default function MissionTrackPage({ params }: Props) {
  const { user, loading } = useAuth();
  const [missionId, setMissionId] = useState<string>("");
  const [mission, setMission] = useState<MissionDetail | null>(null);
  const [journal, setJournal] = useState<JournalEvent[]>([]);
  const [waveLoading, setWaveLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDue, setMilestoneDue] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void Promise.resolve(params).then((resolved) => setMissionId(resolved.missionId));
  }, [params]);

  const refresh = useCallback(async () => {
    if (!missionId) return;
    try {
      const data = await missionsApi.detail(missionId);
      setMission(data);
      const waves = await missionsApi.journal(missionId);
      setJournal(waves);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger la mission");
    }
  }, [missionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const acceptedOffers = useMemo(
    () => (mission?.offers ?? []).filter((offer) => offer.status === "accepted").length,
    [mission],
  );

  const topMatch = useMemo(() => {
    const offers = [...(mission?.offers ?? [])].sort((a, b) => (b.scores?.match ?? 0) - (a.scores?.match ?? 0));
    return offers[0] ?? null;
  }, [mission]);

  if (!loading && !user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <section className="rounded-[34px] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Suivi mission</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Connectez-vous pour suivre cette mission KORYXA
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Le cockpit de mission relie matching, jalons, messages, preuves d’exécution et export opérationnel.
          </p>
          <div className="mt-6">
            <Link href={`/login?redirect=${encodeURIComponent(`/missions/track/${missionId || ""}`)}`} className="btn-primary">
              Se connecter
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!mission) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-sm text-slate-500">Chargement du cockpit mission…</p>
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </main>
    );
  }

  async function dispatchWave() {
    setWaveLoading(true);
    setError(null);
    try {
      await missionsApi.dispatch(missionId, { wave_size: 3, timeout_minutes: 10 });
      setStatus("Vague envoyée");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer la vague");
    } finally {
      setWaveLoading(false);
    }
  }

  async function sendMessage() {
    if (!message.trim()) return;
    await missionsApi.sendMessage(missionId, message);
    setMessage("");
    await refresh();
  }

  async function createMilestone() {
    if (!milestoneTitle.trim()) return;
    await missionsApi.createMilestone(missionId, { title: milestoneTitle, due_date: milestoneDue || undefined });
    setMilestoneTitle("");
    setMilestoneDue("");
    await refresh();
  }

  async function markMilestone(id: string, nextStatus: "todo" | "in_progress" | "delivered" | "validated") {
    await missionsApi.updateMilestone(missionId, id, { status: nextStatus });
    await refresh();
  }

  async function confirm(offerId: string) {
    await missionsApi.confirm(missionId, offerId);
    await refresh();
  }

  async function exportJson() {
    setExporting(true);
    try {
      const data = await missionsApi.export(missionId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mission-${missionId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="grid gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <section className="mx-auto w-full max-w-7xl overflow-hidden rounded-[36px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(237,247,255,0.98))] p-6 shadow-[0_24px_72px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Cockpit mission KORYXA</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">{mission.title}</h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              {mission.ai?.summary ||
                "La mission sert à relier besoin structuré, matching, messages, jalons et preuves d’exécution dans un cockpit unique."}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={dispatchWave}
                disabled={waveLoading}
                className="btn-primary disabled:opacity-50"
              >
                {waveLoading ? "Envoi de vague…" : "Envoyer une vague"}
              </button>
              <Link href="/opportunities" className="btn-secondary">
                Revenir au pipeline
              </Link>
            </div>
            {status ? <p className="text-sm font-medium text-emerald-600">{status}</p> : null}
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Statut mission", value: mission.status, detail: "État opérationnel actuel" },
              { label: "Offres reçues", value: String((mission.offers ?? []).length), detail: `${acceptedOffers} acceptée(s)` },
              {
                label: "Top match",
                value: topMatch ? `${(topMatch.scores?.match ?? 0).toFixed(2)}` : "—",
                detail: topMatch ? `Wave ${topMatch.wave}` : "Aucun profil encore classé",
              },
              { label: "Journal vagues", value: String(journal.length), detail: "Historique des activations" },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6 rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-wrap gap-2">
            {(mission.ai?.keywords ?? []).map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {tag}
              </span>
            ))}
            {mission.deliverables ? (
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">Livrables cadrés</span>
            ) : null}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Matching & offres</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Classement par score, statut et vague envoyée. Cette surface doit permettre une décision rapide.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {(mission.offers ?? []).length} profil(s)
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(mission.offers ?? [])
                .sort((a, b) => (b.scores?.match ?? 0) - (a.scores?.match ?? 0))
                .map((offer) => (
                  <div
                    key={offer.offer_id}
                    className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Wave {offer.wave}</p>
                        <p className="mt-1 text-xs text-slate-500">Score match : {(offer.scores?.match ?? 0).toFixed(2)}</p>
                        <p className="mt-2 text-xs leading-6 text-slate-600">{offer.message || "Proposition reçue"}</p>
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

                    {offer.status === "accepted" && mission.status !== "confirmed" ? (
                      <button
                        onClick={() => confirm(offer.offer_id)}
                        className="mt-4 w-full rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Confirmer ce prestataire
                      </button>
                    ) : null}
                  </div>
                ))}

              {(mission.offers ?? []).length === 0 ? (
                <div className="col-span-full rounded-[24px] border border-dashed border-slate-300 p-5 text-sm leading-7 text-slate-500">
                  Aucune offre pour l’instant. Déclenche une vague pour lancer le matching.
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Chat de mission</p>
            <div className="mt-3 h-72 overflow-y-auto rounded-[26px] border border-slate-200 bg-slate-50/80 p-4">
              {(mission.messages ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">Aucune conversation pour le moment.</p>
              ) : (
                (mission.messages ?? []).map((msg) => (
                  <div key={msg.id} className="mb-4 rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {msg.role} • {formatDate(msg.created_at)}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-800">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Envoyer une note de coordination"
                className="flex-1 rounded-2xl border border-slate-200 px-3 py-3 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
              <button onClick={sendMessage} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Envoyer
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Journal des vagues</p>
            <div className="mt-4 space-y-3">
              {journal.length === 0 ? (
                <p className="rounded-[24px] border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500">
                  Aucune vague envoyée.
                </p>
              ) : (
                journal.map((event) => (
                  <div key={event.ts} className="rounded-[24px] border border-slate-200 bg-slate-50/70 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Vague envoyée • {typeof event.payload?.count === "number" ? event.payload.count : 0} profil(s)
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(event.ts)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Jalons</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">Suivi du delivery et validation des étapes.</p>
              </div>
              <button onClick={createMilestone} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-sky-200">
                Ajouter
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <input
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                placeholder="Titre du jalon"
                className="rounded-2xl border border-slate-200 px-3 py-3 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
              <input
                value={milestoneDue}
                onChange={(e) => setMilestoneDue(e.target.value)}
                placeholder="Échéance"
                className="rounded-2xl border border-slate-200 px-3 py-3 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="mt-5 space-y-3">
              {(mission.milestones ?? []).map((ms) => (
                <div key={ms.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{ms.title}</p>
                      <p className="text-xs text-slate-500">{ms.due_date || "Échéance libre"}</p>
                    </div>
                    <select
                      value={ms.status}
                      onChange={(e) => markMilestone(ms.id, e.target.value as typeof ms.status)}
                      className="rounded-xl border border-slate-200 px-2 py-1 text-xs"
                    >
                      <option value="todo">À faire</option>
                      <option value="in_progress">En cours</option>
                      <option value="delivered">Livré</option>
                      <option value="validated">Validé</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[34px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Exports & documentation</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Télécharge un export de mission ou le journal des vagues pour documenter le delivery, les décisions et les preuves utiles.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <button
                onClick={exportJson}
                disabled={exporting}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-50 disabled:opacity-50"
              >
                {exporting ? "Préparation…" : "Exporter la mission (JSON)"}
              </button>
              <button
                onClick={async () => {
                  const waves = await missionsApi.journal(missionId);
                  const blob = new Blob([JSON.stringify(waves, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `mission-${missionId}-journal.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="rounded-2xl border border-white/14 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15"
              >
                Télécharger le journal des vagues
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

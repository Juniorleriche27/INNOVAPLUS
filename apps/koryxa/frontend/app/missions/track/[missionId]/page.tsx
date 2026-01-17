"use client";

import { useCallback, useEffect, useState } from "react";
import { missionsApi, MissionDetail } from "@/lib/api-client/missions";
import { useAuth } from "@/components/auth/AuthProvider";

type Props = { params: { missionId: string } };
type JournalEvent = { ts: string; payload?: Record<string, unknown> };

export default function MissionTrackPage({ params }: Props) {
  const { missionId } = params;
  const { user, loading } = useAuth();
  const [mission, setMission] = useState<MissionDetail | null>(null);
  const [journal, setJournal] = useState<JournalEvent[]>([]);
  const [waveLoading, setWaveLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDue, setMilestoneDue] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const refresh = useCallback(async () => {
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

  if (!loading && !user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg text-slate-600">Connecte-toi pour consulter cette mission.</p>
      </main>
    );
  }

  if (!mission) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-sm text-slate-500">Chargement…</p>
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
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

  async function markMilestone(id: string, status: "todo" | "in_progress" | "delivered" | "validated") {
    await missionsApi.updateMilestone(missionId, id, { status });
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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bloc 2 à 5 — Suivi de la mission</p>
        <h1 className="text-3xl font-semibold text-slate-900">{mission.title}</h1>
        <p className="text-sm text-slate-500">Statut : <span className="font-semibold text-slate-900">{mission.status}</span></p>
        {status && <p className="text-sm text-emerald-600">{status}</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Résumé IA</p>
              <p className="mt-1 text-sm text-slate-600">{mission.ai?.summary}</p>
            </div>
            <button
              onClick={dispatchWave}
              disabled={waveLoading}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {waveLoading ? "Envoi…" : "Envoyer Vague"}
            </button>
          </header>

          <div className="flex flex-wrap gap-2">
            {(mission.ai?.keywords ?? []).map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{tag}</span>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Journal</p>
            <div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-100">
              {journal.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">Aucune vague envoyée.</p>
              ) : (
                journal.map((event) => (
                  <div key={event.ts as string} className="flex items-center justify-between px-4 py-3 text-sm text-slate-600">
                    <span>
                      Vague envoyée —{" "}
                      {typeof event.payload?.count === "number" ? event.payload.count : 0} profils
                    </span>
                    <span className="text-xs text-slate-400">{new Date(event.ts).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Matching & offres</p>
                <p className="text-sm text-slate-600">Classement par score, statut et vague envoyée.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {(mission.offers ?? []).length} prestataires
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {(mission.offers ?? [])
                .sort((a, b) => (b.scores?.match ?? 0) - (a.scores?.match ?? 0))
                .map((offer) => (
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
                    {offer.status === "accepted" && mission.status !== "confirmed" && (
                      <button
                        onClick={() => confirm(offer.offer_id)}
                        className="mt-3 w-full rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Confirmer ce prestataire
                      </button>
                    )}
                  </div>
                ))}
              {(mission.offers ?? []).length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  Aucune offre pour l’instant. Envoie une vague pour lancer le matching.
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Chat de mission</p>
            <div className="mt-3 h-64 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4">
              {(mission.messages ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">Aucune conversation pour le moment.</p>
              ) : (
                (mission.messages ?? []).map((msg) => (
                  <div key={msg.id} className="mb-4">
                    <p className="text-xs font-semibold text-slate-500">{msg.role} · {new Date(msg.created_at).toLocaleString()}</p>
                    <p className="text-sm text-slate-800">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Envoyer une note"
                className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button onClick={sendMessage} className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Envoyer</button>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Jalons</p>
                <p className="text-sm text-slate-600">Suivi “À faire / En cours / Livré”.</p>
              </div>
              <button onClick={createMilestone} className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                Ajouter
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <input
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                placeholder="Titre du jalon"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={milestoneDue}
                onChange={(e) => setMilestoneDue(e.target.value)}
                placeholder="Échéance"
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-5 space-y-3">
              {(mission.milestones ?? []).map((ms) => (
                <div key={ms.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between text-sm">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">Exports & preuves</p>
            <p className="mt-2 text-sm text-slate-600">Télécharge un export anonymisé ou récupère le journal des vagues pour la documentation.</p>
            <div className="mt-4 flex flex-col gap-3">
              <button
                onClick={exportJson}
                disabled={exporting}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 disabled:opacity-50"
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
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200"
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

"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AttendanceApiError,
  AttendanceLocation,
  AttendanceOverview,
  AttendanceQr,
  myplanningApiUrl,
  myplanningRequest,
} from "@/app/myplanning/components/attendanceApi";

type Props = {
  workspaceId: string;
};

type Period = 7 | 30 | 90;
type Tab = "locations" | "qr" | "dashboard";

function fmtDateTime(value?: string | null): string {
  if (!value) return "n/a";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "n/a";
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function fmtPercent(value: number): string {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return `${pct.toFixed(1)}%`;
}

function isoDayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TeamAttendanceClient({ workspaceId }: Props) {
  const { user } = useAuth();
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [qr, setQr] = useState<AttendanceQr | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [remainingS, setRemainingS] = useState<number>(0);
  const tickRef = useRef<number | null>(null);

  const [period, setPeriod] = useState<Period>(30);
  const [overview, setOverview] = useState<AttendanceOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");

  const isAuthenticated = !!user?.email;

  const exportUrl = useMemo(() => {
    const from = isoDayOffset(period);
    return myplanningApiUrl(
      `/workspaces/${encodeURIComponent(workspaceId)}/attendance/export.csv?from=${encodeURIComponent(from)}`,
    );
  }, [period, workspaceId]);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await myplanningRequest<AttendanceLocation[]>(
        `/workspaces/${encodeURIComponent(workspaceId)}/attendance/locations`,
      );
      setLocations(Array.isArray(items) ? items : []);
      if (!selectedLocationId && items.length) {
        setSelectedLocationId(items[0].id);
      }
    } catch (err) {
      const message =
        err instanceof AttendanceApiError && err.status === 401
          ? "Session requise. Connecte-toi puis recharge la page."
          : err instanceof Error
            ? err.message
            : "Chargement impossible";
      setError(message);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, selectedLocationId]);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setError("");
    try {
      const from = isoDayOffset(period);
      const payload = await myplanningRequest<AttendanceOverview>(
        `/workspaces/${encodeURIComponent(workspaceId)}/attendance/overview?from=${encodeURIComponent(from)}`,
      );
      setOverview(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stats indisponibles";
      setError(message);
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  }, [workspaceId, period]);

  const loadQr = useCallback(async (locationId: string) => {
    setQrLoading(true);
    setError("");
    try {
      const payload = await myplanningRequest<AttendanceQr>(
        `/attendance/locations/${encodeURIComponent(locationId)}/qr`,
      );
      setQr(payload);
      const validTo = new Date(payload.valid_to);
      const seconds = Math.max(0, Math.floor((validTo.getTime() - Date.now()) / 1000));
      setRemainingS(seconds);
    } catch (err) {
      const message = err instanceof Error ? err.message : "QR indisponible";
      setError(message);
      setQr(null);
      setRemainingS(0);
    } finally {
      setQrLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!selectedLocationId) return;
    void loadQr(selectedLocationId);
  }, [selectedLocationId, loadQr]);

  useEffect(() => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
    }
    tickRef.current = window.setInterval(() => {
      setRemainingS((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedLocationId) return;
    if (remainingS > 5) return;
    // Refresh QR when close to expiry.
    void loadQr(selectedLocationId);
  }, [remainingS, selectedLocationId, loadQr]);

  async function onCreateLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    setError("");
    setInfo("");
    try {
      const created = await myplanningRequest<AttendanceLocation>(
        `/workspaces/${encodeURIComponent(workspaceId)}/attendance/locations`,
        { method: "POST", body: JSON.stringify({ name: trimmed }) },
      );
      setLocations((prev) => [created, ...prev.filter((l) => l.id !== created.id)]);
      setSelectedLocationId(created.id);
      setName("");
      setInfo("Location créée.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Création impossible";
      setError(message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleLocation(location: AttendanceLocation) {
    setError("");
    setInfo("");
    try {
      const updated = await myplanningRequest<AttendanceLocation>(
        `/attendance/locations/${encodeURIComponent(location.id)}`,
        { method: "PATCH", body: JSON.stringify({ is_active: !location.is_active }) },
      );
      setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setInfo("Location mise à jour.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Mise à jour impossible";
      setError(message);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Attendance</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Présence (QR dynamique)</h1>
            <p className="mt-2 text-sm text-slate-700">Workspace: {workspaceId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/myplanning/team/${encodeURIComponent(workspaceId)}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Retour workspace
            </Link>
            <button
              type="button"
              onClick={() => {
                void loadLocations();
                void loadOverview();
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Actualiser
            </button>
          </div>
        </div>
      </section>

      {!isAuthenticated ? (
        <p className="text-sm font-medium text-rose-700">Connecte-toi pour gérer la présence.</p>
      ) : null}
      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      {info ? <p className="text-sm font-medium text-emerald-700">{info}</p> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "dashboard", label: "Dashboard" },
              { id: "locations", label: "Locations" },
              { id: "qr", label: "QR live" },
            ] as { id: Tab; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={
                tab === item.id
                  ? "rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === "locations" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Locations</h2>
          <p className="mt-2 text-sm text-slate-700">
            Un point de scan = un QR affiché sur place (entrée, accueil, etc.).
          </p>

          <form onSubmit={onCreateLocation} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Nom (ex: "Entrée principale")'
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!name.trim() || creating}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Création..." : "Créer"}
            </button>
          </form>

          {loading ? (
            <p className="mt-4 text-sm text-slate-600">Chargement...</p>
          ) : locations.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">Aucune location.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {locations.map((loc) => (
                <article key={loc.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{loc.name}</p>
                      <p className="mt-1 text-xs text-slate-500">ID: {loc.id}</p>
                      <p className="mt-1 text-xs text-slate-500">MAJ: {fmtDateTime(loc.updated_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedLocationId(loc.id)}
                        className={
                          selectedLocationId === loc.id
                            ? "rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                            : "rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        }
                      >
                        {selectedLocationId === loc.id ? "Sélectionné" : "Choisir"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleLocation(loc)}
                        className={
                          loc.is_active
                            ? "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            : "rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        }
                      >
                        {loc.is_active ? "Actif" : "Inactif"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === "qr" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">QR dynamique</h2>
              <p className="mt-2 text-sm text-slate-700">
                Le QR change automatiquement (anti-partage). Affiche-le sur un écran à l’entrée.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Expire dans</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{remainingS}s</p>
            </div>
          </div>

          {!selectedLocationId ? (
            <p className="mt-4 text-sm text-slate-600">Sélectionne une location pour afficher le QR.</p>
          ) : qrLoading ? (
            <p className="mt-4 text-sm text-slate-600">Génération du QR...</p>
          ) : qr ? (
            <div className="mt-6 grid gap-6 md:grid-cols-[360px,1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">{qr.location_name}</div>
                <div className="mt-1 text-xs text-slate-500">Valide jusqu’à: {fmtDateTime(qr.valid_to)}</div>
                <div className="mt-4 flex items-center justify-center rounded-xl bg-slate-50 p-3">
                  <div
                    className="max-w-[320px]"
                    // Backend returns raw svg; safe to inline for a QR.
                    dangerouslySetInnerHTML={{ __html: qr.qr_svg }}
                  />
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => void loadQr(selectedLocationId)}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    Rafraîchir maintenant
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Conseil déploiement</p>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                  <li>Affiche le QR en plein écran sur une tablette (accueil).</li>
                  <li>Demande aux membres de scanner matin et soir.</li>
                  <li>En cas de souci: utiliser la page Scan avec “coller le code”.</li>
                </ul>
                <div className="mt-4">
                  <Link
                    href="/myplanning/app/attendance/scan"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Ouvrir la page Scan
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">QR indisponible.</p>
          )}
        </section>
      ) : null}

      {tab === "dashboard" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Dashboard présence</h2>
              <p className="mt-2 text-sm text-slate-700">Agrégats management présent / absent sur la période.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value, 10) as Period)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                <option value={7}>7 jours</option>
                <option value={30}>30 jours</option>
                <option value={90}>90 jours</option>
              </select>
              <button
                type="button"
                onClick={() => void loadOverview()}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Recalculer
              </button>
              <a
                href={exportUrl}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Export CSV
              </a>
            </div>
          </div>

          {overviewLoading ? (
            <p className="mt-4 text-sm text-slate-600">Calcul en cours...</p>
          ) : overview ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Fenêtre: {overview.window.from} → {overview.window.to}
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Membres</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{overview.members_total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Taux présence</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {fmtPercent(overview.presence_rate ?? overview.present_rate)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Présents</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {overview.present_count ?? overview.n_present}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Partiels</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {overview.partial_count ?? overview.n_partial}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Absents</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {overview.absent_count ?? overview.n_absent}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Avg min/jour</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {Math.round(overview.avg_minutes_present || 0)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
                  Série par jour (present/partial/absent + minutes)
                </div>
                <div className="max-h-[360px] overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Présent</th>
                        <th className="px-4 py-3">Partiel</th>
                        <th className="px-4 py-3">Absent</th>
                        <th className="px-4 py-3">Minutes total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(overview.by_day ?? []).map((p) => (
                        <tr key={p.date} className="border-t border-slate-100">
                          <td className="px-4 py-3 text-slate-900">{p.date}</td>
                          <td className="px-4 py-3 text-emerald-700">{p.present}</td>
                          <td className="px-4 py-3 text-amber-700">{p.partial}</td>
                          <td className="px-4 py-3 text-rose-700">{p.absent}</td>
                          <td className="px-4 py-3 text-slate-900">{p.minutes_present_total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {(overview.top_late || []).length > 0 ? (
                <div className="rounded-2xl border border-slate-200">
                  <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
                    Top check-in tardif (jour courant)
                  </div>
                  <div className="max-h-[240px] overflow-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">First in</th>
                          <th className="px-4 py-3">Last out</th>
                          <th className="px-4 py-3">Minutes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(overview.top_late || []).map((item) => (
                          <tr key={`${item.user_id}-${item.first_in || ""}`} className="border-t border-slate-100">
                            <td className="px-4 py-3 text-slate-900">{item.user_id}</td>
                            <td className="px-4 py-3 text-slate-700">{fmtDateTime(item.first_in)}</td>
                            <td className="px-4 py-3 text-slate-700">{fmtDateTime(item.last_out)}</td>
                            <td className="px-4 py-3 text-slate-900">{item.minutes_present}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">Stats non disponibles.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}

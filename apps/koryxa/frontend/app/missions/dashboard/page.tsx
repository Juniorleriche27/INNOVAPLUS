"use client";

import { useEffect, useState } from "react";
import { missionsApi } from "@/lib/api-client/missions";
import { useAuth } from "@/components/auth/AuthProvider";

type Dashboard = {
  missions?: number;
  time_to_first_offer?: number;
  time_to_accept?: number;
  fill_rate?: number;
  wave_mix?: { v1?: number; v2?: number };
  escalations?: Array<{ mission_id: string; reasons: string[]; target: string; decided_at: string }>;
};

export default function MissionsDashboard() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    missionsApi
      .dashboard({ window_days: 30 })
      .then((res) => setData(res as Dashboard))
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger les KPI"));
  }, [user]);

  if (!loading && !user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg text-slate-600">Accès réservé à l’équipe KORYXA.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bloc 6 — Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Performance & escalades IA</h1>
        <p className="text-sm text-slate-600">Fenêtre 30 jours. Toutes les valeurs sont calculées côté backend.</p>
      </div>
      {error && <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Missions" value={data?.missions ?? 0} suffix="" />
        <Kpi label="Time to first offer" value={data?.time_to_first_offer ?? 0} suffix=" min" />
        <Kpi label="Time to accept" value={data?.time_to_accept ?? 0} suffix=" min" />
        <Kpi label="Fill rate" value={data?.fill_rate ?? 0} suffix=" %" />
        <Kpi label="Vague 1" value={data?.wave_mix?.v1 ?? 0} suffix=" missions" />
        <Kpi label="Vague 2" value={data?.wave_mix?.v2 ?? 0} suffix=" missions" />
      </div>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Escalades vers HF</p>
            <p className="text-sm text-slate-600">Journalise chaque bascule avec la raison.</p>
          </div>
        </header>
        <div className="mt-4 divide-y divide-slate-100">
          {(data?.escalations ?? []).length === 0 ? (
            <p className="py-4 text-sm text-slate-500">Aucune escalade sur la période.</p>
          ) : (
            (data?.escalations ?? []).map((esc) => (
              <div key={esc.mission_id + esc.decided_at} className="py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Mission {esc.mission_id}</p>
                <p className="text-xs text-slate-500">{new Date(esc.decided_at).toLocaleString()} · cible {esc.target}</p>
                <p className="mt-1 text-xs text-slate-600">Raisons : {esc.reasons.join(", ")}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function Kpi({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">
        {value}
        <span className="text-base font-medium text-slate-500">{suffix}</span>
      </p>
    </div>
  );
}

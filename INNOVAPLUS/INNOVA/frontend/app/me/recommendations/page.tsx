import { apiMe, apiMetrics } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MeRecommendations() {
  const userId = "demo-user"; // TODO: auth
  const recos = await apiMe.recommendations(userId).catch(() => []);
  // fire-and-forget analytics
  apiMetrics.event("view_me_reco", undefined, userId).catch(() => {});

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Vos recommandations</h1>
      {recos.length === 0 ? (
        <p className="text-sm text-slate-600">Aucune recommandation. Terminez l’onboarding pour des résultats personnalisés.</p>
      ) : (
        <ul className="space-y-3">
          {recos.map((r) => (
            <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                <span className="text-xs text-sky-700">Score {r.score}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{r.reasons.join(" · ")}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}


import { apiMe, apiMetrics } from "@/lib/api";
import { AUTH_API_BASE } from "@/lib/env";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MeRecommendations() {
  const jar = await cookies();
  const session = jar.get("innova_session")?.value;
  if (!session) redirect("/login?redirect=/me/recommendations");

  const meRes = await fetch(`${AUTH_API_BASE}/auth/me`, {
    cache: "no-store",
    headers: { cookie: jar.toString() },
    credentials: "include",
  });
  if (!meRes.ok) redirect("/login?redirect=/me/recommendations");

  const me = (await meRes.json().catch(() => ({}))) as { id?: string };
  const userId = me?.id || "unknown";
  const recos = await apiMe.recommendations(userId).catch(() => []);
  apiMetrics.event("view_me_reco", undefined, userId).catch(() => {});

  return (
    <main className="mx-auto max-w-4xl p-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Recommandations</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Vos prochaines pistes utiles</h1>
        {recos.length === 0 ? (
          <p className="mt-4 text-sm leading-7 text-slate-600">Aucune recommandation pour le moment. Terminez l'onboarding pour obtenir un cadrage plus personnalise.</p>
        ) : (
          <ul className="mt-5 grid gap-3">
            {recos.map((recommendation) => (
              <li key={recommendation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{recommendation.title}</p>
                  <span className="text-xs font-semibold text-sky-700">Score {recommendation.score}</span>
                </div>
                <p className="mt-2 text-xs leading-6 text-slate-500">{recommendation.reasons.join(" · ")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

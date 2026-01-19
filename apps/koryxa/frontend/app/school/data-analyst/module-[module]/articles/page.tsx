import { getModuleMeta } from "@/app/school/components/moduleMeta";
import ArticleRow from "@/app/school/components/ArticleRow";
import { DATA_ANALYST_ARTICLES, DATA_ANALYST_THEMES } from "@/data/data-analyst/resources";

export default function DataAnalystModuleArticles({ params }: { params: { module: string } }) {
  const moduleNumber = Number.parseInt(params.module, 10);
  const meta = getModuleMeta("data-analyst", Number.isFinite(moduleNumber) ? moduleNumber : 1);
  const themes = Array.from({ length: meta.themesCount }, (_, i) => `Thème ${i + 1}`);
  const moduleId = `module-${Number.isFinite(moduleNumber) ? moduleNumber : 1}`;
  const items = DATA_ANALYST_ARTICLES.filter((a) => a.moduleId === moduleId && a.status === "active").sort((a, b) => a.order - b.order);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">{meta.title}</h1>
      <p className="mt-2 text-sm text-slate-600">À lire pour maîtriser ce module.</p>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-slate-900">Thèmes :</div>
          <div className="flex flex-wrap gap-2">
            <button disabled className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
              Tous
            </button>
            {themes.map((t) => (
              <button key={t} disabled className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">Langue :</div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
              {["Tous", "FR", "EN"].map((l) => (
                <button key={l} disabled className="rounded-lg px-3 py-1 text-sm text-slate-700">
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">Trier par :</div>
            <select
              disabled
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              defaultValue="Recommandé"
            >
              {["Recommandé", "Plus récent", "Lecture ↑", "Lecture ↓"].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {items.slice(0, 12).map((a) => {
          const theme = DATA_ANALYST_THEMES.find((t) => t.id === a.themeId);
          const reading = `${Math.max(1, a.readingMinutes ?? 6)} min`;
          return (
            <ArticleRow
              key={a.id}
              title={a.title}
              source={a.sourceName ?? "Source"}
              language={a.language}
              readingTimeLabel={reading}
              themeLabel={theme?.title ?? "Thème"}
              descriptionShort={a.descriptionShort}
              href={a.url}
            />
          );
        })}
        {items.length === 0 ? <div className="text-sm text-slate-600">Aucun article pour le moment pour ce module.</div> : null}
      </div>
    </section>
  );
}

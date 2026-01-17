import Link from "next/link";

const notebookFile = "/notebooks/data-analyst/module-2/theme-4_api_requests_pagination_ratelimit.ipynb";
const envTemplate = "/notebooks/data-analyst/module-2/theme-4.env_template";

export default function Module2Theme4Notebook() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Module 2 — Thème 4</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Notebook + env template</h1>
      <p className="mt-2 text-sm text-slate-600">
        Télécharge le notebook et le fichier d’environnement. Le lab utilise le Mock API KORYXA (auth via `X-API-Key`,
        pagination via `next`, rate limit simulé en 429+`Retry-After`).
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50" href={notebookFile} download>
          <p className="text-sm font-semibold text-slate-900">Notebook (.ipynb)</p>
          <p className="mt-1 text-xs text-slate-600">theme-4_api_requests_pagination_ratelimit.ipynb</p>
        </a>
        <a className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50" href={envTemplate} download>
          <p className="text-sm font-semibold text-slate-900">Env template</p>
          <p className="mt-1 text-xs text-slate-600">theme-4.env_template</p>
        </a>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          href="/school/data-analyst/module-2/theme-4/page/1"
        >
          Lire le cours
        </Link>
        <Link
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          href="/school/data-analyst/module-2/theme-4/submit"
        >
          Soumettre les preuves
        </Link>
        <Link
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          href="/school/data-analyst/module-2/theme-4/quiz"
        >
          Aller au quiz
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Exports obligatoires à générer :
        <ul className="mt-2 list-disc pl-5">
          <li>`m2t4_transactions_raw.csv`</li>
          <li>`m2t4_transactions_clean.csv`</li>
          <li>`m2t4_request_log.csv`</li>
          <li>`m2t4_run_report.json`</li>
          <li>`m2t4_api_contract.md`</li>
        </ul>
      </div>
    </section>
  );
}


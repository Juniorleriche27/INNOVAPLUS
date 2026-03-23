"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CreateProjectPayload = {
  name: string;
  slug: string;
  title?: string | null;
  description?: string | null;
  repo_url?: string | null;
  live_url?: string | null;
  logo_url?: string | null;
  status?: string | null;
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
const labelClass = "text-sm font-semibold text-slate-700";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const form = new FormData(e.currentTarget);
      const payload: CreateProjectPayload = {
        name: String(form.get("name") ?? "").trim(),
        slug: String(form.get("slug") ?? "").trim(),
        title: (String(form.get("title") ?? "").trim() || null) as string | null,
        description: (String(form.get("description") ?? "").trim() || null) as string | null,
        repo_url: (String(form.get("repo_url") ?? "").trim() || null) as string | null,
        live_url: (String(form.get("live_url") ?? "").trim() || null) as string | null,
        logo_url: (String(form.get("logo_url") ?? "").trim() || null) as string | null,
        status: (String(form.get("status") ?? "").trim() || null) as string | null,
      };

      if (!payload.name || !payload.slug) {
        setError("Veuillez fournir au minimum un nom interne et un identifiant.");
        setLoading(false);
        return;
      }

      const base = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_CHATLAYA_URL || "").replace(/\/+$/, "");
      const url = base ? `${base}/projects/` : `/api/projects/`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Échec API (${res.status}): ${text}`);
      }

      await res.json();
      router.push("/projects");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(237,247,255,0.98))] p-6 shadow-[0_24px_72px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Capacité / offre KORYXA</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Déposer une capacité structurée dans l’écosystème KORYXA.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Cette surface sert à rendre visible une offre, une capacité d’exécution, un actif ou une ressource
              que KORYXA pourra ensuite relier à une opportunité, une mission ou une activation plus large.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              "Le dépôt doit rester structuré, lisible et réutilisable dans le pipeline.",
              "Une offre utile n’est pas juste un lien: elle décrit clairement capacité, valeur et contexte d’usage.",
              "KORYXA peut ensuite la faire circuler côté entreprise, mission ou opportunité.",
            ].map((item) => (
              <div key={item} className="rounded-[24px] border border-slate-200/80 bg-white/90 px-4 py-4 text-sm leading-7 text-slate-700 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <div className="mx-auto w-full max-w-6xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="mx-auto grid w-full max-w-6xl gap-6 rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] md:grid-cols-[1.14fr_0.86fr] sm:p-8"
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={labelClass}>
                Nom interne *
              </label>
              <input id="name" name="name" type="text" required className={inputClass} placeholder="Ex: Capacité data pilotage" />
            </div>
            <div>
              <label htmlFor="slug" className={labelClass}>
                Identifiant *
              </label>
              <input id="slug" name="slug" type="text" required className={inputClass} placeholder="Ex: capacite-data-pilotage" />
            </div>
          </div>

          <div>
            <label htmlFor="title" className={labelClass}>
              Titre public
            </label>
            <input id="title" name="title" type="text" className={inputClass} placeholder="Ex: Dashboarding et lecture décisionnelle" />
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Description structurée
            </label>
            <textarea
              id="description"
              name="description"
              rows={7}
              className={`${inputClass} resize-none`}
              placeholder="Décrivez la valeur de cette capacité, les cas d’usage, le contexte idéal, les résultats attendus et ce que KORYXA doit pouvoir activer autour."
            />
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 text-sm leading-7 text-slate-600">
            Une bonne capacité déposée doit pouvoir être comprise par trois publics à la fois: l’équipe KORYXA,
            l’entreprise qui cherche une réponse utile et le réseau de talents / partenaires qui peut venir renforcer l’exécution.
          </div>
        </div>

        <div className="space-y-6 rounded-[30px] border border-slate-200/70 bg-slate-50/70 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Références & état</h2>

          <div>
            <label htmlFor="repo_url" className={labelClass}>
              Référence interne / repo
            </label>
            <input id="repo_url" name="repo_url" type="url" className={inputClass} placeholder="https://github.com/..." />
          </div>

          <div>
            <label htmlFor="live_url" className={labelClass}>
              Démo / ressource live
            </label>
            <input id="live_url" name="live_url" type="url" className={inputClass} placeholder="https://..." />
          </div>

          <div>
            <label htmlFor="logo_url" className={labelClass}>
              Visuel / logo
            </label>
            <input id="logo_url" name="logo_url" type="url" className={inputClass} placeholder="https://..." />
          </div>

          <div>
            <label htmlFor="status" className={labelClass}>
              État
            </label>
            <select id="status" name="status" className={inputClass} defaultValue="draft">
              <option value="draft">Brouillon</option>
              <option value="published">Publuable</option>
              <option value="archived">Archivé</option>
            </select>
          </div>

          <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 text-sm leading-7 text-slate-600 shadow-sm">
            Après dépôt, cette capacité pourra être utilisée dans le pipeline d’opportunités ou reliée à une mission.
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-slate-900/30 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Création…" : "Enregistrer la capacité"}
            </button>
            <Link href="/projects" className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
              Retour au pipeline
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}

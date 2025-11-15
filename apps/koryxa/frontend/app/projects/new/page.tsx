// src/app/projects/new/page.tsx
"use client";

import { useState } from "react";
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
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition";
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
        description: (String(form.get("description") ?? "").trim() ||
          null) as string | null,
        repo_url: (String(form.get("repo_url") ?? "").trim() ||
          null) as string | null,
        live_url: (String(form.get("live_url") ?? "").trim() ||
          null) as string | null,
        logo_url: (String(form.get("logo_url") ?? "").trim() ||
          null) as string | null,
        status: (String(form.get("status") ?? "").trim() ||
          null) as string | null,
      };

      if (!payload.name || !payload.slug) {
        setError("Veuillez fournir au minimum 'name' et 'slug'.");
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

      // Redirection après création : vers la liste ou un détail si dispo
      router.push("/projects");
      // Optionnel : refresh de la route
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Portefeuille</p>
          <h1 className="mt-3 text-3xl font-bold">Déposer une opportunité côté prestataire</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-200">
            Renseignez les informations clés de votre offre (produit, disponibilité, liens). L’équipe KORYXA
            peut ensuite la publier dans le pipeline des besoins et en assurer le suivi auprès des
            demandeurs.
          </p>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="grid gap-6 rounded-[32px] border border-slate-200/60 bg-white p-6 shadow-sm md:grid-cols-[2fr,1fr]"
        >
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className={labelClass}>
                Nom *
              </label>
              <input id="name" name="name" type="text" required className={inputClass} placeholder="ex: Innova Frontend" />
            </div>
            <div>
              <label htmlFor="slug" className={labelClass}>
                Slug *
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                className={inputClass}
                placeholder="ex: innova-frontend"
              />
            </div>
            <div>
              <label htmlFor="title" className={labelClass}>
                Titre (optionnel)
              </label>
              <input id="title" name="title" type="text" className={inputClass} placeholder="Tagline ou pitch court" />
            </div>
            <div>
              <label htmlFor="description" className={labelClass}>
                Description (optionnel)
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                className={`${inputClass} resize-none`}
                placeholder="Décrivez la proposition de valeur, l'impact local, les ressources demandées..."
              />
            </div>
          </div>

          <div className="space-y-6 rounded-3xl border border-slate-200/70 bg-slate-50/70 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Détails techniques</h2>
            <div>
              <label htmlFor="repo_url" className={labelClass}>
                Repo URL
              </label>
              <input id="repo_url" name="repo_url" type="url" className={inputClass} placeholder="https://github.com/..." />
            </div>
            <div>
              <label htmlFor="live_url" className={labelClass}>
                Live URL
              </label>
              <input id="live_url" name="live_url" type="url" className={inputClass} placeholder="https://..." />
            </div>
            <div>
              <label htmlFor="logo_url" className={labelClass}>
                Logo URL
              </label>
              <input id="logo_url" name="logo_url" type="url" className={inputClass} placeholder="https://..." />
            </div>
            <div>
              <label htmlFor="status" className={labelClass}>
                Statut
              </label>
              <select id="status" name="status" className={inputClass} defaultValue="draft">
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-slate-900/30 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Création..." : "Créer le projet"}
            </button>
            <p className="text-xs text-slate-500">
              En soumettant, vous confirmez que les informations partagées sont prêtes à être présentées aux
              demandeurs et partenaires KORYXA.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}

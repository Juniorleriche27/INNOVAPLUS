"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [redirectTo, setRedirectTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const resp = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirect_to: redirectTo || undefined }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(typeof data?.detail === "string" ? data.detail : "Impossible d envoyer le mail de reinitialisation");
      }
      setMessage("Un lien de reinitialisation vient d etre envoye si l adresse est connue.");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/70 bg-white px-6 py-8 shadow-sm shadow-slate-900/5 sm:px-8">
        <h1 className="text-2xl font-semibold text-slate-900">Mot de passe oublie</h1>
        <p className="mt-2 text-sm text-slate-600">
          Entrez votre adresse email pour recevoir un lien de reinitialisation. Le lien expirera apres un court delai.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label htmlFor="redirect" className="block text-sm font-medium text-slate-700">
              URL de redirection (optionnel)
            </label>
            <input
              id="redirect"
              type="url"
              value={redirectTo}
              onChange={(event) => setRedirectTo(event.target.value)}
              placeholder="https://innova.co/accueil"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
            <p className="mt-1 text-xs text-slate-500">
              Laisse vide pour utiliser l URL par defaut configuree cote serveur.
            </p>
          </div>

          {message && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Retour a la {" "}
          <Link href="/login" className="font-semibold text-sky-700 hover:underline">
            page de connexion
          </Link>
        </p>
      </section>
    </main>
  );
}

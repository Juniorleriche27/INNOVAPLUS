"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { AUTH_API_BASE } from "@/lib/env";

export default function SignupClient() {
  const { refresh } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const [firstRaw, ...rest] = fullName.trim().split(/\s+/).filter(Boolean);
      const first_name = firstRaw || email.split("@")[0];
      const last_name = (rest.join(" ") || first_name).slice(0, 120);
      const resp = await fetch(`${AUTH_API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, first_name, last_name }),
      });

      type ApiError = { detail?: unknown };
      const data: ApiError = await resp.json().catch(() => ({} as ApiError));
      if (!resp.ok) {
        const s = resp.status;
        const msg = typeof data.detail === "string" ? data.detail : undefined;
        if (s === 409 || (msg && /already used|exists|existe/i.test(msg))) {
          throw new Error("Cet e-mail est déjà utilisé.");
        }
        if (s === 400 || s === 422) {
          throw new Error(msg || "Données invalides (email ou mot de passe)");
        }
        if (s === 401 || s === 403) {
          throw new Error("Vous êtes déjà connecté·e.");
        }
        if (s === 429) {
          throw new Error("Trop de tentatives, réessayez dans 1 minute.");
        }
        throw new Error(msg || "Problème serveur, réessayez.");
      }

      setMessage("Compte créé. Bienvenue !");
      await refresh();
      setTimeout(() => router.replace("/onboarding"), 300);
      setEmail("");
      setPassword("");
      setFullName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/70 bg-white px-6 py-8 shadow-sm shadow-slate-900/5 sm:px-8">
        <h1 className="text-2xl font-semibold text-slate-900">Créer un compte</h1>
        <p className="mt-2 text-sm text-slate-600">
          Rejoins INNOVA+ pour accéder aux projets, à la communauté et au copilote CHATLAYA.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
              Nom complet (optionnel)
            </label>
            <input
              id="full_name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

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
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
            <p className="mt-1 text-xs text-slate-500">8 caractères minimum recommandés.</p>
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
            {loading ? "Création en cours..." : "S'inscrire"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-sky-700 hover:underline">
            Se connecter
          </Link>
        </p>
      </section>
    </main>
  );
}

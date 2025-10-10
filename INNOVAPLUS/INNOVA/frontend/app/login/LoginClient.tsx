"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(typeof (data as any)?.detail === "string" ? (data as any).detail : "Email ou mot de passe invalide");
      }

      router.replace(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/70 bg-white px-6 py-8 shadow-sm shadow-slate-900/5 sm:px-8">
        <h1 className="text-2xl font-semibold text-slate-900">Connexion</h1>
        <p className="mt-2 text-sm text-slate-600">Connecte-toi pour retrouver ton workspace et tes projets.</p>

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
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

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
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-sm text-slate-500">
          <p>
            Pas encore de compte ? {" "}
            <Link href="/signup" className="font-semibold text-sky-700 hover:underline">
              Creer un compte
            </Link>
          </p>
          <p>
            Mot de passe oublie ? {" "}
            <Link href="/account/recover" className="font-semibold text-sky-700 hover:underline">
              Reinitialiser ici
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}


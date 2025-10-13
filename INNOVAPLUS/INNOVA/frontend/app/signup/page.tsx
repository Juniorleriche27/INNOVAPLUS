"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
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
      const resp = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Backend expects: name, email, password, role (user|coach)
        body: JSON.stringify({
          name: fullName || email.split("@")[0],
          email,
          password,
          role: "user",
        }),
      });

      const data = await resp.json().catch(() => ({} as any));
      if (!resp.ok) {
        const s = resp.status;
        const msg = typeof (data as any)?.detail === "string" ? (data as any).detail : undefined;
        if (s === 409 || (msg && /already used|exists|existe/i.test(msg))) {
          throw new Error("Cet e-mail est déjà utilisé.");
        }
        if (s === 400 || s === 422) {
          throw new Error(msg || "Données invalides (email ou mot de passe)");
        }
        if (s === 429) {
          throw new Error("Trop de tentatives, réessayez dans 1 minute.");
        }
        throw new Error(msg || "Problème serveur, réessayez.");
      }

      setMessage("Compte créé. Bienvenue !");
      // Redirection vers l'onboarding
      setTimeout(() => router.replace("/onboarding"), 400);
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
        <h1 className="text-2xl font-semibold text-slate-900">Creer un compte</h1>
        <p className="mt-2 text-sm text-slate-600">
          Rejoins INNOVA+ pour acceder aux projets, a la communaute et au copilote CHATLAYA.
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
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
            <p className="mt-1 text-xs text-slate-500">6 caracteres minimum recommande.</p>
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
            {loading ? "Creation en cours..." : "S inscrire"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Deja un compte ? {" "}
          <Link href="/login" className="font-semibold text-sky-700 hover:underline">
            Se connecter
          </Link>
        </p>
      </section>
    </main>
  );
}

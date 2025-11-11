"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_API_BASE } from "@/lib/env";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const presetEmail = searchParams?.get("email") || "";
  const token = searchParams?.get("token") || "";

  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tokenMissing = useMemo(() => token.trim().length === 0, [token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const resp = await fetch(`${AUTH_API_BASE}/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, token, new_password: password }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = typeof data?.detail === "string" ? data.detail : undefined;
        throw new Error(msg || "Le lien est invalide ou expire.");
      }
      setMessage("Mot de passe mis a jour. Vous pouvez maintenant vous connecter.");
      setTimeout(() => router.replace("/login"), 600);
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/70 bg-white px-6 py-8 shadow-sm shadow-slate-900/5 sm:px-8">
        <h1 className="text-2xl font-semibold text-slate-900">Reinitialiser le mot de passe</h1>
        {tokenMissing ? (
          <p className="mt-4 text-sm text-red-600">
            Ce lien est invalide ou incomplet. Verifiez votre email ou demandez un nouveau lien de reinitialisation.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Choisissez un nouveau mot de passe. Par securite, toutes les sessions actives seront deconnectees.
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
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Nouveau mot de passe
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
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
                  Confirmez le mot de passe
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
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
                {loading ? "Reinitialisation..." : "Mettre a jour"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-sm text-slate-500">
          Besoin d'aide ?{" "}
          <Link href="/account/recover" className="font-semibold text-sky-700 hover:underline">
            Demandez un nouveau lien
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-sm text-slate-500">Chargement...</div>}>
      <ResetForm />
    </Suspense>
  );
}

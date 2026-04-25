"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { CLIENT_INNOVA_API_BASE } from "@/lib/env";

type SignupClientProps = {
  successRedirect?: string;
  heading?: string;
  subtitle?: string;
  loginHref?: string;
  loginLabel?: string;
};

export default function SignupClient({
  successRedirect = "/onboarding",
  heading = "Creer un compte",
  subtitle = "Rejoignez KORYXA pour acceder aux produits et aux espaces connectes.",
  loginHref = "/login",
  loginLabel = "Se connecter",
}: SignupClientProps = {}) {
  const { refresh, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [accountType, setAccountType] = useState<"learner" | "company" | "organization">("learner");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(successRedirect);
    }
  }, [authLoading, router, successRedirect, user]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`${CLIENT_INNOVA_API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          country: country.trim(),
          account_type: accountType,
        }),
      });

      const data = await response.json().catch(() => ({} as { detail?: unknown }));
      if (!response.ok) {
        const status = response.status;
        const detail = typeof data.detail === "string" ? data.detail : undefined;
        if (status === 409 || (detail && /already used|exists|existe/i.test(detail))) {
          throw new Error("Cet email est deja utilise.");
        }
        if (status === 400 || status === 422) {
          throw new Error(detail || "Donnees invalides.");
        }
        if (status === 401 || status === 403) {
          throw new Error("Vous etes deja connecte.");
        }
        if (status === 429) {
          throw new Error("Trop de tentatives. Reessayez dans une minute.");
        }
        throw new Error(detail || "Probleme serveur, reessayez.");
      }

      setMessage("Compte cree. Bienvenue dans KORYXA.");
      await refresh();
      setTimeout(() => router.replace(successRedirect), 300);
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setCountry("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/70 bg-white px-6 py-8 shadow-sm shadow-slate-900/5 sm:px-8">
        <h1 className="text-2xl font-semibold text-slate-900">{heading}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">{subtitle}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-slate-700">
                Prenom
              </label>
              <input
                id="first_name"
                type="text"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-slate-700">
                Nom
              </label>
              <input
                id="last_name"
                type="text"
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
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
            <label htmlFor="country" className="block text-sm font-medium text-slate-700">
              Pays
            </label>
            <input
              id="country"
              type="text"
              required
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label htmlFor="account_type" className="block text-sm font-medium text-slate-700">
              Type de compte
            </label>
            <select
              id="account_type"
              value={accountType}
              onChange={(event) => setAccountType(event.target.value as "learner" | "company" | "organization")}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
            >
              <option value="learner">Apprenant</option>
              <option value="company">Entreprise</option>
              <option value="organization">Organisation</option>
            </select>
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
            <p className="mt-1 text-xs text-slate-500">8 caracteres minimum recommandes.</p>
          </div>

          {message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Creation en cours..." : "S'inscrire"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Deja un compte ?{" "}
          <Link href={loginHref} className="font-semibold text-sky-700 hover:underline">
            {loginLabel}
          </Link>
        </p>
      </section>
    </main>
  );
}

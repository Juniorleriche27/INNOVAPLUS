"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { INNOVA_API_BASE, SITE_BASE_URL } from "@/lib/env";

type Step = "request" | "verify";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/";
  const { refresh, user, initialLoggedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<Step>("request");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const isPreviewDomain =
    typeof window !== "undefined" && window.location.hostname.endsWith("vercel.app");

  useEffect(() => {
    if (!isPreviewDomain) return;
    const target = `${SITE_BASE_URL}/login?redirect=${encodeURIComponent(redirect)}`;
    window.location.href = target;
  }, [isPreviewDomain, redirect]);

  // If already logged in, redirect client-side (avoids server-side fetch failure).
  useEffect(() => {
    if (user || initialLoggedIn) {
      router.replace(redirect);
    }
  }, [user, initialLoggedIn, redirect, router]);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionLoading(true);
    setError(null);
    setInfo(null);
    setDebugCode(null);
    try {
      const resp = await fetch(`${INNOVA_API_BASE}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intent: "login" }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg =
          typeof data?.detail === "string"
            ? data.detail
            : typeof data?.detail?.detail === "string"
              ? data.detail.detail
              : "Impossible d'envoyer le code.";
        throw new Error(msg);
      }
      setStep("verify");
      setInfo("Code envoyé ! Consulte ta boîte mail (ou le canal configuré).");
      if (data?.debug_code) setDebugCode(data.debug_code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setActionLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${INNOVA_API_BASE}/auth/login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          code: otp,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg =
          typeof data?.detail === "string"
            ? data.detail
            : typeof data?.detail?.detail === "string"
              ? data.detail.detail
              : "Code invalide.";
        throw new Error(msg);
      }
      void refresh();
      if (isPreviewDomain) {
        window.location.href = `${SITE_BASE_URL}${redirect}`;
        return;
      }
      router.replace(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/70 bg-white px-6 py-8 shadow-sm shadow-slate-900/5 sm:px-8">
        <h1 className="text-2xl font-semibold text-slate-900">Connexion sécurisée</h1>
        <p className="mt-2 text-sm text-slate-600">Rentre ton email, reçois un code OTP et connecte-toi sans mot de passe.</p>
        {isPreviewDomain && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Vous êtes sur un domaine de prévisualisation. Après connexion, vous serez redirigé vers {SITE_BASE_URL} pour
            que la session fonctionne correctement.
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={requestOtp} className="mt-6 space-y-4">
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

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-60"
              disabled={actionLoading}
            >
              {actionLoading ? "Envoi..." : "Recevoir un code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Adresse email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              />
            </div>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-700">
                Code OTP
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {info && <p className="text-sm text-slate-500">{info}</p>}
            {debugCode && (
              <p className="text-sm font-mono text-slate-500">
                Code dev : <span className="font-semibold text-slate-900">{debugCode}</span>
              </p>
            )}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-60"
              disabled={actionLoading}
            >
              {actionLoading ? "Connexion..." : "Valider le code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setOtp("");
                setInfo(null);
              }}
              className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Renvoyer un code
            </button>
          </form>
        )}

        <div className="mt-6 space-y-2 text-sm text-slate-500">
          <p>
            Envoyer un message à l&apos;équipe ?{" "}
            <Link href="/account/recover" className="font-semibold text-sky-700 hover:underline">
              Support KORYXA
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

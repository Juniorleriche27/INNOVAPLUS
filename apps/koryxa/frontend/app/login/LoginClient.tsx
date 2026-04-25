"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CLIENT_INNOVA_API_BASE, DEV_AUTO_LOGIN_ENABLED, SITE_BASE_URL } from "@/lib/env";

type Step = "request" | "verify";

type LoginClientProps = {
  defaultRedirect?: string;
  requestedRedirect?: string;
  heading?: string;
  subtitle?: string;
  supportHref?: string;
  supportLabel?: string;
  signupHref?: string;
  signupLabel?: string;
};

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Erreur ${response.status}`;
  const text = await response.text().catch(() => "");
  if (!text) return fallback;

  try {
    const data = JSON.parse(text);
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.detail?.detail === "string") return data.detail.detail;
  } catch {
    // Keep plain-text or HTML responses readable enough for debugging.
  }

  const compact = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return compact ? `${fallback}: ${compact.slice(0, 180)}` : fallback;
}

export default function LoginClient({
  defaultRedirect = "/",
  requestedRedirect,
  heading = "Connexion securisee",
  subtitle = "Entrez votre email, recevez un code OTP et connectez-vous sans mot de passe.",
  supportHref = "/account/recover",
  supportLabel = "Support KORYXA",
  signupHref = "/signup",
  signupLabel = "Creer un compte",
}: LoginClientProps = {}) {
  const router = useRouter();
  const redirect =
    requestedRedirect && requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : defaultRedirect;
  const { refresh, user } = useAuth();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<Step>("request");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [clientState, setClientState] = useState({
    ready: false,
    isPreviewDomain: false,
    isLocalHost: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hostname = window.location.hostname;
    setClientState({
      ready: true,
      isPreviewDomain: hostname.endsWith("vercel.app"),
      isLocalHost: hostname === "127.0.0.1" || hostname === "localhost",
    });
  }, []);

  const { ready, isPreviewDomain, isLocalHost } = clientState;

  useEffect(() => {
    if (!isPreviewDomain) return;
    window.location.href = `${SITE_BASE_URL}/login?redirect=${encodeURIComponent(redirect)}`;
  }, [isPreviewDomain, redirect]);

  useEffect(() => {
    if (user?.email) {
      router.replace(redirect);
    }
  }, [redirect, router, user]);

  async function handleLocalLogin() {
    setActionLoading(true);
    setError(null);
    setInfo("Connexion locale en cours...");

    try {
      const response = await fetch(`${CLIENT_INNOVA_API_BASE}/auth/dev-login`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data?.detail === "string" ? data.detail : "Connexion locale indisponible.");
      }

      await refresh();
      router.replace(redirect);
    } catch (err) {
      setInfo(null);
      setError(err instanceof Error ? err.message : "Connexion locale impossible.");
      setActionLoading(false);
    }
  }

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionLoading(true);
    setError(null);
    setInfo(null);
    setDebugCode(null);

    try {
      const response = await fetch(`${CLIENT_INNOVA_API_BASE}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intent: "login" }),
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
      const data = await response.json().catch(() => ({}));

      setStep("verify");
      setInfo("Code envoye. Consultez votre boite mail ou le canal configure.");
      if (data?.debug_code) {
        setDebugCode(data.debug_code);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setActionLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CLIENT_INNOVA_API_BASE}/auth/login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          typeof data?.detail === "string"
            ? data.detail
            : typeof data?.detail?.detail === "string"
              ? data.detail.detail
              : "Code invalide.";
        throw new Error(message);
      }

      await refresh();
      if (isPreviewDomain) {
        window.location.href = `${SITE_BASE_URL}${redirect}`;
        return;
      }
      router.replace(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200/70 bg-white px-6 py-8 shadow-sm shadow-slate-900/5 sm:px-8">
        <h1 className="text-2xl font-semibold text-slate-900">{heading}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">{subtitle}</p>

        {ready && DEV_AUTO_LOGIN_ENABLED && isLocalHost ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Mode local actif : utilisez la connexion locale rapide pour tester l'acces sans OTP.
          </div>
        ) : null}

        {ready && isPreviewDomain ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Vous etes sur un domaine de previsualisation. Apres connexion, vous serez redirige vers {SITE_BASE_URL} pour
            que la session fonctionne correctement.
          </div>
        ) : null}

        {step === "request" ? (
          <form onSubmit={requestOtp} className="mt-6 space-y-4">
            {ready && DEV_AUTO_LOGIN_ENABLED && isLocalHost ? (
              <button
                type="button"
                onClick={() => void handleLocalLogin()}
                className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
                disabled={actionLoading}
              >
                {actionLoading ? "Connexion..." : "Connexion locale rapide"}
              </button>
            ) : null}

            {ready && DEV_AUTO_LOGIN_ENABLED && isLocalHost ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Ou utilisez le flux OTP ci-dessous si vous voulez tester la vraie connexion.
              </div>
            ) : null}

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

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

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
                pattern="\\d*"
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {info ? <p className="text-sm text-slate-500">{info}</p> : null}
            {debugCode ? (
              <p className="text-sm font-mono text-slate-500">
                Code dev : <span className="font-semibold text-slate-900">{debugCode}</span>
              </p>
            ) : null}
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

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
            Envoyer un message a l'equipe ?{" "}
            <Link href={supportHref} className="font-semibold text-sky-700 hover:underline">
              {supportLabel}
            </Link>
          </p>
          <p>
            Pas encore de compte ?{" "}
            <Link href={signupHref} className="font-semibold text-sky-700 hover:underline">
              {signupLabel}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

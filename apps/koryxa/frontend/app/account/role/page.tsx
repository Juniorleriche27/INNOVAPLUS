"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AUTH_API_BASE } from "@/lib/env";

const ROLE_CARDS = [
  {
    id: "demandeur",
    title: "Demandeur",
    description: "Je publie des besoins (missions, appels à projets) et je veux contacter les bons talents rapidement.",
    cta: "Configurer mon profil Demandeur",
  },
  {
    id: "prestataire",
    title: "Prestataire",
    description: "Je propose des compétences (tech, terrain, design, conseil...) et je souhaite recevoir des offres qualifiées.",
    cta: "Configurer mon profil Prestataire",
  },
] as const;

export default function RoleSelectionPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [saving, setSaving] = useState<null | typeof ROLE_CARDS[number]["id"]>(null);
  const [error, setError] = useState<string | null>(null);

  if (!loading && !user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-lg text-slate-600">Merci de te connecter pour choisir ton rôle.</p>
        <Link href="/login" className="mt-4 inline-flex rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm">
          Aller à la connexion
        </Link>
      </main>
    );
  }

  async function handleSelect(role: typeof ROLE_CARDS[number]["id"]) {
    setSaving(role);
    setError(null);
    try {
      const resp = await fetch(`${AUTH_API_BASE}/auth/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible d'enregistrer le rôle.");
      }
      await refresh();
      router.push(role === "demandeur" ? "/account/demandeur" : "/account/prestataire");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setSaving(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm shadow-slate-900/5 sm:px-8">
        <h1 className="text-3xl font-semibold text-slate-900">Choisis ton rôle</h1>
        <p className="mt-3 text-sm text-slate-600">
          Tu peux basculer à tout moment entre Demandeur et Prestataire. Cela ajuste les écrans et les informations demandées.
        </p>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {ROLE_CARDS.map((role) => {
            const active = user?.workspace_role === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleSelect(role.id)}
                disabled={Boolean(saving)}
                className="h-full rounded-2xl border border-slate-200 px-5 py-6 text-left transition hover:border-sky-200 hover:shadow-lg disabled:opacity-75"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">{role.title}</h2>
                  {active && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Actif</span>}
                </div>
                <p className="mt-3 text-sm text-slate-600">{role.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
                  {saving === role.id ? "Sauvegarde..." : role.cta}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

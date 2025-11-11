"use client";

import { FormEvent, useEffect, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";
import { useAuth } from "@/components/auth/AuthProvider";

type FormState = {
  display_name: string;
  bio: string;
  skills: string;
  languages: string;
  availability: string;
  availability_timezone: string;
  rate_min: string;
  rate_max: string;
  currency: string;
  zones: string;
  remote: boolean;
  contact_email: string;
  contact_phone: string;
  channels: string;
};

const EMPTY: FormState = {
  display_name: "",
  bio: "",
  skills: "",
  languages: "",
  availability: "",
  availability_timezone: "",
  rate_min: "",
  rate_max: "",
  currency: "EUR",
  zones: "",
  remote: true,
  contact_email: "",
  contact_phone: "",
  channels: "",
};

function toList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function PrestataireProfilePage() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetch(`${INNOVA_API_BASE}/profiles/me`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.prestataire) {
          setReady(true);
          return;
        }
        const p = data.prestataire;
        setForm({
          display_name: p.display_name ?? "",
          bio: p.bio ?? "",
          skills: (p.skills || []).join(", "),
          languages: (p.languages || []).join(", "),
          availability: p.availability ?? "",
          availability_timezone: p.availability_timezone ?? "",
          rate_min: p.rate_min?.toString() ?? "",
          rate_max: p.rate_max?.toString() ?? "",
          currency: p.currency ?? "EUR",
          zones: (p.zones || []).join(", "),
          remote: Boolean(p.remote),
          contact_email: p.contact_email ?? "",
          contact_phone: p.contact_phone ?? "",
          channels: (p.channels || []).join(", "),
        });
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => {
      active = false;
    };
  }, [user]);

  if (!loading && !user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-lg text-slate-600">Connecte-toi pour compléter ton profil Prestataire.</p>
      </main>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const payload = {
        display_name: form.display_name,
        bio: form.bio,
        skills: toList(form.skills),
        languages: toList(form.languages),
        availability: form.availability || null,
        availability_timezone: form.availability_timezone || null,
        rate_min: form.rate_min ? Number(form.rate_min) : null,
        rate_max: form.rate_max ? Number(form.rate_max) : null,
        currency: form.currency || null,
        zones: toList(form.zones),
        remote: form.remote,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        channels: toList(form.channels),
      };
      const resp = await fetch(`${INNOVA_API_BASE}/profiles/prestataire`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible d'enregistrer le profil.");
      }
      setStatus("Profil Prestataire enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setSaving(false);
    }
  }

  async function handleSuggest() {
    if (!form.bio || form.bio.length < 30) {
      setError("Merci de décrire ta bio (30 caractères minimum) pour générer des tags.");
      return;
    }
    setSuggesting(true);
    setError(null);
    try {
      const resp = await fetch(`${INNOVA_API_BASE}/profiles/suggest-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bio: form.bio, max_tags: 8 }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.detail || "Impossible de suggérer des tags.");
      if (Array.isArray(data?.suggestions)) {
        setForm((prev) => ({ ...prev, skills: data.suggestions.join(", ") }));
        setStatus("Suggestions ajoutées !");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm shadow-slate-900/5 sm:px-8">
        <h1 className="text-3xl font-semibold text-slate-900">Profil Prestataire</h1>
        <p className="mt-3 text-sm text-slate-600">
          Présente tes compétences, disponibilités et zones d&apos;intervention pour recevoir des offres pertinentes.
        </p>

        {!ready ? (
          <p className="mt-6 text-sm text-slate-500">Chargement du profil...</p>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Nom / marque *</label>
                <input
                  required
                  value={form.display_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Disponible à distance</label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    id="remote"
                    type="checkbox"
                    checked={form.remote}
                    onChange={(e) => setForm((prev) => ({ ...prev, remote: e.target.checked }))}
                    className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="remote" className="text-sm text-slate-700">
                    Oui, je peux travailler en remote
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Bio / présentation *</label>
              <textarea
                required
                rows={6}
                value={form.bio}
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
              <button
                type="button"
                onClick={handleSuggest}
                className="mt-3 inline-flex items-center rounded-full border border-sky-200 px-4 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-60"
                disabled={suggesting}
              >
                {suggesting ? "Analyse en cours..." : "Suggérer des tags"}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Compétences (tags)</label>
                <input
                  value={form.skills}
                  onChange={(e) => setForm((prev) => ({ ...prev, skills: e.target.value }))}
                  placeholder="data, formation, facilitation..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Langues</label>
                <input
                  value={form.languages}
                  onChange={(e) => setForm((prev) => ({ ...prev, languages: e.target.value }))}
                  placeholder="français, anglais..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Disponibilité (créneaux, délais)</label>
                <input
                  value={form.availability}
                  onChange={(e) => setForm((prev) => ({ ...prev, availability: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Fuseau horaire</label>
                <input
                  value={form.availability_timezone}
                  onChange={(e) => setForm((prev) => ({ ...prev, availability_timezone: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Tarif min.</label>
                <input
                  type="number"
                  min={0}
                  value={form.rate_min}
                  onChange={(e) => setForm((prev) => ({ ...prev, rate_min: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Tarif max.</label>
                <input
                  type="number"
                  min={0}
                  value={form.rate_max}
                  onChange={(e) => setForm((prev) => ({ ...prev, rate_max: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Devise</label>
                <input
                  value={form.currency}
                  onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Zones desservies (pays, régions)</label>
                <input
                  value={form.zones}
                  onChange={(e) => setForm((prev) => ({ ...prev, zones: e.target.value }))}
                  placeholder="Sénégal, remote, Afrique de l'Ouest..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Canaux (email, WhatsApp...)</label>
                <input
                  value={form.channels}
                  onChange={(e) => setForm((prev) => ({ ...prev, channels: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Téléphone / WhatsApp</label>
                <input
                  value={form.contact_phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {status && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {status}
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";
import { useAuth } from "@/components/auth/AuthProvider";

type FormState = {
  display_name: string;
  organization: string;
  contact_email: string;
  contact_phone: string;
  languages: string;
  country: string;
  city: string;
  remote_ok: boolean;
  preferred_channels: string;
  notes: string;
  timezone: string;
};

const EMPTY_FORM: FormState = {
  display_name: "",
  organization: "",
  contact_email: "",
  contact_phone: "",
  languages: "",
  country: "",
  city: "",
  remote_ok: false,
  preferred_channels: "",
  notes: "",
  timezone: "",
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function DemandeurProfilePage() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetch(`${INNOVA_API_BASE}/profiles/me`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.demandeur) {
          setReady(true);
          return;
        }
        const d = data.demandeur;
        setForm({
          display_name: d.display_name ?? "",
          organization: d.organization ?? "",
          contact_email: d.contact_email ?? "",
          contact_phone: d.contact_phone ?? "",
          languages: (d.languages || []).join(", "),
          country: d.country ?? "",
          city: d.city ?? "",
          remote_ok: Boolean(d.remote_ok),
          preferred_channels: (d.preferred_channels || []).join(", "),
          notes: d.notes ?? "",
          timezone: d.timezone ?? "",
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
        <p className="text-lg text-slate-600">Connecte-toi pour compléter ton profil Demandeur.</p>
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
        organization: form.organization || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        languages: splitList(form.languages),
        country: form.country || null,
        city: form.city || null,
        remote_ok: form.remote_ok,
        preferred_channels: splitList(form.preferred_channels),
        notes: form.notes || null,
        timezone: form.timezone || null,
      };
      const resp = await fetch(`${INNOVA_API_BASE}/profiles/demandeur`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible d'enregistrer le profil.");
      }
      setStatus("Profil Demandeur enregistré avec succès.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm shadow-slate-900/5 sm:px-8">
        <h1 className="text-3xl font-semibold text-slate-900">Profil Demandeur</h1>
        <p className="mt-3 text-sm text-slate-600">
          Ces informations seront partagées avec les prestataires sélectionnés pour contextualiser tes besoins.
        </p>

        {!ready ? (
          <p className="mt-6 text-sm text-slate-500">Chargement du profil...</p>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Nom d&apos;affichage *</label>
                <input
                  required
                  value={form.display_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Organisation</label>
                <input
                  value={form.organization}
                  onChange={(e) => setForm((prev) => ({ ...prev, organization: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Email de contact</label>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Pays</label>
                <input
                  value={form.country}
                  onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Ville ou zone</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="remote-ok"
                type="checkbox"
                checked={form.remote_ok}
                onChange={(e) => setForm((prev) => ({ ...prev, remote_ok: e.target.checked }))}
                className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <label htmlFor="remote-ok" className="text-sm text-slate-700">
                Accepter des prestataires à distance
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Langues préférées (séparées par des virgules)</label>
                <input
                  value={form.languages}
                  onChange={(e) => setForm((prev) => ({ ...prev, languages: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Canaux de contact (email, WhatsApp...)</label>
                <input
                  value={form.preferred_channels}
                  onChange={(e) => setForm((prev) => ({ ...prev, preferred_channels: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Fuseau horaire</label>
              <input
                value={form.timezone}
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                placeholder="GMT, WAT, CET..."
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Préférences de contact / notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
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

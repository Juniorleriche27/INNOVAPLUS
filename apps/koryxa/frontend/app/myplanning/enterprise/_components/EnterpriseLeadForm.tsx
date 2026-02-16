"use client";

import { FormEvent, useState } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");
const ENTERPRISE_LEADS_ENDPOINT = `${API_BASE}/innova/api/enterprise/leads`;

type LeadFormState = {
  name: string;
  email: string;
  company: string;
  role: string;
  team_size: string;
  need: string;
  message: string;
  website: string; // honeypot
};

const INITIAL_FORM: LeadFormState = {
  name: "",
  email: "",
  company: "",
  role: "",
  team_size: "",
  need: "",
  message: "",
  website: "",
};

type Props = {
  sourcePage?: string;
};

export function EnterpriseLeadForm({ sourcePage = "/myplanning/enterprise" }: Props) {
  const [form, setForm] = useState<LeadFormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(ENTERPRISE_LEADS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source_page: sourcePage,
          source_ts: new Date().toISOString(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.detail || `HTTP ${response.status}`);
      }
      const leadId = payload?.lead_id;
      setSuccess(leadId ? `Demande envoyée (réf ${leadId}).` : "Demande envoyée.");
      setForm(INITIAL_FORM);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Envoi impossible";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-800">Nom complet</span>
          <input
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-800">Email pro</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-800">Entreprise</span>
          <input
            required
            value={form.company}
            onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-800">Rôle</span>
          <input
            required
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-800">Taille équipe</span>
          <select
            required
            value={form.team_size}
            onChange={(event) => setForm((prev) => ({ ...prev, team_size: event.target.value }))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
          >
            <option value="">Sélectionner</option>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201-1000">201-1000</option>
            <option value="1000+">1000+</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-800">Besoin principal</span>
          <select
            required
            value={form.need}
            onChange={(event) => setForm((prev) => ({ ...prev, need: event.target.value }))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
          >
            <option value="">Sélectionner</option>
            <option value="pilotage_portefeuille">Pilotage portefeuille</option>
            <option value="reporting_ia">Reporting IA</option>
            <option value="gouvernance_conformite">Gouvernance & conformité</option>
            <option value="automatisation_process">Automatisation des processus</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-800">Contexte / objectif</span>
        <textarea
          required
          value={form.message}
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
          rows={5}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
        />
      </label>

      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          value={form.website}
          onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
          autoComplete="off"
          tabIndex={-1}
        />
      </div>

      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Envoi..." : "Demander une démo"}
      </button>
    </form>
  );
}

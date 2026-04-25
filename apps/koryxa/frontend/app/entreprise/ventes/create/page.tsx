"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BriefcaseBusiness, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
import { INNOVA_API_BASE } from "@/lib/env";

const STAGES = ["Qualification", "Proposition", "Negociation", "Gagne", "Perdu"] as const;
const PRIORITIES = [
  { value: "high", label: "Haute", description: "Affaire stratégique, à traiter en priorité" },
  { value: "medium", label: "Moyenne", description: "Affaire important, suivi régulier" },
  { value: "low", label: "Basse", description: "Affaire secondaire, suivi ponctuel" },
] as const;
const CURRENCIES = ["EUR", "USD", "XOF", "MAD", "GBP"] as const;

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-400";
const labelClass = "block text-sm font-semibold text-slate-700";
const sectionClass = "rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)]";

export default function NouveauAffairePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const rawValue = String(form.get("value") ?? "").trim();
    const rawProbability = String(form.get("probability") ?? "").trim();

    const payload = {
      title: String(form.get("title") ?? "").trim(),
      problem: String(form.get("problem") ?? "").trim(),
      company: String(form.get("company") ?? "").trim() || undefined,
      contact: String(form.get("contact") ?? "").trim() || undefined,
      value: rawValue ? parseFloat(rawValue) : undefined,
      currency: String(form.get("currency") ?? "EUR"),
      stage: String(form.get("stage") ?? "Qualification"),
      probability: rawProbability ? parseInt(rawProbability, 10) : undefined,
      close_date: String(form.get("close_date") ?? "").trim() || undefined,
      priority: String(form.get("priority") ?? "medium"),
      status: "open",
      source: "manual",
    };

    if (!payload.title || !payload.problem) {
      setError("Le nom du affaire et la description du besoin sont obligatoires.");
      setLoading(false);
      return;
    }

    setError("Cette fonctionnalite n'est plus disponible.");
    setLoading(false);
  }

  if (success) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-950">Affaire créé avec succès</h1>
          <p className="mt-2 text-sm text-slate-500">Vous allez être redirigé vers le pipeline...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-1 py-2 sm:px-2">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/entreprise" className="transition-colors hover:text-slate-900">Entreprise</Link>
        <ChevronLeft className="h-3.5 w-3.5 rotate-180 flex-shrink-0 text-slate-300" />
        <Link href="/entreprise/ventes" className="transition-colors hover:text-slate-900">Ventes</Link>
        <ChevronLeft className="h-3.5 w-3.5 rotate-180 flex-shrink-0 text-slate-300" />
        <span className="font-medium text-slate-900">Nouveau affaire</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4 rounded-[24px] border border-slate-100 bg-white px-6 py-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-emerald-50 to-cyan-50">
          <BriefcaseBusiness className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">Nouveau affaire</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Ajoutez un affaire à votre pipeline commercial. Il sera visible immédiatement dans le tableau de bord Ventes.
          </p>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-5 py-3.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">

        {/* Section 1 — Identification du affaire */}
        <div className={sectionClass}>
          <h2 className="mb-5 text-base font-semibold tracking-[-0.03em] text-slate-900">Identification du affaire</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className={labelClass}>
                Nom du affaire <span className="text-rose-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                className={inputClass}
                placeholder="Ex: Refonte du reporting commercial — Entreprise X"
              />
              <p className="mt-1.5 text-xs text-slate-400">Soyez précis. Ce nom apparaîtra dans le pipeline.</p>
            </div>

            <div>
              <label htmlFor="problem" className={labelClass}>
                Description du besoin <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="problem"
                name="problem"
                rows={4}
                required
                className={`${inputClass} resize-none`}
                placeholder="Quel problème ce affaire résout-il ? Quel est le contexte ? Quel résultat est attendu ?"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Que proposez-vous à ce client ? Quel est le résultat attendu ?
              </p>
            </div>
          </div>
        </div>

        {/* Section 2 — Entreprise et contact */}
        <div className={sectionClass}>
          <h2 className="mb-5 text-base font-semibold tracking-[-0.03em] text-slate-900">Entreprise et contact</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="company" className={labelClass}>Entreprise</label>
              <input
                id="company"
                name="company"
                type="text"
                className={inputClass}
                placeholder="Ex: NeedIndex Labs"
              />
            </div>
            <div>
              <label htmlFor="contact" className={labelClass}>Contact principal</label>
              <input
                id="contact"
                name="contact"
                type="text"
                className={inputClass}
                placeholder="Ex: Sophie Martin"
              />
            </div>
          </div>
        </div>

        {/* Section 3 — Valeur et timing */}
        <div className={sectionClass}>
          <h2 className="mb-5 text-base font-semibold tracking-[-0.03em] text-slate-900">Valeur et timing</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="value" className={labelClass}>Valeur estimée</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="value"
                  name="value"
                  type="number"
                  min="0"
                  step="1000"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  placeholder="Ex: 85000"
                />
                <select
                  name="currency"
                  className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400"
                  defaultValue="XOF"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Laissez vide si la valeur n'est pas encore connue.</p>
            </div>

            <div>
              <label htmlFor="close_date" className={labelClass}>Date de clôture prévue</label>
              <input
                id="close_date"
                name="close_date"
                type="date"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 4 — Pipeline */}
        <div className={sectionClass}>
          <h2 className="mb-5 text-base font-semibold tracking-[-0.03em] text-slate-900">Position dans le pipeline</h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="stage" className={labelClass}>Étape commerciale</label>
              <select
                id="stage"
                name="stage"
                defaultValue="Qualification"
                className={inputClass}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="mt-2 grid grid-cols-5 gap-1">
                {STAGES.filter(s => s !== "Perdu").map((s, i) => (
                  <div key={s} className="text-center">
                    <div className={`h-1.5 rounded-full ${
                      i === 0 ? "bg-slate-300" :
                      i === 1 ? "bg-blue-400" :
                      i === 2 ? "bg-violet-400" : "bg-emerald-400"
                    }`} />
                    <p className="mt-1 text-[9px] text-slate-400 leading-tight">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="probability" className={labelClass}>
                Chances de conclure
                <span className="ml-1 font-normal text-slate-400">(%)</span>
              </label>
              <input
                id="probability"
                name="probability"
                type="number"
                min="0"
                max="100"
                step="5"
                className={inputClass}
                placeholder="Ex: 65"
              />
              <p className="mt-1.5 text-xs text-slate-400">De 0 à 100. Laissez vide pour calculer automatiquement.</p>
            </div>
          </div>
        </div>

        {/* Section 5 — Priorité */}
        <div className={sectionClass}>
          <h2 className="mb-5 text-base font-semibold tracking-[-0.03em] text-slate-900">Priorité</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {PRIORITIES.map((p) => (
              <label key={p.value} className="cursor-pointer">
                <input type="radio" name="priority" value={p.value} defaultChecked={p.value === "medium"} className="peer sr-only" />
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition peer-checked:border-sky-300 peer-checked:bg-sky-50 hover:border-slate-300">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                      p.value === "high" ? "bg-rose-500" :
                      p.value === "medium" ? "bg-amber-500" : "bg-slate-300"
                    }`} />
                    <span className="text-sm font-semibold text-slate-800">{p.label}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">{p.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 rounded-[24px] border border-slate-100 bg-white px-6 py-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/entreprise/ventes"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour au pipeline
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer le affaire"
            )}
          </button>
        </div>

      </form>
    </main>
  );
}

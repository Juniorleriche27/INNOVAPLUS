"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiSchool, type CertificateProgram } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

const FILTERS: Array<{ label: string; value: string | null }> = [
  { label: "Tous", value: null },
  { label: "Pro", value: "pro" },
  { label: "Explorer", value: "explorer" },
  { label: "Terminé", value: "finished" },
];

function categoryLabel(cert: CertificateProgram) {
  if (cert.is_paid) return "Pro / Payant";
  return "Explorer / Gratuit";
}

export default function SchoolCatalogPage() {
  const { user, loading } = useAuth();
  const [certs, setCerts] = useState<CertificateProgram[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiSchool
      .listCertificates()
      .then((data) => {
        if (mounted) setCerts(data);
      })
      .catch((err) => setError(err.message || "Erreur de chargement"));
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "finished") {
      return certs.filter((c) => (c.user_progress_status ?? "not_started") === "completed");
    }
    if (filter === "pro") return certs.filter((c) => c.is_paid);
    if (filter === "explorer") return certs.filter((c) => !c.is_paid);
    return certs;
  }, [certs, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">KORYXA School of Opportunity</h1>
          <p className="text-sm text-slate-500">Certificats modulaires pour activer l’impact et les compétences.</p>
        </div>
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition ${filter === f.value ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-600 hover:border-sky-200"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
        Vous n’avez encore terminé aucun certificat. Commencez par <span className="font-semibold text-sky-700">KORYXA Pro – Mindset & Systèmes d’Habitudes</span> par exemple.
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
          Vous n’avez encore terminé aucun certificat. Commencez par <span className="font-semibold text-sky-700">KORYXA Pro – Mindset & Systèmes d’Habitudes</span> par exemple.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((cert) => {
          const progress = cert.user_progress_percent ?? cert.progress_percent ?? 0;
          const status = cert.user_progress_status ?? (cert.issued ? "completed" : "not_started");
          const issued = cert.issued || status === "completed";
          const cta = issued ? "Revoir le parcours" : status === "in_progress" ? "Continuer" : "Découvrir";
          return (
            <Link
              href={`/school/${cert.slug}`}
              key={cert._id}
              className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{categoryLabel(cert)}</p>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-sky-700">{cert.title}</h3>
                </div>
                {cert.is_paid ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Payant</span>
                ) : (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Gratuit</span>
                )}
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{cert.short_description || cert.description}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">{cert.short_label || cert.slug}</span>
                {cert.estimated_duration && <span>{cert.estimated_duration}</span>}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>
                    {status === "not_started" && "Pas encore commencé"}
                    {status === "in_progress" && "En cours"}
                    {status === "completed" && "Terminé"}
                  </span>
                  <span>{status === "completed" ? "✓" : `${Math.round(progress)}%`}</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full transition-all ${issued ? "bg-emerald-500" : "bg-sky-500"}`}
                    style={{ width: issued ? "100%" : `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 inline-flex items-center justify-between text-sm font-semibold text-sky-700">
                {cta}
                <span aria-hidden className="text-slate-400 group-hover:text-sky-700">→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiSchool, type CertificateProgram } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

export default function SchoolPlanningHubPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<CertificateProgram[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiSchool
      .listCertificates()
      .then((res) => {
        if (!mounted) return;
        setItems(res);
      })
      .catch((err) => setError(err.message || "Impossible de charger le catalogue"))
      .finally(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (error) return <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">{error}</div>;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">KORYXA School</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Mon planning d’apprentissage</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-700">
          Génère un planning guidé à partir d’un parcours : modules → leçons → tâches datées. Les tâches créées sont taggées <code className="rounded bg-slate-100 px-1">context_type=learning</code>.
        </p>
        {!loading && !user ? (
          <p className="mt-3 text-sm text-slate-600">Connecte-toi pour créer ton planning.</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Choisir un parcours</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((cert) => (
            <div key={cert._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{cert.title}</p>
              <p className="mt-1 text-sm text-slate-600">{cert.short_description || cert.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <Link href={`/school/${cert.slug}`} className="text-sm font-semibold text-sky-700 hover:underline">
                  Voir le parcours
                </Link>
                <Link
                  href={`/school/${cert.slug}/planning`}
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Ouvrir le planning
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

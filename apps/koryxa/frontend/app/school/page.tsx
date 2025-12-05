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

const MOCK_CERTIFICATES: CertificateProgram[] = [
  {
    _id: "mock-1",
    title: "KORYXA Pro – Mindset & Systèmes d’Habitudes",
    slug: "koryxa-pro-mindset",
    short_label: "Mindset & Habitudes",
    description: "Discipline, routines, prise de décision sous contrainte.",
    short_description: "Discipline, routines, prise de décision sous contrainte.",
    category: "pro",
    is_paid: true,
    status: "published",
    estimated_duration: "4-6 semaines",
    user_progress_status: "not_started",
    user_progress_percent: 0,
  },
  {
    _id: "mock-2",
    title: "KORYXA Impact – Défis & Opportunités Africaines",
    slug: "koryxa-impact-opportunites",
    short_label: "Défis & Opportunités",
    description: "Lire les signaux terrain, cadrer un défi, proposer des pistes d’impact.",
    short_description: "Lire les signaux terrain, cadrer un défi, proposer des pistes d’impact.",
    category: "pro",
    is_paid: true,
    status: "published",
    estimated_duration: "4-6 semaines",
    user_progress_status: "not_started",
    user_progress_percent: 0,
  },
  {
    _id: "mock-3",
    title: "KORYXA Design – Résolution de Problèmes & Innovation Humaine",
    slug: "koryxa-design-problemes",
    short_label: "Design & Problèmes",
    description: "Design terrain, prototypage rapide, validation frugale.",
    short_description: "Design terrain, prototypage rapide, validation frugale.",
    category: "pro",
    is_paid: true,
    status: "published",
    estimated_duration: "4-6 semaines",
    user_progress_status: "not_started",
    user_progress_percent: 0,
  },
  {
    _id: "mock-4",
    title: "KORYXA Digital – Recherche Web & Outils Data de Base",
    slug: "koryxa-digital-data-basics",
    short_label: "Recherche & Data",
    description: "Trouver, nettoyer et analyser des données web pour décider.",
    short_description: "Trouver, nettoyer et analyser des données web pour décider.",
    category: "pro",
    is_paid: true,
    status: "published",
    estimated_duration: "3-4 semaines",
    user_progress_status: "not_started",
    user_progress_percent: 0,
  },
  {
    _id: "mock-5",
    title: "KORYXA Team – Communication, Storytelling & Collaboration",
    slug: "koryxa-team-communication",
    short_label: "Storytelling & Collaboration",
    description: "Récits courts, décisions claires, collaboration asynchrone.",
    short_description: "Récits courts, décisions claires, collaboration asynchrone.",
    category: "pro",
    is_paid: true,
    status: "published",
    estimated_duration: "3-4 semaines",
    user_progress_status: "not_started",
    user_progress_percent: 0,
  },
  {
    _id: "mock-6",
    title: "KORYXA Life – Développement Personnel pour l’Impact",
    slug: "koryxa-life-impact",
    short_label: "Life & Impact",
    description: "Routines personnelles, hygiène mentale, énergie durable.",
    short_description: "Routines personnelles, hygiène mentale, énergie durable.",
    category: "life",
    is_paid: true,
    status: "published",
    estimated_duration: "3 semaines",
    user_progress_status: "not_started",
    user_progress_percent: 0,
  },
  {
    _id: "mock-7",
    title: "KORYXA Business – Modèles Économiques & Business Plan",
    slug: "koryxa-business-models",
    short_label: "Business Models",
    description: "Briques de modèle économique et plan frugal.",
    short_description: "Briques de modèle économique et plan frugal.",
    category: "business",
    is_paid: true,
    status: "published",
    estimated_duration: "4-6 semaines",
    user_progress_status: "not_started",
    user_progress_percent: 0,
  },
  {
    _id: "mock-8",
    title: "KORYXA Passeport – CV, Pitch & Portfolio",
    slug: "koryxa-passeport",
    short_label: "Passeport",
    description: "CV, pitch et portfolio prêts à l’emploi.",
    short_description: "CV, pitch et portfolio prêts à l’emploi.",
    category: "explorer",
    is_paid: false,
    status: "published",
    estimated_duration: "2 semaines",
    user_progress_status: "not_started",
    user_progress_percent: 0,
  },
  {
    _id: "mock-9",
    title: "KORYXA Explorer – Métiers de la Donnée & du Big Data",
    slug: "koryxa-explorer-data",
    short_label: "Explorer Data",
    description: "Panorama des métiers data, pipelines et outils de départ.",
    short_description: "Panorama des métiers data, pipelines et outils de départ.",
    category: "explorer",
    is_paid: false,
    status: "published",
    estimated_duration: "2-3 semaines",
    user_progress_status: "not_started",
    user_progress_percent: 0,
  },
  {
    _id: "mock-10",
    title: "KORYXA Explorer – Métiers du Cloud & d’AWS",
    slug: "koryxa-explorer-cloud",
    short_label: "Explorer Cloud",
    description: "Bases du cloud, AWS et architectures simples.",
    short_description: "Bases du cloud, AWS et architectures simples.",
    category: "explorer",
    is_paid: false,
    status: "published",
    estimated_duration: "2-3 semaines",
    user_progress_status: "not_started",
    user_progress_percent: 0,
  },
  {
    _id: "mock-11",
    title: "KORYXA Explorer – Métiers du Software Engineering",
    slug: "koryxa-explorer-software",
    short_label: "Explorer Software",
    description: "Rôles d’ingénierie logicielle et pratiques essentielles.",
    short_description: "Rôles d’ingénierie logicielle et pratiques essentielles.",
    category: "explorer",
    is_paid: false,
    status: "published",
    estimated_duration: "2-3 semaines",
    user_progress_status: "not_started",
    user_progress_percent: 0,
  },
  {
    _id: "mock-12",
    title: "KORYXA Explorer – Métiers de la Cybersécurité",
    slug: "koryxa-explorer-cyber",
    short_label: "Explorer Cyber",
    description: "Bases de la sécurité, menaces courantes, parcours de formation.",
    short_description: "Bases de la sécurité, menaces courantes, parcours de formation.",
    category: "explorer",
    is_paid: false,
    status: "published",
    estimated_duration: "2-3 semaines",
    user_progress_status: "not_started",
    user_progress_percent: 0,
  },
  {
    _id: "mock-13",
    title: "KORYXA Explorer – Salesforce & Creative Tech",
    slug: "koryxa-explorer-salesforce",
    short_label: "Explorer Salesforce",
    description: "Découvrir l’écosystème Salesforce et la creative tech.",
    short_description: "Découvrir l’écosystème Salesforce et la creative tech.",
    category: "explorer",
    is_paid: false,
    status: "published",
    estimated_duration: "2-3 semaines",
    user_progress_status: "not_started",
    user_progress_percent: 0,
  },
];

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
        if (!mounted) return;
        if (data.length === 0) {
          // fallback mock to avoid empty UI
          setCerts(MOCK_CERTIFICATES);
        } else {
          setCerts(data);
        }
      })
      .catch((err) => {
        setError(err.message || "Erreur de chargement");
        // fallback mock in case of API failure
        setCerts(MOCK_CERTIFICATES);
      });
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

  const hasCertificates = certs.length > 0;
  const hasCompletedAny = certs.some((c) => (c.user_progress_status ?? "not_started") === "completed");
  const hasFiltered = filtered.length > 0;

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

      {/* Bandeau: aucun certificat terminé (affiché uniquement si on a des certificats) */}
      {hasCertificates && !hasCompletedAny && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          Vous n’avez encore terminé aucun certificat. Commencez par <span className="font-semibold text-sky-700">KORYXA Pro – Mindset & Systèmes d’Habitudes</span> par exemple.
        </div>
      )}

      {/* État vide quand aucune donnée du tout */}
      {!hasCertificates && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
          Aucun certificat disponible pour le moment.
        </div>
      )}

      {/* État vide quand filtre renvoie 0 résultat mais qu’il existe des certificats */}
      {hasCertificates && !hasFiltered && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
          Aucun certificat pour ce filtre. Essayez “Tous” ou démarrez par <span className="font-semibold text-sky-700">KORYXA Pro – Mindset & Systèmes d’Habitudes</span>.
        </div>
      )}

      {/* Grille de cartes */}
      {hasFiltered && (
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
      )}
    </div>
  );
}

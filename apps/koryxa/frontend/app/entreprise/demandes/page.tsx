"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileSearch,
  Loader2,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { CLIENT_INNOVA_API_BASE } from "@/lib/env";
import { ENTERPRISE_STORAGE_KEY } from "@/app/entreprise/flow";

/* ─────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────── */

type NeedStatus = {
  id: string;
  primary_goal: string;
  need_type: string;
  urgency: string;
  clarity_level: string;
  qualification_score: number;
  recommended_treatment_mode: "prive" | "publie" | "accompagne";
  next_recommended_action: string;
  created_at?: string;
  status: string;
};

/* ─────────────────────────────────────────────────────────────────
   Helpers d'affichage
───────────────────────────────────────────────────────────────── */

function clarityLabel(level: string): { label: string; color: string; dot: string } {
  switch (level) {
    case "strong":
      return {
        label: "Recommandation prête",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "qualified":
      return {
        label: "Besoin qualifié",
        color: "bg-sky-50 text-sky-700 border-sky-200",
        dot: "bg-sky-500",
      };
    default:
      return {
        label: "En cours d'analyse",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-400",
      };
  }
}

function treatmentLabel(mode: string): string {
  switch (mode) {
    case "publie": return "Publié comme opportunité";
    case "accompagne": return "Accompagnement KORYXA";
    default: return "Traitement confidentiel";
  }
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 45) return "text-sky-600";
  return "text-amber-600";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Date inconnue";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return "Date inconnue";
  }
}

/* ─────────────────────────────────────────────────────────────────
   Carte d'un besoin
───────────────────────────────────────────────────────────────── */

function NeedCard({ need }: { need: NeedStatus }) {
  const clarity = clarityLabel(need.clarity_level);

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition hover:shadow-[0_8px_24px_rgba(15,23,42,0.09)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] bg-sky-50">
            <ClipboardCheck className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400">{formatDate(need.created_at)}</p>
            <p className="text-sm font-semibold text-slate-900 leading-tight">{need.need_type || "Besoin soumis"}</p>
          </div>
        </div>

        {/* Badge statut */}
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${clarity.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${clarity.dot}`} />
          {clarity.label}
        </span>
      </div>

      {/* Objectif principal */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Objectif
        </p>
        <p className="mt-1.5 text-base font-medium text-slate-900">
          {need.primary_goal}
        </p>
      </div>

      {/* Méta-infos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Score</p>
          <p className={`mt-1 text-xl font-bold tabular-nums ${scoreColor(need.qualification_score)}`}>
            {need.qualification_score}
            <span className="text-sm font-normal text-slate-400">/100</span>
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Urgence</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{need.urgency}</p>
        </div>
        <div className="col-span-2 rounded-xl bg-slate-50 px-4 py-3 sm:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Mode</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{treatmentLabel(need.recommended_treatment_mode)}</p>
        </div>
      </div>

      {/* Prochaine action recommandée */}
      {need.next_recommended_action && (
        <div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-500" />
          <p className="text-sm text-sky-800">{need.next_recommended_action}</p>
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/entreprise/resultat/${need.id}`}
        className="mt-auto inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(2,132,199,0.20)] transition hover:-translate-y-0.5 hover:bg-sky-500"
      >
        Voir le résultat complet
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────
   État vide
───────────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-8 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50">
        <FileSearch className="h-7 w-7 text-sky-500" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-900">
        Vous n'avez pas encore soumis de besoin
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
        Chaque besoin que vous décrivez via le Cadrage apparaît ici — avec son analyse, son score et la recommandation KORYXA. Tout reste accessible à tout moment.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/entreprise/cadrage"
          className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(2,132,199,0.22)] transition hover:-translate-y-0.5 hover:bg-sky-500"
        >
          <Plus className="h-4 w-4" />
          Décrire mon premier besoin
        </Link>
      </div>
      <p className="mt-5 text-xs text-slate-400">
        Moins de 5 minutes · Résultat immédiat · Sans engagement
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────── */

export default function MesDemandesPage() {
  const [needs, setNeeds] = useState<NeedStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    async function loadNeeds() {
      setLoading(true);

      // 1. Essayer l'API (liste complète des besoins de l'utilisateur)
      try {
        const res = await fetch(`${CLIENT_INNOVA_API_BASE}/enterprise/needs`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const list: NeedStatus[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.needs)
              ? data.needs
              : [];
          setNeeds(list);
          setLoading(false);
          return;
        }
      } catch {
        // pas d'API disponible — fallback localStorage
      }

      // 2. Fallback : récupérer le dernier need_id depuis localStorage
      try {
        const storedId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(ENTERPRISE_STORAGE_KEY)
            : null;

        if (storedId) {
          const res = await fetch(
            `${CLIENT_INNOVA_API_BASE}/enterprise/needs/${encodeURIComponent(storedId)}`,
            { credentials: "include" },
          );
          if (res.ok) {
            const data = await res.json();
            const need = data?.need ?? data;
            if (need?.id) {
              setNeeds([need]);
              setLoading(false);
              return;
            }
          }
        }
      } catch {
        // rien en localStorage non plus
      }

      setApiError(true);
      setLoading(false);
    }

    loadNeeds();
  }, []);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-1 py-2 sm:px-2">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/entreprise" className="transition-colors hover:text-slate-900">
          Entreprise
        </Link>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
        <span className="font-medium text-slate-900">Mes demandes</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-100 bg-white px-6 py-5 shadow-[0_2px_16px_rgba(15,23,42,0.05)] lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[16px] bg-sky-50">
            <ClipboardCheck className="h-6 w-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-2xl">
              Mes demandes
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Tous les besoins que vous avez soumis à KORYXA — avec leur analyse et recommandation.
            </p>
          </div>
        </div>
        <Link
          href="/entreprise/cadrage"
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(2,132,199,0.20)] transition hover:-translate-y-0.5 hover:bg-sky-500"
        >
          <Plus className="h-4 w-4" />
          Nouveau besoin
        </Link>
      </div>

      {/* Explication du processus */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            Icon: ClipboardCheck,
            step: "1",
            title: "Vous décrivez un besoin",
            detail: "8 questions via le Cadrage. Moins de 5 minutes.",
            color: "bg-sky-50 text-sky-600",
          },
          {
            Icon: Clock,
            step: "2",
            title: "KORYXA l'analyse",
            detail: "Score de clarté, mode de traitement, prochaine action.",
            color: "bg-indigo-50 text-indigo-600",
          },
          {
            Icon: CheckCircle2,
            step: "3",
            title: "Résultat disponible ici",
            detail: "Vous retrouvez chaque demande et son avancement.",
            color: "bg-emerald-50 text-emerald-600",
          },
        ].map((item) => (
          <div
            key={item.step}
            className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4"
          >
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${item.color}`}>
              <item.Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Contenu principal */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
            <p className="text-sm text-slate-400">Chargement de vos demandes…</p>
          </div>
        </div>
      ) : apiError && needs.length === 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Impossible de charger vos demandes pour le moment
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Vérifiez votre connexion ou réessayez dans quelques instants.{" "}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="font-semibold underline underline-offset-2"
              >
                Actualiser
              </button>
            </p>
          </div>
        </div>
      ) : needs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {needs.map((need) => (
            <NeedCard key={need.id} need={need} />
          ))}
        </div>
      )}

      {/* CTA bas de page si on a déjà des demandes */}
      {needs.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Un nouveau besoin ?</p>
            <p className="mt-0.5 text-xs text-slate-500">Chaque demande est traitée séparément.</p>
          </div>
          <Link
            href="/entreprise/cadrage"
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-sky-500"
          >
            <Plus className="h-4 w-4" />
            Nouveau besoin
          </Link>
        </div>
      )}

    </main>
  );
}

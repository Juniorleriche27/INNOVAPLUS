"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiSchool, type CertificateDetail } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

function Badge({ paid }: { paid: boolean }) {
  return paid ? (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Payant</span>
  ) : (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Gratuit</span>
  );
}

export default function CertificateDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [data, setData] = useState<CertificateDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!params?.slug) return;
    let mounted = true;
    apiSchool
      .getCertificate(params.slug)
      .then((cert) => {
        if (mounted) setData(cert);
      })
      .catch((err) => setError(err.message || "Erreur de chargement"));
    return () => {
      mounted = false;
    };
  }, [params?.slug]);

  async function enroll() {
    if (!data) return;
    setSubmitting(true);
    try {
      await apiSchool.enroll(data._id);
      const refreshed = await apiSchool.getCertificate(data.slug);
      setData(refreshed);
      router.push(`/school/${data.slug}/learn`);
    } catch (err) {
      setError((err as Error).message || "Impossible de vous inscrire");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">{error}</div>;
  if (!data) return <div className="text-slate-500">Chargement…</div>;

  const progress = data.enrollment?.progress_percent ?? 0;
  const issued = Boolean(data.issued);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span>{data.category}</span>
            <Badge paid={data.is_paid} />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">{data.title}</h1>
          <p className="max-w-3xl text-sm text-slate-600">{data.description}</p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {data.skill_slugs?.map((s) => (
              <span key={s} className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{s}</span>
            ))}
            {data.estimated_duration && (
              <span className="rounded-full border border-slate-200 px-3 py-1">Durée estimée: {data.estimated_duration}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{issued ? "Certificat obtenu" : "Progression"}</span>
              <span>{issued ? "✓" : `${progress}%`}</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
              <div className={`h-2 rounded-full ${issued ? "bg-emerald-500" : "bg-sky-500"}`} style={{ width: issued ? "100%" : `${Math.min(progress, 100)}%` }} />
            </div>
            {!issued && user && !loading && (
              <button
                onClick={enroll}
                disabled={submitting}
                className="mt-4 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
              >
                {data.enrollment ? "Continuer" : submitting ? "Inscription…" : "Commencer"}
              </button>
            )}
            {!user && (
              <p className="mt-3 text-xs text-slate-500">Connectez-vous pour démarrer ce parcours.</p>
            )}
            {issued && (
              <Link href={`/school/${data.slug}/learn`} className="mt-4 inline-flex text-sm font-semibold text-sky-700">
                Consulter le parcours
              </Link>
            )}
          </div>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Modules</h2>
        <div className="space-y-3">
          {data.modules?.map((mod) => (
            <div key={mod._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{mod.title}</h3>
                  <p className="text-sm text-slate-600">{mod.description}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{mod.lessons?.length || 0} leçons</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                {mod.lessons?.map((lesson) => (
                  <li key={lesson._id} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50">
                    <div>
                      <p className="font-semibold text-slate-800">{lesson.title}</p>
                      <p className="text-xs text-slate-500">{lesson.summary}</p>
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{lesson.lesson_type}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Prêt à commencer ?</h3>
          <p className="text-sm text-slate-600">Suivez le parcours, complétez les leçons et soumettez vos preuves.</p>
        </div>
        <Link href={`/school/${data.slug}/learn`} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">
          Ouvrir le parcours
        </Link>
      </div>
    </div>
  );
}

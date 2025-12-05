"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiSchool, type CertificateDetail } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChevronDown, ChevronRight, Check, FileText, ExternalLink, Play, Target } from "lucide-react";

function Badge({ paid }: { paid: boolean }) {
  return paid ? (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Payant</span>
  ) : (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Gratuit</span>
  );
}

function LessonIcon({ type }: { type: string }) {
  if (type === "external_article") return <ExternalLink className="h-4 w-4 text-slate-500" />;
  if (type === "youtube_video") return <Play className="h-4 w-4 text-slate-500" />;
  if (type === "project_brief") return <Target className="h-4 w-4 text-slate-500" />;
  return <FileText className="h-4 w-4 text-slate-500" />;
}

export default function CertificateDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [data, setData] = useState<CertificateDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

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
    if (!user) {
        setEnrollError("Connectez-vous pour démarrer ce parcours.");
        return;
    }
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
  const status = issued ? "Terminé" : data.enrollment ? "En cours" : "Non commencé";

  const learnings = [
    "Construire un mindset de croissance dans des contextes difficiles",
    "Créer 3 habitudes réalistes pour l’apprentissage et l’emploi",
    "Utiliser l’écriture quotidienne pour clarifier ses décisions",
    "Organiser une journée avec un système simple (priorités & énergie)",
  ];

  const audience = [
    "Jeunes actifs, étudiants, personnes en reconversion",
    "Profils tech/non-tech voulant structurer leurs routines",
    "Personnes cherchant constance et clarté dans l’action",
  ];

  const prereq = [
    "Aucun prérequis technique",
    "30–60 min par jour pendant quelques semaines",
  ];

  const format = [
    "Articles et vidéos YouTube",
    "Textes KORYXA",
    "Projet guidé avec preuve finale",
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/40 p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <span>{data.category}</span>
              <Badge paid={data.is_paid} />
              {data.estimated_duration && (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">{data.estimated_duration}</span>
              )}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-slate-900">{data.title}</h1>
              <p className="max-w-3xl text-sm text-slate-700">{data.description}</p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {data.skill_slugs?.map((s) => (
                  <span key={s} className="rounded-full bg-white/80 px-3 py-1 font-semibold text-slate-800 border border-slate-200">{s}</span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Ce que vous allez apprendre</h3>
              <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                {learnings.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:justify-self-end">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md w-full max-w-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Votre progression</div>
              <div className="mt-1 flex items-center justify-between text-sm font-semibold text-slate-800">
                <span>{status}</span>
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
              {enrollError && <p className="mt-2 text-xs text-amber-700">{enrollError}</p>}
              {!user && <p className="mt-3 text-xs text-slate-500">Connectez-vous pour démarrer ce parcours.</p>}
              {issued && (
                <Link href={`/school/${data.slug}/learn`} className="mt-4 inline-flex text-sm font-semibold text-sky-700">
                  Consulter le parcours
                </Link>
              )}
              <p className="mt-4 text-xs text-slate-500">Certificat délivré par KORYXA School of Opportunity.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_0.9fr]">
        {/* Colonne gauche */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Ce que vous allez apprendre</h2>
            <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              {learnings.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Modules & leçons</h2>
            <div className="space-y-3">
              {data.modules?.map((mod) => {
                const open = openModules[mod._id] ?? true;
                const lessonCount = mod.lessons?.length || 0;
                return (
                  <div key={mod._id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <button
                      onClick={() => setOpenModules((prev) => ({ ...prev, [mod._id]: !open }))}
                      className="w-full rounded-2xl px-4 py-3 flex items-center justify-between text-left"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {open ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                          <h3 className="text-base font-semibold text-slate-900">{mod.title}</h3>
                        </div>
                        <p className="ml-6 text-sm text-slate-600">{mod.description}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{lessonCount} leçon{lessonCount > 1 ? "s" : ""}</span>
                    </button>
                    {open && (
                      <div className="px-4 pb-3">
                        <div className="space-y-1">
                          {mod.lessons?.map((lesson) => {
                            const completed = lesson.status === "completed";
                            const typeLabel =
                              lesson.lesson_type === "external_article"
                                ? "Article"
                                : lesson.lesson_type === "youtube_video"
                                  ? "Vidéo"
                                  : lesson.lesson_type === "project_brief"
                                    ? "Projet"
                                    : "Texte KORYXA";
                            return (
                              <div key={lesson._id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                  <LessonIcon type={lesson.lesson_type} />
                                  <div>
                                    <p className="font-semibold text-slate-800">{lesson.title}</p>
                                    <p className="text-xs text-slate-500">{lesson.summary}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                  <span className="rounded-full border border-slate-200 px-2 py-1">{typeLabel}</span>
                                  {completed ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-600">
                                      <Check className="h-3 w-3" /> Terminé
                                    </span>
                                  ) : (
                                    <span className="rounded-full border border-slate-200 bg-white px-2 py-1">Non commencé</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Projet final & conditions d’obtention</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> Compléter 100 % des leçons et soumettre la preuve.</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> Preuve: photo/scan de journal, capture planning, paragraphe de bilan.</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> Validation par KORYXA School of Opportunity.</li>
            </ul>
          </section>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Pour qui ?</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {audience.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Prérequis</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {prereq.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Format</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {format.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

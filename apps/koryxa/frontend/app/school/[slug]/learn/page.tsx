"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiSchool, type CertificateDetail, type Lesson, type ContentResource } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

function ResourceBlock({ res }: { res: ContentResource }) {
  if (res.resource_type === "internal_text") {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 whitespace-pre-line">
        {res.content_text}
      </div>
    );
  }
  if (res.resource_type === "youtube_video" && res.url) {
    return (
      <div className="rounded-lg border border-slate-200 bg-black/5 p-3">
        <p className="text-sm font-semibold text-slate-800 mb-2">Vidéo YouTube</p>
        <a href={res.url} target="_blank" rel="noreferrer" className="text-sky-700 underline">
          Ouvrir la vidéo
        </a>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800">
      <p className="font-semibold">Article / lien externe</p>
      {res.metadata?.title && <p className="text-slate-600">{String(res.metadata.title)}</p>}
      {res.url && (
        <a href={res.url} target="_blank" rel="noreferrer" className="text-sky-700 underline">
          Ouvrir
        </a>
      )}
    </div>
  );
}

export default function LearnPage() {
  const params = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<CertificateDetail | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [evidenceMessage, setEvidenceMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.slug) return;
    let mounted = true;
    setLoading(true);
    apiSchool
      .getCertificate(params.slug)
      .then((cert) => {
        if (!mounted) return;
        setData(cert);
        const firstLesson = cert.modules?.[0]?.lessons?.[0] || null;
        setActiveLesson(firstLesson || null);
      })
      .catch((err) => setError(err.message || "Erreur de chargement"))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [params?.slug]);

  const lessonsFlat: Lesson[] = useMemo(() => {
    if (!data?.modules) return [];
    return data.modules.flatMap((m) => m.lessons || []);
  }, [data]);

  async function completeCurrent() {
    if (!activeLesson) return;
    setCompleting(true);
    try {
      const res = await apiSchool.completeLesson(activeLesson._id);
      setData((prev) => {
        if (!prev) return prev;
        const updatedModules = prev.modules.map((m) => ({
          ...m,
          lessons: (m.lessons || []).map((l) => (l._id === activeLesson._id ? { ...l, status: "completed" as const } : l)),
        }));
        return { ...prev, modules: updatedModules, enrollment: { ...(prev.enrollment || {}), progress_percent: res.progress_percent } } as CertificateDetail;
      });
      setEvidenceMessage(res.issued ? "Certificat émis !" : null);
    } catch (err) {
      setError((err as Error).message || "Impossible de marquer la leçon");
    } finally {
      setCompleting(false);
    }
  }

  async function submitEvidence() {
    if (!data) return;
    const type = data.required_evidence_types?.[0] || "project_link";
    try {
      const payload: Record<string, unknown> = {};
      if (evidenceUrl) payload.url = evidenceUrl;
      if (evidenceText) payload.text = evidenceText;
      await apiSchool.submitEvidence(data._id, { type, payload });
      setEvidenceMessage("Preuve soumise, en revue.");
      setEvidenceUrl("");
      setEvidenceText("");
    } catch (err) {
      setError((err as Error).message || "Impossible de soumettre la preuve");
    }
  }

  if (loading) return <div className="text-slate-500">Chargement…</div>;
  if (error) return <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">{error}</div>;
  if (!data) return <div className="text-slate-500">Aucune donnée.</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Parcours</h2>
            <p className="text-xs text-slate-500">{data.title}</p>
          </div>
          <Link href={`/school/${data.slug}`} className="text-xs font-semibold text-sky-700">Détail</Link>
        </div>
        <div className="space-y-2">
          {data.modules?.map((mod) => (
            <div key={mod._id} className="rounded-lg border border-slate-200 bg-slate-50/80 p-2">
              <p className="text-xs font-semibold text-slate-700">{mod.title}</p>
              <div className="mt-1 space-y-1">
                {mod.lessons?.map((lesson) => {
                  const active = activeLesson?._id === lesson._id;
                  return (
                    <button
                      key={lesson._id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm transition ${active ? "bg-sky-50 text-sky-700" : "hover:bg-white text-slate-700"}`}
                    >
                      <span className="truncate">{lesson.title}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{lesson.lesson_type}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Leçon</p>
              <h2 className="text-xl font-semibold text-slate-900">{activeLesson?.title || "Sélectionnez une leçon"}</h2>
              <p className="text-sm text-slate-600">{activeLesson?.summary}</p>
            </div>
            {user ? (
              <button
                onClick={completeCurrent}
                disabled={!activeLesson || completing}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
              >
                {completing ? "Marquage…" : "Terminer cette leçon"}
              </button>
            ) : (
              <p className="text-xs text-slate-500">Connectez-vous pour suivre votre progression.</p>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {activeLesson?.resources?.length ? (
              activeLesson.resources.map((res) => <ResourceBlock key={res._id} res={res} />)
            ) : (
              <p className="text-sm text-slate-500">Aucune ressource attachée.</p>
            )}
          </div>
        </div>

        {data.required_evidence_types && data.required_evidence_types.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Preuve attendue</p>
                <h3 className="text-base font-semibold text-slate-900">{data.required_evidence_types.join(", ")}</h3>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">Soumettre</span>
            </div>
            <div className="mt-3 space-y-2">
              <input
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="Lien vers votre projet / portfolio"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              />
              <textarea
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                placeholder="Description courte"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
                rows={3}
              />
              <button
                onClick={submitEvidence}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Soumettre pour validation
              </button>
              {evidenceMessage && <p className="text-xs text-emerald-700">{evidenceMessage}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

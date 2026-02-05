"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { INNOVA_API_BASE } from "@/lib/env";
import { apiSchool, type CertificateDetail } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

const CLEAN_API_BASE = INNOVA_API_BASE.replace(/(\/innova\/api)+/g, "/innova/api");
const API_BASE = `${CLEAN_API_BASE}/myplanning`;

type Task = {
  id: string;
  title: string;
  category?: string | null;
  kanban_state: "todo" | "in_progress" | "done";
  due_datetime?: string | null;
  estimated_duration_minutes?: number | null;
  linked_goal?: string | null;
  context_type?: string;
  context_id?: string | null;
};

async function apiJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || `HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function listLearningTasks(certificateId: string): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/learning/tasks?certificate_id=${encodeURIComponent(certificateId)}`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await apiJson<{ items: Task[] }>(res);
  return data.items || [];
}

async function generateLearningTasks(certificateId: string, availableMinutesPerDay: number) {
  const res = await fetch(`${API_BASE}/learning/generate`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ certificate_id: certificateId, available_minutes_per_day: availableMinutesPerDay, overwrite_existing: true }),
  });
  return apiJson<{ created: number; updated: number; skipped: number }>(res);
}

async function markTaskDone(taskId: string) {
  const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kanban_state: "done", completed_at: new Date().toISOString() }),
  });
  return apiJson<Task>(res);
}

function lessonIdFromLinkedGoal(linkedGoal?: string | null): string | null {
  if (!linkedGoal) return null;
  if (linkedGoal.startsWith("lesson:")) return linkedGoal.slice("lesson:".length);
  return null;
}

export default function LearningPlanningPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [cert, setCert] = useState<CertificateDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [minutesPerDay, setMinutesPerDay] = useState(120);

  useEffect(() => {
    if (!params?.slug) return;
    let mounted = true;
    apiSchool
      .getCertificate(params.slug)
      .then((data) => {
        if (!mounted) return;
        setCert(data);
      })
      .catch((err) => setError(err.message || "Erreur de chargement"))
      .finally(() => {});
    return () => {
      mounted = false;
    };
  }, [params?.slug]);

  useEffect(() => {
    if (!cert?._id || !user) return;
    listLearningTasks(cert._id)
      .then(setTasks)
      .catch((err) => setError(err.message || "Impossible de charger les tâches"));
  }, [cert?._id, user]);

  const completedCount = useMemo(() => tasks.filter((t) => t.kanban_state === "done").length, [tasks]);
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((100 * completedCount) / totalCount) : 0;

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    if (!cert?._id) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/school/${cert.slug}/planning`)}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await generateLearningTasks(cert._id, minutesPerDay);
      const refreshed = await listLearningTasks(cert._id);
      setTasks(refreshed);
    } catch (err) {
      setError((err as Error).message || "Impossible de générer le planning");
    } finally {
      setBusy(false);
    }
  }

  async function onComplete(task: Task) {
    setBusy(true);
    setError(null);
    try {
      await markTaskDone(task.id);
      const lessonId = lessonIdFromLinkedGoal(task.linked_goal);
      if (lessonId) {
        await apiSchool.completeLesson(lessonId);
      }
      if (cert?._id) {
        const refreshed = await listLearningTasks(cert._id);
        setTasks(refreshed);
      }
      if (cert?.slug) {
        const refreshedCert = await apiSchool.getCertificate(cert.slug);
        setCert(refreshedCert);
      }
    } catch (err) {
      setError((err as Error).message || "Impossible de terminer la tâche");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">{error}</div>;
  if (!cert) return <div className="text-slate-500">Chargement…</div>;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Mon planning d’apprentissage</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{cert.title}</h1>
            <p className="mt-2 text-sm text-slate-700">Ce planning ne montre que les tâches de contexte <code className="rounded bg-slate-100 px-1">learning</code>.</p>
          </div>
          <Link href={`/school/${cert.slug}`} className="text-sm font-semibold text-sky-700 hover:underline">
            Retour au parcours
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Progression tâches</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{progressPct}%</p>
            <p className="mt-1 text-sm text-slate-600">{completedCount} / {totalCount} terminées</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Progression parcours</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{Math.round(cert.enrollment?.progress_percent ?? 0)}%</p>
            <p className="mt-1 text-sm text-slate-600">{cert.enrollment ? "Inscrit" : "Non inscrit"}</p>
          </div>
          <form onSubmit={onGenerate} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Générer / régénérer</p>
            <label className="mt-2 block text-sm font-semibold text-slate-800">Minutes / jour</label>
            <input
              type="number"
              min={30}
              max={720}
              value={minutesPerDay}
              onChange={(e) => setMinutesPerDay(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy || loading}
              className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {busy ? "…" : "Créer mon planning"}
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Tâches</h2>
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-700">
            Aucune tâche pour ce parcours. Clique sur “Créer mon planning”.
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t.estimated_duration_minutes ? `${t.estimated_duration_minutes} min` : "—"} ·{" "}
                      {t.due_datetime ? new Date(t.due_datetime).toLocaleString() : "sans échéance"}
                    </p>
                  </div>
                  {t.kanban_state !== "done" ? (
                    <button
                      onClick={() => onComplete(t)}
                      disabled={busy}
                      className="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Terminer
                    </button>
                  ) : (
                    <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                      ✓ Terminé
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


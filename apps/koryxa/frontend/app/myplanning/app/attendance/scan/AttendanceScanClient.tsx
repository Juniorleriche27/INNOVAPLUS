"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AttendanceApiError,
  AttendanceScanResponse,
  myplanningRequest,
} from "@/app/myplanning/components/attendanceApi";

type EventType = "check_in" | "check_out";

type BarcodeDetectorLike = {
  detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

function canUseBarcodeDetector(): boolean {
  return typeof window !== "undefined" && typeof window.BarcodeDetector === "function";
}

function fmtDateTime(value?: string | null): string {
  if (!value) return "n/a";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "n/a";
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function statusBadge(status: string): { label: string; className: string } {
  if (status === "present") return { label: "Présent", className: "bg-emerald-100 text-emerald-700" };
  if (status === "partial") return { label: "Partiel", className: "bg-amber-100 text-amber-800" };
  return { label: "Absent", className: "bg-rose-100 text-rose-700" };
}

export default function AttendanceScanClient() {
  const { user, loading: authLoading } = useAuth();
  const [eventType, setEventType] = useState<EventType>("check_in");
  const [qrPayload, setQrPayload] = useState("");
  const [scanning, setScanning] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [last, setLast] = useState<AttendanceScanResponse | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const isAuthenticated = !!user?.email;
  const detectorAvailable = useMemo(() => canUseBarcodeDetector(), []);

  async function stopCamera() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }

  async function startCamera() {
    setError("");
    setInfo("");
    if (!detectorAvailable) {
      setError("Scan caméra non supporté sur ce navigateur. Utilise le champ 'coller le code'.");
      return;
    }
    if (scanning) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Accès caméra refusé";
      setError(msg);
      await stopCamera();
    }
  }

  useEffect(() => {
    return () => {
      void stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scanning) return;
    if (!detectorAvailable) return;
    const detector = new window.BarcodeDetector?.({ formats: ["qr_code"] });
    if (!detector) return;

    const loop = async () => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        const barcodes = await detector.detect(canvas);
        const value = (barcodes && barcodes[0] && barcodes[0].rawValue) || "";
        if (value && typeof value === "string") {
          setQrPayload(value);
          setInfo("QR détecté. Tu peux valider.");
          await stopCamera();
          return;
        }
      } catch {
        // Ignore transient detector errors.
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [scanning, detectorAvailable]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const code = qrPayload.trim();
    if (!code) return;

    setSending(true);
    setError("");
    setInfo("");
    try {
      const body = {
        qr_payload: code,
        event_type: eventType,
        client_ts: new Date().toISOString(),
        client_tz: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
      };
      const payload = await myplanningRequest<AttendanceScanResponse>("/attendance/scan", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setLast(payload);
      setInfo("Enregistré.");
      setQrPayload("");
    } catch (err) {
      const message =
        err instanceof AttendanceApiError && err.status === 401
          ? "Session requise. Connecte-toi puis réessaie."
          : err instanceof Error
            ? err.message
            : "Scan impossible";
      setError(message);
    } finally {
      setSending(false);
    }
  }

  const dailyBadge = last?.daily?.status ? statusBadge(last.daily.status) : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Attendance</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Scanner un QR (check-in/out)</h1>
            <p className="mt-2 text-sm text-slate-700">
              Utilise la caméra (si disponible) ou colle le code du QR.
            </p>
          </div>
          <Link
            href="/myplanning/app"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Retour App
          </Link>
        </div>
      </section>

      {!isAuthenticated && !authLoading ? (
        <p className="text-sm font-medium text-rose-700">Connecte-toi pour scanner.</p>
      ) : null}
      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      {info ? <p className="text-sm font-medium text-emerald-700">{info}</p> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Scan</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void startCamera()}
              disabled={scanning || !detectorAvailable}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {scanning ? "Caméra active" : "Démarrer caméra"}
            </button>
            <button
              type="button"
              onClick={() => void stopCamera()}
              disabled={!scanning}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Stop
            </button>
          </div>
        </div>

        {scanning ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
            <video ref={videoRef} className="h-[320px] w-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            >
              <option value="check_in">Check-in (matin)</option>
              <option value="check_out">Check-out (soir)</option>
            </select>
            <input
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              placeholder="Coller le code QR ici (base64url)"
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !qrPayload.trim() || !isAuthenticated}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Envoi..." : "Valider"}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Si la caméra ne marche pas, demande au responsable d&apos;afficher le QR et copie-colle le code.
          </p>
        </form>
      </section>

      {last ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Résultat</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Événement</p>
              <p className="mt-2 text-sm text-slate-900">ID: {last.event_id}</p>
              <p className="mt-1 text-sm text-slate-900">Workspace: {last.daily.workspace_id}</p>
              <p className="mt-1 text-sm text-slate-900">Jour: {last.daily.day}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Journée</p>
              {dailyBadge ? (
                <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${dailyBadge.className}`}>
                  {dailyBadge.label}
                </span>
              ) : null}
              <p className="mt-2 text-sm text-slate-900">Minutes: {last.daily.minutes_present}</p>
              <p className="mt-1 text-xs text-slate-600">1er in: {fmtDateTime(last.daily.first_check_in)}</p>
              <p className="mt-1 text-xs text-slate-600">Dernier out: {fmtDateTime(last.daily.last_check_out)}</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}


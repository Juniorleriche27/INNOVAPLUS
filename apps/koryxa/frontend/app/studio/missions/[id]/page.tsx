"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { INNOVA_API_BASE } from "@/lib/env";

type Mission = {
  id: string;
  titre: string;
  type: string;
  description: string;
  public_cible: string;
  objectif: string;
  ton: string;
  budget?: string;
  devise?: string;
  deadline?: string;
  statut: "Ouverte" | "En cours";
  clientId: string;
  clientName: string;
  redacteurId?: string;
  redacteurName?: string;
};

const API = `${INNOVA_API_BASE.replace(/(\\/innova\\/api)+/g, "/innova/api")}/studio-missions`;

async function fetchWithFallback(input: RequestInfo | URL, init?: RequestInit) {
  try {
    return await fetch(input, init);
  } catch {
    const relative = typeof input === "string" && input.startsWith("http") ? input.replace(API, "/innova/api/studio-missions") : input;
    return fetch(relative, init);
  }
}

function mapMission(data: any): Mission {
  return {
    id: data?.id || data?._id || "",
    titre: data?.titre || "",
    type: data?.type || "",
    description: data?.description || "",
    public_cible: data?.public_cible || data?.publicCible || "",
    objectif: data?.objectif || "",
    ton: data?.ton || "",
    budget: data?.budget || "",
    devise: data?.devise || "",
    deadline: data?.deadline || "",
    statut: data?.statut || data?.status || "Ouverte",
    clientId: data?.client_id || data?.clientId || "",
    clientName: data?.client_name || data?.clientName || "",
    redacteurId: data?.redacteur_id || data?.redacteurId,
    redacteurName: data?.redacteur_name || data?.redacteurName,
  };
}

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const currentUserId = "me-user";
  const [mission, setMission] = useState<Mission | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!missionId) return;
    (async () => {
      try {
        const res = await fetchWithFallback(`${API}/${missionId}`, { credentials: "include" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setMission(mapMission(data));
      } catch (err) {
        console.error(err);
        setError("Mission introuvable.");
      }
    })();
  }, [missionId]);

  if (!mission) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <p className="text-sm text-slate-700">{error || "Mission introuvable."}</p>
          <Link href="/studio/missions" className="mt-3 inline-flex text-sm font-semibold text-sky-700">
            ← Retour au Studio de missions
          </Link>
        </div>
      </div>
    );
  }

  const isClient = mission.clientId === currentUserId;
  const isRedacteur = mission.redacteurId === currentUserId;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-sky-50/30 to-white px-4 py-8 sm:px-6 lg:px-10 space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">CHATLAYA Studio</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">{mission.titre}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1 border border-slate-200 font-semibold text-slate-700">
            {mission.type}
          </span>
          <span
            className="rounded-full bg-emerald-50 px-3 py-1 border border-emerald-100 text-emerald-700 font-semibold"
          >
            Statut : {mission.statut}
          </span>
          <span className="text-slate-500">Date limite : {mission.deadline || "—"}</span>
          <span className="text-slate-500">
            Budget : {mission.budget ? `${mission.budget} ${mission.devise || ""}`.trim() : "—"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.6fr_0.4fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Détails de la mission</p>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{mission.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Public cible</p>
              <p className="text-sm text-slate-800">{mission.public_cible}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Objectif</p>
              <p className="text-sm text-slate-800">{mission.objectif}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ton souhaité</p>
              <p className="text-sm text-slate-800">{mission.ton}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rôles & infos pratiques</p>
          {isClient && <p className="text-sm text-slate-700">Tu es le client de cette mission.</p>}
          {isRedacteur && <p className="text-sm text-slate-700">Tu es le rédacteur assigné sur cette mission.</p>}
          {!isClient && !isRedacteur && (
            <p className="text-sm text-slate-700">Tu consultes cette mission en mode lecture.</p>
          )}
          <div className="space-y-2 text-sm text-slate-700">
            <p>Client : {mission.clientName}</p>
            <p>Rédacteur : {mission.redacteurName || "Aucun rédacteur assigné"}</p>
          </div>
        </div>
      </div>

      <Link href="/studio/missions" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
        ← Retour au Studio de missions
      </Link>
    </div>
  );
}

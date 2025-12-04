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

const API = `${INNOVA_API_BASE.replace(/(\/innova\/api)+/g, "/innova/api")}/studio-missions`;
const AUTH_ME = `${INNOVA_API_BASE.replace(/(\/innova\/api)+/g, "/innova/api")}/auth/me`;

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
  const [currentUserId, setCurrentUserId] = useState("");
  const [mission, setMission] = useState<Mission | null>(null);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithFallback(AUTH_ME, { cache: "no-store", credentials: "include" });
        if (res.ok) {
          const me = await res.json();
          const uid = me?.id || me?._id;
          if (uid) setCurrentUserId(uid);
        }
      } catch (err) {
        console.warn("Impossible de récupérer l'utilisateur connecté", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!missionId) return;
    (async () => {
      try {
        const res = await fetchWithFallback(`${API}/${missionId}`, { credentials: "include" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setMission(mapMission(data));
        try {
          const draftRes = await fetchWithFallback(`${API}/${missionId}/draft`, { credentials: "include" });
          if (draftRes.ok) {
            const draftData = await draftRes.json();
            setPlan(draftData.plan || "");
            setDraft(draftData.draft || "");
          }
        } catch (err) {
          console.warn("Impossible de charger le brouillon", err);
        }
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
  const canEdit = isRedacteur || isClient;

  const handleGenerate = async () => {
    if (!missionId) return;
    setGenerating(true);
    setFeedback("");
    try {
      const res = await fetchWithFallback(`${API}/${missionId}/prepare`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPlan(data.plan || "");
      setDraft(data.draft || "");
      setFeedback("Contenu généré avec succès.");
    } catch (err) {
      console.error(err);
      setFeedback("La génération a échoué. Merci de réessayer.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!missionId) return;
    setSaving(true);
    setFeedback("");
    try {
      const res = await fetchWithFallback(`${API}/${missionId}/draft`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, draft }),
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      setFeedback("Brouillon sauvegardé.");
    } catch (err) {
      console.error(err);
      setFeedback("Impossible de sauvegarder le brouillon.");
    } finally {
      setSaving(false);
    }
  };

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

      {canEdit && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Espace de rédaction</p>
              <p className="text-sm text-slate-600">
                Utilise CHATLAYA pour générer un plan et un brouillon, puis adapte le texte avant de le soumettre au client.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Type : {mission.type} • Objectif : {mission.objectif} • Ton : {mission.ton}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow ${
                  generating ? "bg-slate-400" : "bg-sky-600 hover:bg-sky-700"
                }`}
              >
                {generating ? "Génération en cours..." : "Préparer avec CHATLAYA"}
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className={`rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm ${
                  saving ? "text-slate-400" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {saving ? "Sauvegarde..." : "Sauvegarder le brouillon"}
              </button>
            </div>
          </div>

          {feedback && <p className="text-sm font-semibold text-slate-700">{feedback}</p>}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Plan proposé</p>
              <div className="mt-2 min-h-[180px] whitespace-pre-wrap text-sm text-slate-800">
                {plan ? plan : "Le plan de l’article apparaîtra ici après la génération."}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-inner">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Brouillon du rédacteur</p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="mt-2 h-52 w-full resize-vertical rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none"
                placeholder='Commence à rédiger ici ou clique sur "Préparer avec CHATLAYA".'
              />
            </div>
          </div>
        </div>
      )}

      <Link href="/studio/missions" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
        ← Retour au Studio de missions
      </Link>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
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

const TYPES = [
  "Article de blog",
  "Page de site",
  "Fiche produit",
  "Post réseaux sociaux",
  "Email / newsletter",
  "Annonce d’opportunité",
  "Autre",
];

const OBJECTIFS = ["Informer", "Vendre", "Recruter", "Mobiliser", "Autre"];
const TONS = ["Professionnel", "Simple", "Motivant", "Institutionnel", "Autre"];
const API = `${INNOVA_API_BASE.replace(/(\/innova\/api)+/g, "/innova/api")}/studio-missions`;

export default function StudioMissionsPage() {
  const [tab, setTab] = useState<"client" | "redacteur">("client");
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    titre: "",
    type: "",
    description: "",
    public_cible: "",
    objectif: "",
    ton: "",
    budget: "",
    devise: "",
    deadline: "",
  });
  const currentUserId = "me-user"; // placeholder utilisateur connecté
  const currentUserName = "Moi (démonstration)";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API, { credentials: "include" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setMissions(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const resetForm = () => {
    setForm({
      titre: "",
      type: "",
      description: "",
      public_cible: "",
      objectif: "",
      ton: "",
      budget: "",
      devise: "",
      deadline: "",
    });
    setErrors({});
    setShowForm(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.titre.trim()) e.titre = "Requis";
    if (!form.type.trim()) e.type = "Requis";
    if (!form.description.trim()) e.description = "Requis";
    if (!form.public_cible.trim()) e.public_cible = "Requis";
    if (!form.objectif.trim()) e.objectif = "Requis";
    if (!form.ton.trim()) e.ton = "Requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    if (!validate()) return;
    (async () => {
      try {
        const payload = {
          titre: form.titre.trim(),
          type: form.type.trim(),
          description: form.description.trim(),
          public_cible: form.public_cible.trim(),
          objectif: form.objectif.trim(),
          ton: form.ton.trim(),
          budget: form.budget.trim() || undefined,
          devise: form.devise.trim() || undefined,
          deadline: form.deadline || undefined,
          client_id: currentUserId,
          client_name: currentUserName,
        };
        const res = await fetch(API, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        const created = await res.json();
        setMissions((prev) => [created, ...prev]);
        setSuccess("Mission créée avec succès.");
        resetForm();
      } catch (err) {
        console.error(err);
      }
    })();
  };

  const missionsClient = useMemo(() => missions, [missions]);
  const missionsOuvertes = useMemo(
    () => missions.filter((m) => m.statut === "Ouverte" && m.redacteurId !== currentUserId),
    [missions]
  );
  const missionsRedacteur = useMemo(
    () => missions.filter((m) => m.redacteurId === currentUserId),
    [missions]
  );

  const handleAssign = (id: string) => {
    setSuccess("");
    (async () => {
      try {
        const res = await fetch(`${API}/${id}/assign`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ redacteur_id: currentUserId, redacteur_name: currentUserName }),
        });
        if (!res.ok) throw new Error(await res.text());
        const updated = await res.json();
        setMissions((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        setSuccess("Mission assignée avec succès.");
      } catch (err) {
        console.error(err);
        setSuccess("La mission n'est plus disponible.");
        // reload state
        try {
          const res = await fetch(API, { credentials: "include" });
          if (res.ok) {
            setMissions(await res.json());
          }
        } catch (e) {
          console.error(e);
        }
      }
    })();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-sky-50/30 to-white px-4 py-8 sm:px-6 lg:px-10 space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">CHATLAYA Studio</p>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Studio de missions</h1>
            <p className="text-sm text-slate-600">
              Publie des missions de contenu, laisse les rédacteurs les prendre en charge, livrer et faire valider.
            </p>
          </div>
        </div>

        <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-700 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("client")}
            className={`px-4 py-2 rounded-full transition ${
              tab === "client" ? "bg-white shadow text-slate-900" : "text-slate-600"
            }`}
          >
            Côté client
          </button>
          <button
            type="button"
            onClick={() => setTab("redacteur")}
            className={`px-4 py-2 rounded-full transition ${
              tab === "redacteur" ? "bg-white shadow text-slate-900" : "text-slate-600"
            }`}
          >
            Côté rédacteur
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
        {tab === "client" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 transition"
              >
                Créer une mission
              </button>
              {success && <span className="text-sm text-emerald-600">{success}</span>}
            </div>

            {showForm && (
              <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-700">
                    Titre de la mission *
                    <input
                      value={form.titre}
                      onChange={(e) => setForm((prev) => ({ ...prev, titre: e.target.value }))}
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
                        errors.titre ? "border-rose-300" : "border-slate-200"
                      }`}
                      placeholder="Article de blog sur CHATLAYA Studio"
                    />
                    {errors.titre && <p className="text-xs text-rose-600 mt-1">{errors.titre}</p>}
                  </label>
                  <label className="text-sm text-slate-700">
                    Type de contenu *
                    <select
                      value={form.type}
                      onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
                        errors.type ? "border-rose-300" : "border-slate-200"
                      }`}
                    >
                      <option value="">Sélectionner...</option>
                      {TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {errors.type && <p className="text-xs text-rose-600 mt-1">{errors.type}</p>}
                  </label>
                </div>

                <label className="text-sm text-slate-700">
                  Description détaillée *
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
                      errors.description ? "border-rose-300" : "border-slate-200"
                    }`}
                    rows={4}
                    placeholder="Décris précisément le besoin, les livrables, ton et longueur..."
                  />
                  {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description}</p>}
                </label>

                <label className="text-sm text-slate-700">
                  Public cible *
                  <input
                    value={form.public_cible}
                    onChange={(e) => setForm((prev) => ({ ...prev, public_cible: e.target.value }))}
                    className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
                      errors.public_cible ? "border-rose-300" : "border-slate-200"
                    }`}
                    placeholder="Étudiants, clients B2B, etc."
                  />
                  {errors.public_cible && <p className="text-xs text-rose-600 mt-1">{errors.public_cible}</p>}
                </label>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="text-sm text-slate-700">
                    Objectif *
                    <select
                      value={form.objectif}
                      onChange={(e) => setForm((prev) => ({ ...prev, objectif: e.target.value }))}
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
                        errors.objectif ? "border-rose-300" : "border-slate-200"
                      }`}
                    >
                      <option value="">Sélectionner...</option>
                      {OBJECTIFS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    {errors.objectif && <p className="text-xs text-rose-600 mt-1">{errors.objectif}</p>}
                  </label>
                  <label className="text-sm text-slate-700">
                    Ton souhaité *
                    <select
                      value={form.ton}
                      onChange={(e) => setForm((prev) => ({ ...prev, ton: e.target.value }))}
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${
                        errors.ton ? "border-rose-300" : "border-slate-200"
                      }`}
                    >
                      <option value="">Sélectionner...</option>
                      {TONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {errors.ton && <p className="text-xs text-rose-600 mt-1">{errors.ton}</p>}
                  </label>
                  <label className="text-sm text-slate-700">
                    Date limite (optionnel)
                    <input
                      type="date"
                      value={form.deadline}
                      onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-700">
                    Budget (optionnel)
                    <input
                      type="number"
                      value={form.budget}
                      onChange={(e) => setForm((prev) => ({ ...prev, budget: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="15000"
                    />
                  </label>
                  <label className="text-sm text-slate-700">
                    Devise (optionnel)
                    <input
                      value={form.devise}
                      onChange={(e) => setForm((prev) => ({ ...prev, devise: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="XOF, EUR..."
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 transition"
                  >
                    Enregistrer la mission
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Mes missions</p>
              </div>
              {missionsClient.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">
                  Tu n&apos;as encore publié aucune mission. La liste de tes missions apparaîtra ici.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm text-slate-700">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.1em] text-slate-500">
                        <th className="py-2 pr-4">Titre</th>
                        <th className="py-2 pr-4">Type</th>
                        <th className="py-2 pr-4">Statut</th>
                        <th className="py-2 pr-4">Date limite</th>
                        <th className="py-2 pr-4">Budget</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {missionsClient.map((m) => (
                        <tr key={m.id}>
                          <td className="py-2 pr-4 font-semibold text-slate-900">{m.titre}</td>
                          <td className="py-2 pr-4">{m.type}</td>
                          <td className="py-2 pr-4">
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                              {m.statut}
                            </span>
                          </td>
                          <td className="py-2 pr-4">{m.deadline || "—"}</td>
                          <td className="py-2 pr-4">
                            {m.budget ? `${m.budget} ${m.devise || ""}`.trim() : "—"}
                          </td>
                          <td className="py-2">
                            <Link className="text-sky-700 text-sm font-semibold hover:underline" href={`/studio/missions/${m.id}`}>
                              Voir
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Missions disponibles</p>
              </div>
              {missionsOuvertes.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">Aucune mission n&apos;est disponible pour le moment.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm text-slate-700">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.1em] text-slate-500">
                        <th className="py-2 pr-4">Titre</th>
                        <th className="py-2 pr-4">Type</th>
                        <th className="py-2 pr-4">Date limite</th>
                        <th className="py-2 pr-4">Budget</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {missionsOuvertes.map((m) => (
                        <tr key={m.id}>
                          <td className="py-2 pr-4 font-semibold text-slate-900">{m.titre}</td>
                          <td className="py-2 pr-4">{m.type}</td>
                          <td className="py-2 pr-4">{m.deadline || "—"}</td>
                          <td className="py-2 pr-4">
                            {m.budget ? `${m.budget} ${m.devise || ""}`.trim() : "—"}
                          </td>
                          <td className="py-2">
                            <button
                              onClick={() => handleAssign(m.id)}
                              className="text-sm font-semibold text-sky-700 hover:underline"
                            >
                              Prendre la mission
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">Mes missions (rédacteur)</p>
              {missionsRedacteur.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">Tu n&apos;as pas encore pris de mission.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm text-slate-700">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.1em] text-slate-500">
                        <th className="py-2 pr-4">Titre</th>
                        <th className="py-2 pr-4">Type</th>
                        <th className="py-2 pr-4">Statut</th>
                        <th className="py-2 pr-4">Date limite</th>
                        <th className="py-2 pr-4">Budget</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {missionsRedacteur.map((m) => (
                        <tr key={m.id}>
                          <td className="py-2 pr-4 font-semibold text-slate-900">{m.titre}</td>
                          <td className="py-2 pr-4">{m.type}</td>
                          <td className="py-2 pr-4">
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 border border-amber-100">
                              En cours
                            </span>
                          </td>
                          <td className="py-2 pr-4">{m.deadline || "—"}</td>
                          <td className="py-2 pr-4">
                            {m.budget ? `${m.budget} ${m.devise || ""}`.trim() : "—"}
                          </td>
                          <td className="py-2">
                            <Link className="text-sky-700 text-sm font-semibold hover:underline" href={`/studio/missions/${m.id}`}>
                              Voir
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <a href="/studio" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
        ← Retour à CHATLAYA Studio
      </a>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { apiMe, apiMetrics } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [goal, setGoal] = useState("find_missions");
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/onboarding");
    }
  }, [loading, router, user]);

  function toggleSkill(s: string) {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function finish() {
    if (!userId) return;
    await apiMe.upsertProfile({ user_id: userId, country, skills, goal });
    await apiMetrics.event("onboarding_finished", { country, skills, goal }, userId);
    window.location.href = "/me/recommendations";
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Bienvenue — configurons votre profil</h1>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 1 && (
          <section className="space-y-4">
            <p className="text-sm text-slate-600">Étape 1/3 — Votre pays</p>
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Ex: CI" className="w-full rounded-xl border border-slate-300 px-4 py-2" />
            <div className="flex justify-end">
              <button onClick={() => setStep(2)} className="btn-primary">Continuer</button>
            </div>
          </section>
        )}
        {step === 2 && (
          <section className="space-y-4">
            <p className="text-sm text-slate-600">Étape 2/3 — Compétences (multi)</p>
            <div className="flex flex-wrap gap-2">
              {["data","bi","python","react","frontend","field","survey"].map((s) => (
                <button key={s} type="button" onClick={() => toggleSkill(s)} className={`rounded-full border px-3 py-1 text-sm ${skills.includes(s) ? "border-sky-300 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600"}`}>{s}</button>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">Retour</button>
              <button onClick={() => setStep(3)} className="btn-primary">Continuer</button>
            </div>
          </section>
        )}
        {step === 3 && (
          <section className="space-y-4">
            <p className="text-sm text-slate-600">Étape 3/3 — Objectif</p>
            <div className="flex gap-2">
              <label className={`rounded-2xl border px-4 py-2 ${goal === "find_missions" ? "border-sky-300 bg-sky-50" : "border-slate-200"}`}>
                <input type="radio" name="goal" className="mr-2" checked={goal === "find_missions"} onChange={() => setGoal("find_missions")} />Trouver des missions
              </label>
              <label className={`rounded-2xl border px-4 py-2 ${goal === "publish_needs" ? "border-sky-300 bg-sky-50" : "border-slate-200"}`}>
                <input type="radio" name="goal" className="mr-2" checked={goal === "publish_needs"} onChange={() => setGoal("publish_needs")} />Publier des besoins
              </label>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">Retour</button>
              <button onClick={finish} className="btn-primary">Terminer</button>
            </div>
          </section>
        )}
      </div>
      <p className="mt-4 text-sm text-slate-500">Vous pourrez modifier ces préférences plus tard.</p>
      <p className="mt-2 text-sm"><Link className="text-sky-600" href="/privacy">Confidentialité</Link></p>
    </main>
  );
}

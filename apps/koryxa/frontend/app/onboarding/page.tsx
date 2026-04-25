"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiMe, apiMetrics } from "@/lib/api";

const SKILLS = ["data", "bi", "python", "react", "frontend", "field", "survey"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [goal, setGoal] = useState("find_missions");
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/onboarding");
  }, [loading, router, user]);

  function toggleSkill(skill: string) {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((item) => item !== skill) : [...prev, skill]));
  }

  async function finish() {
    if (!userId) return;
    await apiMe.upsertProfile({ user_id: userId, country, skills, goal });
    await apiMetrics.event("onboarding_finished", { country, skills, goal }, userId);
    window.location.href = "/me/recommendations";
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-[30px] border border-slate-900/80 bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] p-6 text-white shadow-[0_28px_70px_rgba(2,6,23,0.3)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200">Onboarding</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">Poser votre profil en 3 etapes.</h1>
            <ol className="mt-6 grid gap-3">
              {[
                { id: 1, title: "Pays", caption: "Situer votre contexte." },
                { id: 2, title: "Competences", caption: "Montrer votre terrain de jeu." },
                { id: 3, title: "Objectif", caption: "Choisir le cap principal." },
              ].map((item) => (
                <li key={item.id} className={`rounded-[22px] border px-4 py-4 ${item.id === step ? "border-sky-300/40 bg-sky-500/12" : item.id < step ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-300">{item.caption}</p>
                </li>
              ))}
            </ol>
          </section>
        </aside>

        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          {step === 1 ? (
            <div className="grid gap-4">
              <h2 className="text-2xl font-semibold text-slate-950">Quel pays faut-il prendre en compte ?</h2>
              <p className="text-sm leading-7 text-slate-600">Ce point aide a contextualiser votre environnement, votre marche et certaines recommandations.</p>
              <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Exemple : CI" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
              <div className="flex justify-end">
                <button onClick={() => setStep(2)} className="btn-primary">Continuer</button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4">
              <h2 className="text-2xl font-semibold text-slate-950">Quelles competences voulez-vous mettre en avant ?</h2>
              <p className="text-sm leading-7 text-slate-600">Choisissez seulement les domaines qui vous representent vraiment.</p>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <button key={skill} type="button" onClick={() => toggleSkill(skill)} className={`rounded-full border px-3 py-2 text-sm ${skills.includes(skill) ? "border-sky-300 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600"}`}>
                    {skill}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="btn-secondary">Retour</button>
                <button onClick={() => setStep(3)} className="btn-primary">Continuer</button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4">
              <h2 className="text-2xl font-semibold text-slate-950">Quel est votre objectif principal ?</h2>
              <p className="text-sm leading-7 text-slate-600">Le but est de choisir la premiere direction utile, pas de tout decider maintenant.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`rounded-2xl border px-4 py-4 ${goal === "find_missions" ? "border-sky-300 bg-sky-50" : "border-slate-200"}`}>
                  <input type="radio" name="goal" className="mr-2" checked={goal === "find_missions"} onChange={() => setGoal("find_missions")} />
                  Trouver des missions
                </label>
                <label className={`rounded-2xl border px-4 py-4 ${goal === "publish_needs" ? "border-sky-300 bg-sky-50" : "border-slate-200"}`}>
                  <input type="radio" name="goal" className="mr-2" checked={goal === "publish_needs"} onChange={() => setGoal("publish_needs")} />
                  Publier des besoins
                </label>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="btn-secondary">Retour</button>
                <button onClick={finish} className="btn-primary">Terminer</button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <p className="mt-4 text-sm text-slate-500">Vous pourrez modifier ces preferences plus tard.</p>
      <p className="mt-2 text-sm"><Link className="text-sky-600" href="/legal/confidentialite">Confidentialite</Link></p>
    </main>
  );
}

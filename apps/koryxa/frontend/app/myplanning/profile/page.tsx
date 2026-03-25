"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import LogoutButton from "@/components/auth/LogoutButton";
import { inferUserPlan } from "@/config/planFeatures";
import { INNOVA_API_BASE } from "@/lib/env";

type WorkspaceProfile = {
  user_id: string;
  workspace_role?: "demandeur" | "prestataire" | null;
  updated_at?: string | null;
  demandeur?: {
    display_name: string;
    organization?: string | null;
    languages?: string[];
    country?: string | null;
    city?: string | null;
    remote_ok?: boolean;
    preferred_channels?: string[];
    notes?: string | null;
    timezone?: string | null;
  } | null;
  prestataire?: {
    display_name: string;
    bio: string;
    skills?: string[];
    languages?: string[];
    availability?: string | null;
    availability_timezone?: string | null;
    rate_min?: number | null;
    rate_max?: number | null;
    currency?: string | null;
    zones?: string[];
    remote?: boolean;
    channels?: string[];
  } | null;
};

function computeProfileReadiness(profile: WorkspaceProfile | null): { score: number; label: string } {
  if (!profile) return { score: 34, label: "Profil à structurer" };

  const demandeur = profile.demandeur;
  const prestataire = profile.prestataire;
  let score = 28;

  if (demandeur?.display_name) score += 8;
  if (demandeur?.organization) score += 8;
  if ((demandeur?.languages?.length || 0) > 0) score += 6;
  if (demandeur?.country) score += 6;
  if ((demandeur?.preferred_channels?.length || 0) > 0) score += 4;

  if (prestataire?.display_name) score += 8;
  if (prestataire?.bio) score += 10;
  if ((prestataire?.skills?.length || 0) >= 3) score += 10;
  if ((prestataire?.languages?.length || 0) > 0) score += 6;
  if ((prestataire?.zones?.length || 0) > 0) score += 6;
  if (prestataire?.availability) score += 6;
  if (prestataire?.rate_min || prestataire?.rate_max) score += 4;

  score = Math.min(score, 96);

  if (score >= 78) return { score, label: "Profil activable" };
  if (score >= 58) return { score, label: "Profil crédible" };
  return { score, label: "Profil à renforcer" };
}

function formatRole(role?: string | null): string {
  if (role === "prestataire") return "Capacité / talent";
  if (role === "demandeur") return "Entreprise / demandeur";
  return "Rôle à préciser";
}

function formatDate(value?: string | null): string {
  if (!value) return "Mise à jour non connue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Mise à jour non connue";
  return `Mis à jour le ${date.toLocaleDateString("fr-FR")}`;
}

export default function MyPlanningProfilePage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const isAuthenticated = !!user?.email;

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user?.email) return;
      setProfileLoading(true);
      setProfileError(null);
      try {
        const response = await fetch(`${INNOVA_API_BASE}/profiles/me`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) throw new Error("Impossible de charger le profil KORYXA.");
        const payload = (await response.json()) as WorkspaceProfile;
        if (active) setProfile(payload);
      } catch (error) {
        if (active) setProfileError(error instanceof Error ? error.message : "Erreur inattendue.");
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [user?.email]);

  const displayName = useMemo(() => {
    const full = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
    return (
      profile?.prestataire?.display_name ||
      profile?.demandeur?.display_name ||
      full ||
      user?.email ||
      "Mon profil KORYXA"
    );
  }, [profile, user]);

  const plan = useMemo(() => inferUserPlan(user), [user]);
  const readiness = useMemo(() => computeProfileReadiness(profile), [profile]);

  const keySignals = useMemo(() => {
    const signals: string[] = [];
    if (profile?.prestataire?.bio) signals.push("Positionnement talent renseigné");
    if ((profile?.prestataire?.skills?.length || 0) > 0) signals.push(`${profile?.prestataire?.skills?.length} compétence(s) déclarée(s)`);
    if (profile?.demandeur?.organization) signals.push(`Organisation: ${profile.demandeur.organization}`);
    if ((profile?.demandeur?.preferred_channels?.length || 0) > 0) {
      signals.push(`${profile?.demandeur?.preferred_channels?.length} canal(aux) entreprise`);
    }
    if ((profile?.prestataire?.zones?.length || 0) > 0) signals.push(`${profile?.prestataire?.zones?.length} zone(s) d'intervention`);
    return signals.slice(0, 4);
  }, [profile]);

  const topSkills = useMemo(() => (profile?.prestataire?.skills || []).slice(0, 8), [profile]);

  const activationBlocks = useMemo(
    () => [
      {
        title: "Trajectoire & validation",
        detail:
          "Votre profil doit pouvoir se relier à une trajectoire, à des preuves, à un niveau de validation et à un cockpit de progression.",
        href: "/myplanning/app/koryxa",
        label: "Ouvrir le cockpit trajectoire",
      },
      {
        title: "Opportunités & missions",
        detail:
          "Le profil vérifié KORYXA sert aussi à rendre votre activation plus crédible sur des opportunités, missions ou stages.",
        href: "/opportunites",
        label: "Voir le pipeline d'activation",
      },
      {
        title: "Réseau IA & partenaires",
        detail:
          "Le réseau communautaire et les formateurs partenaires servent à accélérer échanges, supervision et visibilité métier.",
        href: "/communaute",
        label: "Ouvrir le réseau IA",
      },
    ],
    [],
  );

  if (loading) {
    return (
      <div className="grid gap-6">
        <section className="h-44 animate-pulse rounded-[32px] bg-white" />
        <section className="h-80 animate-pulse rounded-[32px] bg-white" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="rounded-[34px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Profil KORYXA</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Connectez-vous pour activer votre profil vérifié</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Cet écran ne sert pas seulement à afficher votre compte. Il relie identité, positionnement, trajectoire,
          opportunités et signaux d’activation dans l’écosystème KORYXA.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/myplanning/login?redirect=%2Fmyplanning%2Fprofile" className="btn-primary">
            Se connecter
          </Link>
          <Link href="/myplanning/signup?redirect=%2Fmyplanning%2Fprofile" className="btn-secondary">
            Créer un compte
          </Link>
        </div>
      </section>
    );
  }

  return (
    <main className="grid gap-6">
      <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(237,247,255,0.96))] p-6 shadow-[0_24px_72px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-lg font-bold text-sky-700">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Profil vérifié KORYXA</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">{displayName}</h1>
                <p className="mt-2 text-sm text-slate-600">{user?.email}</p>
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              {profile?.prestataire?.bio ||
                profile?.demandeur?.notes ||
                "Ce profil doit devenir votre couche visible KORYXA: identité, capacités, validation, visibilité métier et activation potentielle sur des opportunités réelles."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/myplanning/app/koryxa" className="btn-primary">
                Ouvrir ma trajectoire
              </Link>
              <Link href="/opportunites" className="btn-secondary">
                Voir les opportunités
              </Link>
              <Link href="/account/role" className="btn-secondary">
                Ajuster mon rôle
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Readiness profil", value: `${readiness.score}/100`, detail: readiness.label },
              { label: "Plan", value: plan.toUpperCase(), detail: "Niveau d'accès courant" },
              { label: "Rôle actif", value: formatRole(profile?.workspace_role || user?.workspace_role), detail: formatDate(profile?.updated_at) },
              {
                label: "Signal principal",
                value: keySignals[0] || "Profil à compléter",
                detail: topSkills.length > 0 ? `${topSkills.length} compétence(s) visibles` : "Capacités encore peu décrites",
              },
            ].map((item) => (
              <article key={item.label} className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Structure du profil</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Entreprise / demandeur</p>
              <p className="mt-3 text-sm font-semibold text-slate-950">{profile?.demandeur?.organization || "Organisation non renseignée"}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {profile?.demandeur?.display_name || "Aucun positionnement demandeur encore structuré."}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                {(profile?.demandeur?.languages || []).join(" • ") || "Langues non précisées"}
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Capacité / talent</p>
              <p className="mt-3 text-sm font-semibold text-slate-950">
                {profile?.prestataire?.availability || "Disponibilité non précisée"}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {profile?.prestataire?.display_name || "Aucun positionnement prestataire encore structuré."}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                {(profile?.prestataire?.zones || []).join(" • ") || "Zones d'intervention non précisées"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Compétences visibles</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {topSkills.length > 0 ? (
                topSkills.map((skill) => (
                  <span key={skill} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
                  Compétences à compléter
                </span>
              )}
            </div>
          </div>

          {profileError ? <p className="mt-5 text-sm font-medium text-rose-600">{profileError}</p> : null}
          {profileLoading ? <p className="mt-5 text-sm text-slate-500">Chargement des détails KORYXA…</p> : null}
        </article>

        <article className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Blocs d’activation</p>
          <div className="mt-5 grid gap-3">
            {activationBlocks.map((block) => (
              <div key={block.title} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{block.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">{block.detail}</p>
                <Link href={block.href} className="mt-4 inline-flex text-sm font-semibold text-sky-200 hover:text-white">
                  {block.label}
                </Link>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Actions utiles maintenant</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { href: "/community/messages", label: "Messages", detail: "Ouvrir les échanges directs du réseau IA." },
              { href: "/formateurs", label: "Formateurs partenaires", detail: "Voir la logique de matching et de capacité." },
              { href: "/myplanning/pricing", label: "Plan & accès", detail: "Gérer plan, accès et niveau d’activation." },
              { href: "/communaute", label: "Réseau IA", detail: "Participer aux discussions métier et cas d’usage." },
            ].map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 transition hover:border-sky-200 hover:bg-white"
              >
                <p className="text-sm font-semibold text-slate-950">{entry.label}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{entry.detail}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Compte & session</p>
          <div className="mt-5 space-y-3">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 text-sm leading-7 text-slate-600">
              Le profil KORYXA doit rester distinct d’un simple compte technique. Il sert à porter identité, valeur,
              validation, visibilité et capacité d’activation.
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/myplanning/app/koryxa-home" className="btn-secondary">
                Retour à l’accueil connecté
              </Link>
              <LogoutButton
                redirectTo="/"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
              />
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createOrg, EnterpriseApiError, listOrgs, Organization } from "@/app/myplanning/components/enterpriseApi";

function roleLabel(role: Organization["role"]): string {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}

function statusLabel(status: Organization["status"]): string {
  if (status === "active") return "Active";
  return "Trial";
}

export default function MyPlanningEnterpriseHomePage() {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user?.email;
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const loginHref = useMemo(() => "/myplanning/login?redirect=/myplanning/enterprise", []);

  const loadOrgs = useCallback(async () => {
    if (!isAuthenticated) {
      setOrgs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await listOrgs();
      setOrgs(Array.isArray(rows) ? rows : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chargement des organisations impossible";
      setError(message);
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadOrgs();
  }, [loadOrgs]);

  async function onCreateOrg(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;
    const name = orgName.trim();
    if (!name) return;

    setCreating(true);
    setError("");
    setInfo("");
    try {
      const created = await createOrg(name);
      setOrgs((prev) => [created, ...prev.filter((org) => org.id !== created.id)]);
      setOrgName("");
      setInfo("Organisation créée.");
    } catch (err) {
      if (err instanceof EnterpriseApiError && err.status === 409) {
        setError("Une organisation avec ce nom existe déjà.");
      } else {
        const message = err instanceof Error ? err.message : "Création impossible";
        setError(message);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI Enterprise</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Organisation complète + gouvernance + intégrations</h1>
        <p className="mt-2 text-sm text-slate-700">
          Team = Espaces de collaboration. Enterprise = pilotage global: multi-espaces, présence, alertes et reporting.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => void loadOrgs()}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Actualiser les organisations
            </button>
          ) : (
            <Link
              href={loginHref}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Se connecter
            </Link>
          )}
          <Link
            href="/myplanning/enterprise/demo"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Voir démo
          </Link>
          {isAuthenticated ? (
            <Link
              href="/myplanning/enterprise/onboarding"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Onboarding guidé
            </Link>
          ) : null}
        </div>
      </section>

      {authLoading ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-700">Chargement de la session...</p>
        </section>
      ) : !isAuthenticated ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Commencer avec Enterprise</h2>
          <p className="mt-2 text-sm text-slate-700">
            Connecte-toi pour créer ton organisation, puis active un premier espace avec présence et intégrations.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={loginHref}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Se connecter
            </Link>
            <Link
              href="/myplanning/signup?redirect=/myplanning/enterprise"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Créer un compte
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Créer une organisation</h2>
            </div>
            <form onSubmit={onCreateOrg} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
                placeholder="Nom de l’organisation (ex: INNOVAPLUS Groupe)"
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={creating || !orgName.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Création..." : "Créer l’organisation"}
              </button>
            </form>
            {error ? <p className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}
            {info ? <p className="mt-3 text-sm font-medium text-emerald-700">{info}</p> : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Mes organisations</h2>
              <button
                type="button"
                onClick={() => void loadOrgs()}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Actualiser
              </button>
            </div>
            {loading ? (
              <p className="mt-4 text-sm text-slate-700">Chargement des organisations...</p>
            ) : orgs.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-700">
                Aucune organisation pour le moment. Crée la première pour activer le dashboard Enterprise.
              </div>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {orgs.map((org) => (
                  <article key={org.id} className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-base font-semibold text-slate-900">{org.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">ID: {org.id}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {roleLabel(org.role)}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {statusLabel(org.status)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/myplanning/orgs/${encodeURIComponent(org.id)}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Ouvrir
                      </Link>
                      <Link
                        href={`/myplanning/enterprise/onboarding?org_id=${encodeURIComponent(org.id)}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Onboarding
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

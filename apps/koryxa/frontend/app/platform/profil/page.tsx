"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PlatformProfilPage() {
  const { user, loading } = useAuth();
  const displayName = useMemo(() => {
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
    return fullName || user?.email || "Mon profil KORYXA";
  }, [user]);
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "K";
  const roleLabel = user?.workspace_role === "prestataire"
    ? "Capacité / talent"
    : user?.workspace_role === "demandeur"
      ? "Entreprise / demandeur"
      : "Compte KORYXA";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mon Profil</h1>
        <button type="button" className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white">Modifier</button>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-sky-700">{initials}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <p className="mt-2 text-lg font-semibold text-sky-600">{roleLabel}</p>
            <p className="mt-4 text-sm text-slate-500">
              {loading ? "Chargement du compte..." : user?.email || "Compte connecté"}
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">Profil vérifié</span>
        </div>
      </section>
    </div>
  );
}

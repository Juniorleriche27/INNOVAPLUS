"use client";

import Link from "next/link";
import { ReactNode, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { hasPlanAccess, inferUserPlan, PlanTier } from "@/config/planFeatures";

type Props = {
  minPlan: PlanTier;
  featureName: string;
  children: ReactNode;
  ctaHref?: string;
};

export default function PlanGuard({ minPlan, featureName, children, ctaHref = "/myplanning/pro" }: Props) {
  const { user } = useAuth();
  const userPlan = useMemo(() => inferUserPlan(user), [user]);

  if (hasPlanAccess(userPlan, minPlan)) return <>{children}</>;

  return (
    <div className="mx-auto w-full max-w-4xl rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800">Accès limité</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">{featureName}</h1>
      <p className="mt-3 text-sm text-slate-700">Cette fonctionnalité t’aide à mieux exécuter. Disponible avec MyPlanning Pro.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={ctaHref} className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
          Voir l’offre Pro
        </Link>
        <Link href="/myplanning/app" className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Retour à l’app
        </Link>
      </div>
    </div>
  );
}

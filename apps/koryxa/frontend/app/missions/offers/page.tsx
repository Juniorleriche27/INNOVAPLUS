"use client";

import { useEffect, useState } from "react";
import { missionsApi } from "@/lib/api-client/missions";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

type OfferRow = {
  mission_id: string;
  title?: string;
  offer_id: string;
  status: string;
  expires_at?: string;
  wave?: number;
};

export default function OffersCenterPage() {
  const { user, loading } = useAuth();
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyOffer, setBusyOffer] = useState<string | null>(null);

  async function refresh() {
    if (!user) return;
    try {
      const data = await missionsApi.list("prestataire");
      setOffers(data as OfferRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les offres");
    }
  }

  useEffect(() => {
    refresh();
  }, [user]);

  async function respond(offer: OfferRow, action: "accept" | "refuse") {
    setBusyOffer(offer.offer_id);
    try {
      await missionsApi.respond(offer.mission_id, offer.offer_id, action);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusyOffer(null);
    }
  }

  if (!loading && !user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg text-slate-600">Connecte-toi comme prestataire pour voir les offres reçues.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bloc 3 — Centre des offres</p>
        <h1 className="text-3xl font-semibold text-slate-900">Offres disponibles</h1>
        <p className="text-sm text-slate-600">Réponds dans les temps. Le compteur indique le délai avant passage en Vague 2.</p>
      </div>
      {error && <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p>}
      <div className="space-y-4">
        {offers.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">Aucune offre pour le moment.</p>
        ) : (
          offers.map((offer) => {
            const expires = offer.expires_at ? new Date(offer.expires_at).getTime() : null;
            const remaining = expires ? Math.max(0, Math.floor((expires - Date.now()) / 60000)) : null;
            return (
              <div key={offer.offer_id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{offer.title}</h2>
                    <p className="text-xs text-slate-500">Vague {offer.wave ?? 1} · expiration {remaining !== null ? `${remaining} min` : "--"}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{offer.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => respond(offer, "accept")}
                    disabled={busyOffer === offer.offer_id || offer.status !== "pending"}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => respond(offer, "refuse")}
                    disabled={busyOffer === offer.offer_id || offer.status !== "pending"}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                  >
                    Refuser
                  </button>
                  <Link href={`/missions/track/${offer.mission_id}`} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                    Voir le brief
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}

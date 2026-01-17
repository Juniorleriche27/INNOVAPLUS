"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { missionsApi } from "@/lib/api-client/missions";
import { useAuth } from "@/components/auth/AuthProvider";
import { INNOVA_API_BASE } from "@/lib/env";

type OfferRow = {
  mission_id: string;
  title?: string;
  offer_id: string;
  prestataire_id?: string;
  status: string;
  expires_at?: string;
  wave?: number;
};

export default function OffersCenterPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyOffer, setBusyOffer] = useState<string | null>(null);
  const [isPublicFeed, setIsPublicFeed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      if (user) {
        const data = await missionsApi.list("prestataire");
        setOffers(data as OfferRow[]);
        setIsPublicFeed(false);
      } else {
        // fallback public demo feed
        const res = (await fetch(`${INNOVA_API_BASE}/missions/offers/public`).then((r) => r.json())) as {
          items?: OfferRow[];
        };
        setOffers(res.items || []);
        setIsPublicFeed(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les offres");
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] px-4 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Bloc 3</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Centre des offres</h1>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                Consultez vos invitations prestataires, acceptez dans les temps et suivez l&apos;avancement de chaque
                mission jusqu&apos;à la signature.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Vague 1 → Vague 2</p>
              <p className="text-xs text-slate-500">Les offres non répondues basculent automatiquement après expiration.</p>
            </div>
          </div>
        </header>

        {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {!user && (
          <div className="rounded-[28px] border border-slate-200 bg-amber-50 px-6 py-4 text-sm text-amber-800 shadow-sm">
            Vue publique de démonstration (données d’offres prestataires). Connectez-vous pour voir vos invitations réelles.
          </div>
        )}

        <section className="space-y-4">
          {offers.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center text-slate-500 shadow-sm">
              Aucune offre pour le moment. Revenez un peu plus tard ou contactez le support pour rejoindre la
              prochaine vague.
            </div>
            ) : (
              offers.map((offer) => {
                const expires = offer.expires_at ? new Date(offer.expires_at).getTime() : null;
                const remaining = expires ? Math.max(0, Math.floor((expires - Date.now()) / 60000)) : null;
                return (
                  <article
                    key={offer.offer_id}
                    className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Mission {offer.mission_id} · Vague {offer.wave ?? 1}
                        </p>
                        <h2 className="text-xl font-semibold text-slate-900">{offer.title || "Opportunité sans titre"}</h2>
                        <p className="text-xs text-slate-500">
                          Expiration {remaining !== null ? `dans ${remaining} min` : "non définie"}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-600">
                        {offer.status}
                        {isPublicFeed && offer.prestataire_id ? ` · ${offer.prestataire_id}` : ""}
                      </span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => respond(offer, "accept")}
                        disabled={isPublicFeed || busyOffer === offer.offer_id || offer.status !== "pending"}
                        className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => respond(offer, "refuse")}
                        disabled={isPublicFeed || busyOffer === offer.offer_id || offer.status !== "pending"}
                        className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
                      >
                        Refuser
                      </button>
                      <Link
                        href={`/missions/track/${offer.mission_id}`}
                        className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                      >
                        Voir le brief
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
        </section>
      </div>
    </main>
  );
}

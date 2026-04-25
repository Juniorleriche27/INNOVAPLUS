"use client";

import { useEffect, useState } from "react";
import { CLIENT_INNOVA_API_BASE } from "@/lib/env";

type PublicPartner = {
  slug: string;
  type: "organisme" | "plateforme" | "coach";
  name: string;
  headline: string;
  summary: string;
  domains: string[];
  levels: string[];
  formats: string[];
  languages: string[];
  geographies: string[];
  remote: boolean;
  price_range?: string | null;
  rhythm_options: string[];
  proof_capabilities: string[];
  target_profiles: string[];
  external_url?: string | null;
  status: "draft" | "review" | "published" | "archived";
};

const PARTNER_BLOCKS = [
  {
    title: "Organismes partenaires",
    text: "Présence qualifiée avec domaine, niveaux couverts, format, langue, prix, zone géographique et modalités.",
  },
  {
    title: "Plateformes partenaires",
    text: "Ressources externes recommandables via matching, avec visibilité qualifiée et redirection possible si pertinent.",
  },
  {
    title: "Coachs indépendants",
    text: "Expertise, disponibilité, format d'accompagnement, prix et type de profil cible peuvent être intégrés dans l'écosystème.",
  },
];

export default function TrajectoryPartnersPanel() {
  const [partners, setPartners] = useState<PublicPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`${CLIENT_INNOVA_API_BASE}/trajectoire/partners/public`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Impossible de charger les partenaires.");
        }
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setPartners(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!active) return;
        setPartners([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-6 grid gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!partners.length) {
    return (
      <div className="mt-6 grid gap-3">
        {PARTNER_BLOCKS.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-semibold text-slate-950">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-3">
      {partners.map((partner) => (
        <div key={partner.slug} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-950">{partner.name}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{partner.type}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                {partner.price_range || "prix à préciser"}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                {partner.remote ? "distanciel possible" : "présentiel"}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{partner.headline}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{partner.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {partner.domains.slice(0, 3).map((item) => (
              <span key={item} className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

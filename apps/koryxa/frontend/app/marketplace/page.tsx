"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import TelemetryPing from "@/components/util/TelemetryPing";
import { INNOVA_API_BASE } from "@/lib/env";

type Offer = {
  offer_id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  tags?: string[];
  country?: string;
  price?: number;
  currency?: string;
  owner_id: string;
  owner_name?: string;
  owner_avatar?: string;
  cover_image?: string;
  contact_email?: string;
  contact_phone?: string;
  status: string;
  created_at: string;
};

type Filters = {
  country: string;
  sort: "recent" | "price" | "alpha";
};

const CATEGORY_TABS = [
  { key: "all", label: "Fil d'actualité" },
  { key: "talent", label: "Talents & experts" },
  { key: "service", label: "Services locaux" },
  { key: "product", label: "Produits physiques" },
  { key: "mission", label: "Missions en ligne" },
  { key: "agri", label: "Agriculture & agro" },
  { key: "education", label: "Éducation & mentoring" },
  { key: "bundle", label: "Bundles / packs" },
];

const COUNTRY_OPTIONS = [
  { code: "all", name: "Tous les pays" },
  { code: "SN", name: "Sénégal" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "TG", name: "Togo" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BJ", name: "Bénin" },
  { code: "ML", name: "Mali" },
  { code: "NE", name: "Niger" },
];

const CURRENCY_OPTIONS = ["USD", "EUR", "XOF", "XAF"];

const STEP_ITEMS = [
  { key: "basic", label: "1. Infos de base" },
  { key: "description", label: "2. Description" },
  { key: "pricing", label: "3. Prix & disponibilité" },
];

const INITIAL_FORM = {
  ownerName: "",
  title: "",
  description: "",
  category: "service",
  country: "SN",
  price: "",
  currency: "USD",
  tags: "",
  coverImage: "",
  contactEmail: "",
  contactPhone: "",
};

const formatPrice = (price?: number, currency?: string) => {
  if (!price) return "À discuter";
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${currency || "USD"}`;
  }
};

const formatTime = (iso: string) => {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "il y a peu";
  const diff = Date.now() - ts;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `il y a ${days}j`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `il y a ${hours}h`;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes > 0) return `il y a ${minutes}min`;
  return "à l'instant";
};

const initials = (label?: string) => {
  if (!label) return "MK";
  const parts = label.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export default function MarketplacePage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [filters, setFilters] = useState<Filters>({ country: "all", sort: "recent" });
  const [searchQuery, setSearchQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [publishing, setPublishing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string>(STEP_ITEMS[0].key);
  const [showFaq, setShowFaq] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${INNOVA_API_BASE}/marketplace/offers?status=live`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`API marketplace: ${res.status}`);
      const data = await res.json();
      setOffers(data.items || []);
      setError(null);
    } catch (err) {
      setError("Impossible de charger le marketplace pour le moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("marketplaceDraft");
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm({ ...INITIAL_FORM, ...parsed });
      }
    } catch {
      // ignore
    }
  }, []);

  const filteredOffers = useMemo(() => {
    let data = [...offers];
    if (activeCategory !== "all") {
      data = data.filter((offer) => offer.category === activeCategory);
    }
    if (filters.country !== "all") {
      data = data.filter((o) => (o.country || "").toUpperCase() === filters.country);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((offer) => {
        const bag = [offer.title, offer.description, ...(offer.tags || []), ...(offer.skills || [])]
          .join(" ")
          .toLowerCase();
        return bag.includes(q);
      });
    }
    switch (filters.sort) {
      case "price":
        data.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "alpha":
        data.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "recent":
      default:
        data.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
        break;
    }
    return data;
  }, [offers, activeCategory, filters.country, filters.sort, searchQuery]);

  const stats = useMemo(() => {
    const active = offers.filter((o) => o.status === "live").length;
    const filled = offers.filter((o) => o.status === "filled").length;
    const medianDelay = "48h";
    return { active, filled, medianDelay };
  }, [offers]);

  const canPublish =
    form.ownerName.trim().length > 2 &&
    form.title.trim().length > 3 &&
    form.description.trim().length > 20;

  const handleSaveDraft = () => {
    localStorage.setItem("marketplaceDraft", JSON.stringify(form));
    setSuccessMessage("Brouillon enregistré localement. Vous pourrez le reprendre plus tard.");
  };

  const handlePublish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPublish || publishing) return;
    setPublishing(true);
    setSuccessMessage(null);
    try {
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        skills: tags,
        tags,
        country: form.country === "all" ? undefined : form.country,
        price: form.price ? Number(form.price) : undefined,
        currency: form.currency,
        owner_id:
          `${form.ownerName}-${Date.now()}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || `public-${Date.now()}`,
        owner_name: form.ownerName.trim(),
        cover_image: form.coverImage.trim() || undefined,
        contact_email: form.contactEmail.trim() || undefined,
        contact_phone: form.contactPhone.trim() || undefined,
      };
      const res = await fetch(`${INNOVA_API_BASE}/marketplace/offers/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Echec de publication");
      }
      setForm(INITIAL_FORM);
      setComposerOpen(false);
      setSuccessMessage("Offre publiée. Elle s'affiche maintenant dans le fil !");
      fetchOffers();
    } catch (err) {
      setError("Publication impossible. Vérifiez les champs et réessayez.");
    } finally {
      setPublishing(false);
    }
  };

  const renderStatusBanner = () => {
    if (!error) return null;
    return (
      <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {error.includes("charger")
              ? "Aucune offre disponible pour le moment ou le serveur répond lentement."
              : error}
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchOffers}
              className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
            >
              Réessayer
            </button>
            <a
              className="rounded-full border border-transparent px-3 py-1 text-xs font-semibold text-amber-700 hover:underline"
              href="mailto:support@innovaplus.africa"
            >
              Écrire au support
            </a>
          </div>
        </div>
      </div>
    );
  };

  const renderComposer = () => (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
          {initials(form.ownerName || "Marketplace")}
        </div>
        <button
          type="button"
          onClick={() => setComposerOpen((v) => !v)}
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-left text-sm text-slate-500 hover:border-sky-200"
        >
          Partager un talent, un service ou un produit...
        </button>
      </div>
      {composerOpen && (
        <form onSubmit={handlePublish} className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-3 pb-1">
            {STEP_ITEMS.map((step, index) => (
              <div key={step.key} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <div
                  className={clsx(
                    "flex h-6 w-6 items-center justify-center rounded-full border",
                    activeStep === step.key ? "border-sky-500 text-sky-600" : "border-slate-200"
                  )}
                >
                  {index + 1}
                </div>
                <span className={activeStep === step.key ? "text-slate-800" : "text-slate-400"}>{step.label}</span>
                {index < STEP_ITEMS.length - 1 && <div className="h-px w-6 bg-slate-200" />}
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Votre nom public *</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                onFocus={() => setActiveStep("basic")}
                placeholder="Ex. : Collectif de jeunes, Nom de la boutique..."
                required
              />
              <p className="mt-1 text-xs text-slate-500">Votre nom ou celui de votre structure sera visible publiquement.</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Catégorie *</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                onFocus={() => setActiveStep("basic")}
              >
                {CATEGORY_TABS.filter((tab) => tab.key !== "all").map((tab) => (
                  <option key={tab.key} value={tab.key}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Titre *</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onFocus={() => setActiveStep("basic")}
              placeholder="Ex. : Développeur React, Pack marketing, Atelier couture, Solution mobile money..."
              required
            />
            <p className="mt-1 text-xs text-slate-500">Un titre clair aide les membres à comprendre rapidement votre proposition.</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Description *</label>
            <textarea
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              onFocus={() => setActiveStep("description")}
              placeholder="Détaillez la proposition de valeur, le format, les livrables, le contexte local..."
              required
            />
            <p className="mt-1 text-xs text-slate-500">Décrivez les besoins, les ressources mobilisées et le mode de collaboration.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-700">Pays</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                onFocus={() => setActiveStep("pricing")}
              >
                {COUNTRY_OPTIONS.filter((opt) => opt.code !== "all").map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Budget indicatif</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                onFocus={() => setActiveStep("pricing")}
                placeholder="Ex : 2500"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Devise</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                onFocus={() => setActiveStep("pricing")}
              >
                {CURRENCY_OPTIONS.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Mots-clés (séparés par des virgules)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="Ex. : mobile money, fablab, couture, maraîchage..."
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Image ou visuel (URL)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Email de contact</label>
              <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              placeholder="contact@exemple.org"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Téléphone / WhatsApp</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              placeholder="+221..."
            />
          </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
              onClick={() => setComposerOpen(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-200 hover:text-sky-700"
            >
              Enregistrer comme brouillon
            </button>
            <button
              type="submit"
              disabled={!canPublish || publishing}
              className="rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {publishing ? "Publication..." : "Publier"}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <TelemetryPing name="view_marketplace" />
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Communauté</p>
            <h1 className="text-3xl font-semibold text-slate-900">Marketplace social</h1>
            <p className="text-sm text-slate-500">
              Diffusez vos talents, services, produits ou missions et activez la communauté KORYXA.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchOffers}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-200 hover:text-sky-700"
            >
              Actualiser
            </button>
            <button
              onClick={() => setComposerOpen(true)}
              className="rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700"
            > 
              Publier une offre
            </button>
          </div>
        </header>

        <section className="mb-4 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Comment ça marche ?</p>
          <div className="mt-2 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50/80 p-3">
              <p className="font-semibold text-slate-800">1 · Publier</p>
              <p className="text-slate-600">Ajoutez un talent, service ou produit en quelques champs.</p>
            </div>
            <div className="rounded-2xl bg-slate-50/80 p-3">
              <p className="font-semibold text-slate-800">2 · KORYXA recommande</p>
              <p className="text-slate-600">Le fil met en avant votre offre auprès des membres pertinents.</p>
            </div>
            <div className="rounded-2xl bg-slate-50/80 p-3">
              <p className="font-semibold text-slate-800">3 · Mission confirmée</p>
              <p className="text-slate-600">Les contacts intéressés vous écrivent, vous concluez la mission.</p>
            </div>
          </div>
        </section>

        {renderStatusBanner()}
        {successMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* KPI */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Offres actives", value: stats.active, accent: "text-sky-600", tooltip: "Nombre d'annonces visibles actuellement." },
            { label: "Missions / ventes confirmées", value: stats.filled, accent: "text-emerald-600", tooltip: "Nombre d'opportunités qui se sont conclues via KORYXA (30 derniers jours)." },
            { label: "Délai médian", value: stats.medianDelay, accent: "text-indigo-600", tooltip: "Durée typique avant qu'une opportunité reçoive un premier contact." },
          ].map((kpi) => (
            <button
              key={kpi.label}
              type="button"
              title={kpi.tooltip}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-200"
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">{kpi.label}</p>
              <p className={clsx("mt-2 text-3xl font-semibold", kpi.accent)}>{kpi.value}</p>
            </button>
          ))}
        </section>

        {offers.length > 0 && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <p>
              {stats.active} opportunité(s) publiées aujourd&apos;hui · {stats.filled} mission(s) confirmées ce mois.
            </p>
          </div>
        )}

        {renderComposer()}

        {/* Filters */}
        <section className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap gap-3">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={clsx(
                  "rounded-full border px-4 py-2 text-sm font-medium",
                  activeCategory === tab.key
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.6 3.6a7.5 7.5 0 0013.05 13.05z" />
                </svg>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  placeholder="Rechercher un titre, un secteur, une compétence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:flex md:items-center md:justify-end">
              <select
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={filters.country}
                onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value }))}
              >
                {COUNTRY_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={filters.sort}
                onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value as Filters["sort"] }))}
              >
                <option value="recent">Les plus récents</option>
                <option value="price">Budget croissant</option>
                <option value="alpha">A → Z</option>
              </select>
            </div>
          </div>
        </section>

        {/* Feed */}
        <section className="space-y-4">
          {loading && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Chargement du fil communautaire...
            </div>
          )}
          {!loading && filteredOffers.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              <p>Aucune offre encore. Soyez le premier à publier une opportunité pour la communauté KORYXA.</p>
              <button
                onClick={() => setComposerOpen(true)}
                className="mt-4 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
              >
                Publier maintenant
              </button>
            </div>
          )}
          {filteredOffers.map((offer) => {
            const tags = offer.tags && offer.tags.length ? offer.tags : offer.skills;
            return (
              <article key={offer.offer_id} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-start gap-3 px-5 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {initials(offer.owner_name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">{offer.title}</h2>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {CATEGORY_TABS.find((tab) => tab.key === offer.category)?.label || offer.category}
                      </span>
                      {offer.country && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {offer.country}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {offer.owner_name || "Communauté KORYXA"} · {formatTime(offer.created_at)}
                    </p>
                  </div>
                  <div className="text-right text-sm font-semibold text-slate-700">
                    {formatPrice(offer.price, offer.currency)}
                  </div>
                </div>
                {offer.cover_image && (
                  <div className="relative h-64 w-full overflow-hidden">
                    <img src={offer.cover_image} alt="visuel" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="space-y-4 px-5 py-4">
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                    {offer.description}
                  </p>
                  {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-sm">
                    {offer.contact_email && (
                      <a
                        href={`mailto:${offer.contact_email}`}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-200 hover:text-sky-700"
                      >
                        Contacter par email
                      </a>
                    )}
                    {offer.contact_phone && (
                      <a
                        href={`tel:${offer.contact_phone}`}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-200 hover:text-sky-700"
                      >
                        Appeler / WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
          <button
            type="button"
            onClick={() => setShowFaq((v) => !v)}
            className="font-semibold text-slate-700 hover:text-sky-600"
          >
            Pourquoi le marketplace est vide ?
          </button>
          {showFaq && (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Il n'y a pas encore d'offres publiées (n'hésitez pas à lancer la première !).</li>
              <li>Vos filtres sont peut-être trop restrictifs (réinitialisez-les).</li>
              <li>Un incident technique peut survenir : utilisez le bouton “Réessayer” ou contactez support@innovaplus.africa.</li>
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

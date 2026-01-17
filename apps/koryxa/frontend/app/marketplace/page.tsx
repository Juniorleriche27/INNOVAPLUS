"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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
  { key: "service", label: "Services" },
  { key: "product", label: "Produits physiques" },
  { key: "formation", label: "Formations" },
  { key: "talent", label: "Talents & experts" },
  { key: "mission", label: "Projets collaboratifs" },
  { key: "agri", label: "Agriculture & agro" },
  { key: "education", label: "Éducation" },
  { key: "bundle", label: "Bundles" },
];

const TYPE_OPTIONS = [
  { value: "service", label: "Services" },
  { value: "product", label: "Produits physiques" },
  { value: "formation", label: "Formations" },
  { value: "mission", label: "Projets collaboratifs" },
  { value: "talent", label: "Talents & experts" },
  { value: "agri", label: "Agriculture & agro" },
  { value: "education", label: "Éducation" },
  { value: "bundle", label: "Bundles / packs" },
];

const GLOBAL_COUNTRIES = [
  "Sénégal",
  "Côte d'Ivoire",
  "Togo",
  "Bénin",
  "Burkina Faso",
  "Mali",
  "Niger",
  "Guinée",
  "Ghana",
  "Nigeria",
  "Cameroun",
  "Kenya",
  "Afrique du Sud",
  "Maroc",
  "Tunisie",
  "France",
  "Belgique",
  "Canada",
  "États-Unis",
  "Rwanda",
  "Botswana",
  "Éthiopie",
  "Ouganda",
  "Tanzanie",
];

const CURRENCY_OPTIONS = ["USD", "EUR", "XOF", "XAF"];

const STEP_ITEMS = [
  { key: "basic", label: "1/3 Infos de base" },
  { key: "description", label: "2/3 Description" },
  { key: "pricing", label: "3/3 Prix & dispo" },
];

const INITIAL_FORM = {
  ownerName: "",
  title: "",
  description: "",
  category: "service",
  country: "",
  price: "",
  currency: "USD",
  tags: "",
  coverImage: "",
  contactEmail: "",
  contactPhone: "",
};

const INITIAL_IDENTITY = {
  userId: "",
  userName: "",
  email: "",
  phone: "",
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
  if (Number.isNaN(ts)) return "récemment";
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
  const [form, setForm] = useState(INITIAL_FORM);
  const [publishing, setPublishing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string>(STEP_ITEMS[0].key);
  const [showFaq, setShowFaq] = useState(false);
  const [identity, setIdentity] = useState(INITIAL_IDENTITY);
  const [applying, setApplying] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL(`${INNOVA_API_BASE}/marketplace/offers`);
      url.searchParams.set("status", "live");
      if (activeCategory !== "all") {
        url.searchParams.set("category", activeCategory);
      }
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) throw new Error("API marketplace indisponible");
      const data = await res.json();
      setOffers(data.items || []);
      setError(null);
    } catch {
      setError("Impossible de charger le marketplace pour le moment.");
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

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
      const savedIdentity = localStorage.getItem("marketplaceIdentity");
      if (savedIdentity) {
        const parsedId = JSON.parse(savedIdentity);
        setIdentity({ ...INITIAL_IDENTITY, ...parsedId });
        if (!parsedId.ownerName && parsedId.userName) {
          setForm((prev) => ({ ...prev, ownerName: parsedId.userName }));
        }
        if (!parsedId.contactEmail && parsedId.email) {
          setForm((prev) => ({ ...prev, contactEmail: parsedId.email }));
        }
        if (!parsedId.contactPhone && parsedId.phone) {
          setForm((prev) => ({ ...prev, contactPhone: parsedId.phone }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const filteredOffers = useMemo(() => {
    let data = [...offers];
    if (filters.country !== "all") {
      data = data.filter((offer) => (offer.country || "").toUpperCase() === filters.country.toUpperCase());
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
  }, [offers, filters.country, filters.sort, searchQuery]);

  const stats = useMemo(() => {
    const active = offers.filter((o) => o.status === "live").length;
    const filled = offers.filter((o) => o.status === "filled").length;
    const medianDelay = "48h";
    return { active, filled, medianDelay };
  }, [offers]);

  const canPublish =
    (form.ownerName.trim().length > 2 || identity.userName.trim().length > 2) &&
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
      const ownerName = (form.ownerName || identity.userName).trim();
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        skills: tags,
        tags,
        country: form.country ? form.country.toUpperCase() : undefined,
        price: form.price ? Number(form.price) : undefined,
        currency: form.currency,
        owner_id:
          `${ownerName || "public"}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
          `public-${Date.now()}`,
        owner_name: ownerName || "Communauté KORYXA",
        cover_image: form.coverImage.trim() || undefined,
        contact_email: (form.contactEmail || identity.email).trim() || undefined,
        contact_phone: (form.contactPhone || identity.phone).trim() || undefined,
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
      localStorage.removeItem("marketplaceDraft");
      setSuccessMessage("Offre publiée. Elle apparaît maintenant dans le fil !");
      fetchOffers();
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {
      setError("Publication impossible. Vérifiez les champs et réessayez.");
    } finally {
      setPublishing(false);
    }
  };

  const heroScroll = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSaveIdentity = () => {
    localStorage.setItem("marketplaceIdentity", JSON.stringify(identity));
    if (!form.ownerName && identity.userName) {
      setForm((prev) => ({ ...prev, ownerName: identity.userName }));
    }
    if (!form.contactEmail && identity.email) {
      setForm((prev) => ({ ...prev, contactEmail: identity.email }));
    }
    if (!form.contactPhone && identity.phone) {
      setForm((prev) => ({ ...prev, contactPhone: identity.phone }));
    }
    setSuccessMessage("Identité sauvegardée pour postuler / publier plus vite.");
  };

  const handleApply = async (offerId: string) => {
    if (!identity.userId.trim()) {
      setError("Ajoutez votre identifiant (email ou user_id) pour postuler.");
      return;
    }
    setApplying(offerId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`${INNOVA_API_BASE}/marketplace/offers/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_id: offerId, user_id: identity.userId.trim() }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Echec de la candidature");
      }
      setSuccessMessage("Candidature envoyée. L'auteur sera notifié.");
    } catch {
      setError("Impossible d'envoyer votre candidature. Réessayez ou vérifiez votre identifiant.");
    } finally {
      setApplying(null);
    }
  };

  const previewOffer = useMemo(() => {
    return {
      title: form.title || "Titre de votre offre",
      description:
        form.description ||
        "Décrivez votre talent, produit ou mission. Mettez en avant les résultats attendus et les bénéfices pour la communauté.",
      owner: form.ownerName || "Nom public",
      category: TYPE_OPTIONS.find((opt) => opt.value === form.category)?.label || "Service",
      country: form.country || "Pays",
      price: form.price ? Number(form.price) : undefined,
      currency: form.currency,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
  }, [form]);

  const suggestionKeywords = (form.tags || form.title).toLowerCase();
  const aiSuggestions = useMemo(() => {
    const generic = [
      "Boostez votre visibilité locale grâce à une offre claire et un contact direct.",
      "Ajoutez un visuel ou une photo pour donner confiance aux premiers visiteurs.",
    ];
    if (!suggestionKeywords) return generic;
    const ideas: string[] = [];
    if (suggestionKeywords.includes("agri")) {
      ideas.push("Ex: Pack irrigation solaire + formation express pour maraîchers.");
    }
    if (suggestionKeywords.includes("mobile") || suggestionKeywords.includes("money")) {
      ideas.push("Ex: Kit mobile money pour boutiques de quartier (Orange/Sénéclé).");
    }
    if (suggestionKeywords.includes("formation")) {
      ideas.push("Ex: Bootcamp 5 jours - marketing digital pour associations de jeunes.");
    }
    return ideas.length ? ideas.concat(generic.slice(0, 1)) : generic;
  }, [suggestionKeywords]);

  const renderStatusBanner = () => {
    if (!error) return null;
    return (
      <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>Aucune offre pour le moment ou le serveur répond lentement.</div>
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

  return (
    <div className="min-h-screen bg-[#f5f6fb]">
      <TelemetryPing name="view_marketplace" />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section
          ref={heroRef}
          className="mb-6 grid gap-6 rounded-[32px] border border-slate-200 bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 p-8 shadow-sm md:grid-cols-2"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Communauté</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">Marketplace social KORYXA</h1>
            <p className="mt-4 text-base text-slate-600">
              Publiez vos talents, services, produits ou projets collaboratifs. KORYXA aide la communauté à vous
              recommander et à conclure des missions rapidement.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={heroScroll}
                className="rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:-translate-y-0.5 hover:bg-sky-700"
              >
                Créer mon offre
              </button>
              <button
                onClick={fetchOffers}
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
              >
                Actualiser le fil
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-r from-sky-200 to-indigo-300 opacity-30 blur-3xl" />
            <div className="relative flex h-full items-center justify-center rounded-[28px] border border-white/60 bg-white/70 p-6 backdrop-blur">
              <div className="relative h-64 w-full overflow-hidden rounded-[24px] shadow-lg">
                <Image
                  src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=900&q=60"
                  alt="Collaboration"
                  fill
                  sizes="(min-width: 1024px) 520px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Comment ça marche ?</p>
          <div className="mt-3 grid gap-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50/80 p-4">
              <p className="font-semibold text-slate-900">1 · Publier</p>
              <p className="text-slate-600">Ajoutez votre offre avec les informations clés.</p>
            </div>
            <div className="rounded-2xl bg-slate-50/80 p-4">
              <p className="font-semibold text-slate-900">2 · KORYXA recommande</p>
              <p className="text-slate-600">Le fil met en avant votre proposition auprès des membres pertinents.</p>
            </div>
            <div className="rounded-2xl bg-slate-50/80 p-4">
              <p className="font-semibold text-slate-900">3 · Mission confirmée</p>
              <p className="text-slate-600">Vous discutez avec les contacts et concluez la mission.</p>
            </div>
          </div>
        </section>

        {renderStatusBanner()}
        {successMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Offres actives", value: stats.active, accent: "text-sky-600", tooltip: "Nombre d'annonces visibles actuellement." },
            {
              label: "Missions confirmées",
              value: stats.filled,
              accent: "text-emerald-600",
              tooltip: "Opportunités conclues via KORYXA ce mois.",
            },
            { label: "Délai médian", value: stats.medianDelay, accent: "text-indigo-600", tooltip: "Temps moyen pour recevoir un premier contact." },
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
            {stats.active} opportunité(s) publiées aujourd'hui · {stats.filled} mission(s) confirmée(s) ce mois.
          </div>
        )}

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">Mon identité (pour postuler / publier)</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Identifiant (email ou user_id) *</label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                    value={identity.userId}
                    onChange={(e) => setIdentity({ ...identity, userId: e.target.value })}
                    placeholder="ylamadokou@gmail.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Nom affiché</label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                    value={identity.userName}
                    onChange={(e) => setIdentity({ ...identity, userName: e.target.value })}
                    placeholder="Collectif KORYXA"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Email de contact</label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                    value={identity.email}
                    onChange={(e) => setIdentity({ ...identity, email: e.target.value })}
                    placeholder="contact@exemple.org"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Téléphone / WhatsApp</label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                    value={identity.phone}
                    onChange={(e) => setIdentity({ ...identity, phone: e.target.value })}
                    placeholder="+221..."
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveIdentity}
              className="w-full rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:-translate-y-0.5 hover:bg-sky-700 md:w-auto"
            >
              Sauvegarder
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Votre identifiant est stocké localement (navigateur) et utilisé pour postuler, générer l'identité publique et préremplir vos offres.
          </p>
        </section>

        <section ref={formRef} className="mb-8 rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-900/5">
          <div className="flex items-center gap-2 pb-4">
            {STEP_ITEMS.map((step, index) => {
              const completed =
                (step.key === "basic" && form.ownerName && form.title) ||
                (step.key === "description" && form.description.length > 10) ||
                (step.key === "pricing" && (form.price || form.currency));
              return (
                <div key={step.key} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <div
                    className={clsx(
                      "flex h-7 w-7 items-center justify-center rounded-full border",
                      completed ? "border-emerald-500 bg-emerald-500 text-white" : activeStep === step.key ? "border-sky-500 text-sky-600" : "border-slate-200",
                    )}
                  >
                    {index + 1}
                  </div>
                  <span className={activeStep === step.key ? "text-slate-900" : "text-slate-400"}>{step.label}</span>
                  {index < STEP_ITEMS.length - 1 && <div className="h-px w-8 bg-slate-200" />}
                </div>
              );
            })}
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <form onSubmit={handlePublish} className="space-y-6">
              <div className="rounded-3xl border border-slate-200 p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">1. Infos de base *</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700" title="Votre nom sera visible dans le fil.">
                      💼 Nom public *
                    </label>
                    <input
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      value={form.ownerName}
                      onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                      onFocus={() => setActiveStep("basic")}
                      placeholder="Ex. : Collectif de jeunes, Boutique textile..."
                      required
                    />
                    <p className="mt-1 text-xs text-slate-500">Un nom clair inspire confiance.</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700" title="Choisissez le type qui correspond le mieux.">
                      🗂️ Type d'offre *
                    </label>
                    <select
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      onFocus={() => setActiveStep("basic")}
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-semibold text-slate-700" title="Un titre clair augmente vos chances d'être trouvé.">
                    📝 Titre *
                  </label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    onFocus={() => setActiveStep("basic")}
                    placeholder="Ex. : Développeur React, Pack marketing, Solution mobile money..."
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">Un titre clair aide les membres à comprendre rapidement.</p>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-semibold text-slate-700" title="Astuce : décrivez le besoin, l'offre et l'impact.">
                    ✏️ Description *
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-3xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    onFocus={() => setActiveStep("description")}
                    placeholder="Expliquez ce que vous proposez, les livrables, le contexte local..."
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">Ajoutez des résultats concrets, des délais et une touche humaine.</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">2. Prix & disponibilité</p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700" title="Choisissez le pays ciblé.">
                      🌍 Pays
                    </label>
                    <input
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      list="country-search"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      onFocus={() => setActiveStep("pricing")}
                      placeholder="Tapez un pays..."
                    />
                    <datalist id="country-search">
                      {GLOBAL_COUNTRIES.map((country) => (
                        <option key={country} value={country} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700" title="Indiquez un budget indicatif.">
                      💰 Budget indicatif
                    </label>
                    <input
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      onFocus={() => setActiveStep("pricing")}
                      placeholder="Ex. : 2500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700" title="Sélectionnez la devise.">
                      ⏱️ Devise
                    </label>
                    <select
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
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
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Mots-clés</label>
                    <input
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      placeholder="Ex. : mobile money, textile, agro..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Visuel (URL)</label>
                    <input
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      value={form.coverImage}
                      onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Email de contact</label>
                    <input
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      placeholder="contact@exemple.org"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Téléphone / WhatsApp</label>
                    <input
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                      value={form.contactPhone}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                      placeholder="+221..."
                    />
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Conseils IA</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {aiSuggestions.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="text-xs text-slate-500">Les champs marqués d'un * sont obligatoires.</div>
              <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-sky-200 hover:text-sky-700"
                >
                  Enregistrer comme brouillon
                </button>
                <button
                  type="submit"
                  disabled={!canPublish || publishing}
                  className="rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {publishing ? "Publication..." : "Publier une offre"}
                </button>
              </div>
            </form>
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Aperçu de mon offre</p>
                <article className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-600">
                      {initials(previewOffer.owner)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{previewOffer.owner}</p>
                      <p className="text-xs text-slate-500">
                        {previewOffer.category} · {previewOffer.country}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-base font-semibold text-slate-900">{previewOffer.title}</p>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{previewOffer.description}</p>
                  {previewOffer.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {previewOffer.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-4 text-sm font-semibold text-slate-900">{formatPrice(previewOffer.price, previewOffer.currency)}</p>
                </article>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Pourquoi publier maintenant ?</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600">
                  <li>Votre offre peut être recommandée automatiquement dans les missions KORYXA.</li>
                  <li>Les membres peuvent partager votre carte sur WhatsApp ou via email.</li>
                  <li>L'équipe peut vous contacter pour des programmes pilotes.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[32px] border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
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
            <div className="grid gap-3 md:flex md:items-center md:justify-end">
              <select
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={filters.country}
                onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value }))}
              >
                <option value="all">Tous les pays</option>
                {GLOBAL_COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
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
                onClick={heroScroll}
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
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{offer.country}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {offer.owner_name || "Communauté KORYXA"} · {formatTime(offer.created_at)}
                    </p>
                  </div>
                  <div className="text-right text-sm font-semibold text-slate-700">{formatPrice(offer.price, offer.currency)}</div>
                </div>
                {offer.cover_image && (
                  <div className="relative h-64 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={offer.cover_image} alt="visuel" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="space-y-4 px-5 py-4">
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{offer.description}</p>
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
                    <button
                      type="button"
                      onClick={() => handleApply(offer.offer_id)}
                      disabled={!!applying}
                      className={clsx(
                        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                        applying === offer.offer_id
                          ? "border-slate-200 bg-slate-100 text-slate-500"
                          : "border-sky-200 bg-sky-50 text-sky-700 hover:-translate-y-0.5 hover:shadow-sm",
                      )}
                      title={identity.userId ? "Postuler avec votre identifiant enregistré" : "Ajoutez votre identifiant plus haut pour postuler"}
                    >
                      {applying === offer.offer_id ? "Envoi..." : "Je suis intéressé"}
                    </button>
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
              <li>Il n'y a pas encore d'offres publiées. Lancez la première !</li>
              <li>Vos filtres sont peut-être trop restrictifs. Réinitialisez-les.</li>
              <li>Un incident technique peut survenir : réessayez ou contactez support@innovaplus.africa.</li>
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

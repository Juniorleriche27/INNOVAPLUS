"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import TelemetryPing from "@/components/util/TelemetryPing";

type Offer = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  country: string;
  price: number;
  currency: string;
  duration: string;
  owner: string;
  matchScore: number;
  postedAt: number;
  type: "talent" | "service" | "offer";
  status: "active" | "completed" | "paused";
};

type Filter = {
  country: string;
  skills: string[];
  priceRange: [number, number];
  sort: "recent" | "match" | "price";
};

export default function MarketplacePage() {
  const pathname = usePathname();
  const [filters, setFilters] = useState<Filter>({
    country: "all",
    skills: [],
    priceRange: [0, 10000],
    sort: "recent"
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const offers: Offer[] = [
    {
      id: "1",
      title: "Développeur Full-Stack React/Node.js",
      description: "Mission 10 jours · développement d'une plateforme de gestion des stocks avec IA prédictive, API REST, dashboard React, intégration MongoDB.",
      skills: ["React", "Node.js", "MongoDB", "IA"],
      country: "SN",
      price: 2500,
      currency: "USD",
      duration: "10 jours",
      owner: "TechCorp Dakar",
      matchScore: 0.92,
      postedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      type: "talent",
      status: "active"
    },
    {
      id: "2",
      title: "Consultant en Transformation Digitale",
      description: "Accompagnement stratégique pour la digitalisation des processus métier, audit technologique, roadmap de transformation.",
      skills: ["Stratégie", "Digital", "Processus", "Audit"],
      country: "CI",
      price: 5000,
      currency: "USD",
      duration: "3 mois",
      owner: "Digital Solutions",
      matchScore: 0.87,
      postedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      type: "service",
      status: "active"
    },
    {
      id: "3",
      title: "Solution E-commerce Complète",
      description: "Plateforme e-commerce clé en main avec paiement mobile, gestion des stocks, analytics avancés, support multilingue.",
      skills: ["E-commerce", "Mobile", "Analytics", "Multilingue"],
      country: "BF",
      price: 15000,
      currency: "USD",
      duration: "6 mois",
      owner: "EcomTech",
      matchScore: 0.78,
      postedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      type: "offer",
      status: "active"
    },
    {
      id: "4",
      title: "Data Analyst - Tableaux de Bord",
      description: "Création de tableaux de bord pricing régional, exploration des ventes, recommandations actionnables, livrables Power BI.",
      skills: ["Data Analysis", "Power BI", "Pricing", "Excel"],
      country: "SN",
      price: 1800,
      currency: "USD",
      duration: "2 semaines",
      owner: "Data Insights",
      matchScore: 0.85,
      postedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      type: "talent",
      status: "active"
    },
    {
      id: "5",
      title: "Formation Agile pour Startups",
      description: "Formation complète aux méthodologies agiles, ateliers pratiques, certification Scrum Master, suivi personnalisé.",
      skills: ["Agile", "Scrum", "Formation", "Startup"],
      country: "BJ",
      price: 3200,
      currency: "USD",
      duration: "1 mois",
      owner: "Agile Academy",
      matchScore: 0.73,
      postedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      type: "service",
      status: "active"
    }
  ];

  const countries = [
    { code: "all", name: "Tous les pays" },
    { code: "CI", name: "Côte d'Ivoire" },
    { code: "SN", name: "Sénégal" },
    { code: "BJ", name: "Bénin" },
    { code: "BF", name: "Burkina Faso" },
    { code: "ML", name: "Mali" },
    { code: "NE", name: "Niger" },
    { code: "TG", name: "Togo" }
  ];

  const allSkills = [
    "React", "Node.js", "Python", "Data Analysis", "IA", "Mobile", "E-commerce",
    "Digital", "Agile", "Scrum", "Power BI", "MongoDB", "Stratégie", "Formation"
  ];

  const filteredOffers = useMemo(() => {
    let filtered = offers;

    // Search query
    if (searchQuery) {
      filtered = filtered.filter(offer => 
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Country filter
    if (filters.country !== "all") {
      filtered = filtered.filter(offer => offer.country === filters.country);
    }

    // Skills filter
    if (filters.skills.length > 0) {
      filtered = filtered.filter(offer => 
        filters.skills.some(skill => offer.skills.includes(skill))
      );
    }

    // Price range filter
    filtered = filtered.filter(offer => 
      offer.price >= filters.priceRange[0] && offer.price <= filters.priceRange[1]
    );

    // Sort
    switch (filters.sort) {
      case "match":
        filtered.sort((a, b) => b.matchScore - a.matchScore);
        break;
      case "price":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "recent":
      default:
        filtered.sort((a, b) => b.postedAt - a.postedAt);
        break;
    }

    return filtered;
  }, [offers, filters, searchQuery]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    
    if (days > 0) return `il y a ${days}j`;
    if (hours > 0) return `il y a ${hours}h`;
    return "à l'instant";
  };

  const getMatchColor = (score: number) => {
    if (score >= 0.8) return "text-emerald-600 bg-emerald-50";
    if (score >= 0.6) return "text-amber-600 bg-amber-50";
    return "text-slate-600 bg-slate-50";
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "talent": return "Talent";
      case "service": return "Service";
      case "offer": return "Offre";
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "talent": return "bg-blue-50 text-blue-700";
      case "service": return "bg-purple-50 text-purple-700";
      case "offer": return "bg-green-50 text-green-700";
      default: return "bg-slate-50 text-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6">
        <TelemetryPing name="view_marketplace" />
        
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Marketplace</h1>
            <p className="text-sm text-slate-500">Découvrez talents, services et offres packagées</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtres
            </button>
            <Link 
              href="/marketplace/new" 
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Publier une offre
            </Link>
          </div>
        </header>

        {/* KPIs */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Offres actives", value: "56", icon: "📊" },
            { label: "Missions remplies", value: "212", icon: "✅" },
            { label: "Délai médian", value: "48h", icon: "⏱️" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{kpi.icon}</span>
                <div>
                  <p className="text-sm text-slate-500">{kpi.label}</p>
                  <p className="text-2xl font-bold text-sky-600">{kpi.value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Search and Filters */}
        <section className="sticky top-20 z-10 mb-6 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher par titre, compétences, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pays</label>
                  <select
                    value={filters.country}
                    onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  >
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Compétences</label>
                  <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                    {allSkills.map(skill => (
                      <button
                        key={skill}
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          skills: prev.skills.includes(skill)
                            ? prev.skills.filter(s => s !== skill)
                            : [...prev.skills, skill]
                        }))}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          filters.skills.includes(skill)
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Prix (USD)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange[0]}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]] 
                      }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange[1]}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        priceRange: [prev.priceRange[0], parseInt(e.target.value) || 10000] 
                      }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tri</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as "recent" | "match" | "price" }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="recent">Plus récents</option>
                    <option value="match">Meilleur match</option>
                    <option value="price">Prix croissant</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Tabs */}
        <nav className="mb-6 flex flex-wrap gap-2">
          {[
            { href: "/marketplace/talents", label: "Talents", count: 23 },
            { href: "/marketplace/services", label: "Services", count: 15 },
            { href: "/marketplace/offers", label: "Offres", count: 18 },
          ].map((tab) => {
            const active = pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sky-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  active ? "bg-white/20" : "bg-slate-100"
                }`}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Offers Grid */}
        <section className="space-y-4">
          {filteredOffers.map((offer) => (
            <article key={offer.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <header className="mb-4 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getTypeColor(offer.type)}`}>
                      {getTypeLabel(offer.type)}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {offer.country}
                    </span>
                    <span className="text-xs text-slate-500">{formatTime(offer.postedAt)}</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{offer.title}</h3>
                  
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {offer.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {offer.skills.slice(0, 4).map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700"
                      >
                        {skill}
                      </span>
                    ))}
                    {offer.skills.length > 4 && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        +{offer.skills.length - 4} autres
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 flex flex-col items-end gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">
                      {formatPrice(offer.price, offer.currency)}
                    </div>
                    <div className="text-xs text-slate-500">{offer.duration}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getMatchColor(offer.matchScore)}`}>
                      Match {(offer.matchScore * 100).toFixed(0)}%
                    </div>
                    <div className="w-16 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${offer.matchScore * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </header>
              
              <footer className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-semibold text-xs">
                    {offer.owner.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{offer.owner}</div>
                    <div className="text-xs text-slate-500">Propriétaire</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-700 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Favoris
                  </button>
                  <Link 
                    href={`/marketplace/offers/${offer.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 transition-colors"
                  >
                    Voir / Postuler
                  </Link>
                </div>
              </footer>
            </article>
          ))}

          {filteredOffers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune offre trouvée</h3>
              <p className="text-slate-500 mb-6">Essayez de modifier vos filtres ou votre recherche</p>
              <Link 
                href="/marketplace/new"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 transition-colors"
              >
                Publier la première offre
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchEbooks, fetchEbook, API_BASE } from "../services/api";

export default function EbooksList() {
  const nav = useNavigate();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [q, setQ] = useState("");

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetchEbooks(p);
      const list = res?.data || res?.items || res || [];
      const m = res?.meta || {
        current_page: res?.current_page || p,
        last_page: res?.last_page || p,
        total: res?.total ?? (Array.isArray(list) ? list.length : 0),
      };
      setItems(Array.isArray(list) ? list : []);
      setMeta(m);
      setPage(m.current_page || p);
    } catch {
      setItems([]);
      setMeta({ current_page: 1, last_page: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrage simple côté client
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((e) =>
      [e.title, e.description, e.author]
        .filter(Boolean)
        .some((t) => String(t).toLowerCase().includes(term))
    );
  }, [items, q]);

  // Téléchargement réel : ouvre le PDF dans un nouvel onglet si connecté
  const handleDownload = async (ebook) => {
    const token = localStorage.getItem("token");
    if (!token) {
      const next = ebook?.id ? `/ebooks/${ebook.id}` : `/ebooks`;
      nav(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    try {
      // Récupérer l'ebook complet pour obtenir file_url/file_path
      const res = await fetchEbook(ebook.id);
      const data = res?.data || res || ebook;

      let url = null;
      if (data.file_url) {
        url = data.file_url.startsWith("http")
          ? data.file_url
          : `${API_BASE}${data.file_url}`;
      } else if (data.file_path) {
        url = `${API_BASE}/storage/${data.file_path}`;
      }

      if (!url) {
        alert("Aucun fichier n’est attaché à cet e-book.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      alert("Téléchargement impossible pour le moment.");
    }
  };

  return (
    <section className="container catalog">
      {/* Hero */}
      <div className="catalog-hero">
        <div>
          <h1>Catalogue des e-books</h1>
          <p className="muted">
            Parcourez notre sélection. Téléchargez après connexion.
          </p>
        </div>
        <div className="catalog-cta">
          <Link className="btn" to="/ebooks/new">Publier un e-book</Link>
        </div>
      </div>

      {/* Barre outils */}
      <div className="catalog-toolbar">
        <div className="toolbar-left">
          <div className="input-wrap">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un titre, un auteur…"
              aria-label="Recherche"
            />
          </div>
          <div className="muted small">
            {loading ? "Chargement…" : `${filtered.length} résultat(s)`}{meta?.total ? ` · ${meta.total} total` : ""}
          </div>
        </div>
        <div className="toolbar-right">
          <select onChange={()=>{}} defaultValue="recent" aria-label="Trier">
            <option value="recent">Plus récents</option>
            <option value="title">Titre A→Z</option>
          </select>
        </div>
      </div>

      {/* Grille */}
      {loading ? (
        <div className="catalog-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="ebook-card skeleton">
              <div className="cover" />
              <div className="stack">
                <div className="line w60" />
                <div className="line w90" />
                <div className="line w40" />
              </div>
            </article>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <h3>Aucun résultat</h3>
          <p className="muted">Essayez un autre mot-clé ou réinitialisez votre recherche.</p>
          <button className="btn outline" onClick={() => setQ("")}>Réinitialiser</button>
        </div>
      ) : (
        <div className="catalog-grid">
          {filtered.map((eb) => {
            const title = eb.title || `E-book #${eb.id}`;
            const desc =
              eb.description ||
              (eb.excerpt ? String(eb.excerpt).slice(0, 120) : "Aucune description.");
            const format = eb.format || "PDF";
            const price = typeof eb.price === "number" ? eb.price : (eb.price || 0);
            const isFree = Number(price) === 0;

            return (
              <article key={eb.id} className="ebook-card">
                <div className="cover">{/* cover_url si dispo */}</div>
                <div className="content">
                  <div className="badges">
                    <span className="badge">{format}</span>
                    <span className={`badge ${isFree ? "success" : "warning"}`}>
                      {isFree ? "Gratuit" : `${price} €`}
                    </span>
                  </div>
                  <h3 className="title">{title}</h3>
                  <p className="muted desc">{desc}</p>
                </div>
                <div className="actions">
                  <Link className="btn outline" to={`/ebooks/${eb.id}`}>Voir</Link>
                  <button className="btn" onClick={() => handleDownload(eb)}>Télécharger</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination (si dispo) */}
      {meta?.last_page > 1 && (
        <div className="pagination">
          <button
            className="btn outline"
            disabled={page <= 1 || loading}
            onClick={() => load(page - 1)}
          >
            ← Précédent
          </button>
          <span className="muted">{page} / {meta.last_page}</span>
          <button
            className="btn"
            disabled={page >= meta.last_page || loading}
            onClick={() => load(page + 1)}
          >
            Suivant →
          </button>
        </div>
      )}
    </section>
  );
}

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEbooks } from "../services/api";

export default function Home() {
  const [ebooks, setEbooks] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const res = await fetchEbooks(p);
      setEbooks(res.data || []);
      setMeta({ total: res.total ?? 0, last_page: res.last_page ?? 1 });
      setPage(res.current_page ?? p);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les e-books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container">
      {/* Hero simple */}
      <section className="hero">
        <div className="hero-text">
          <h1>Découvrez, lisez et partagez vos e-books</h1>
          <p>PlusBooks — votre bibliothèque numérique.</p>
          <div className="row">
            <Link className="btn" to="/ebooks/new">Publier un e-book</Link>
            <a className="btn outline" href="#catalogue">Voir le catalogue</a>
          </div>
        </div>
        <div className="hero-img" aria-hidden>
          <img
            src="https://cdn-icons-png.flaticon.com/512/29/29302.png"
            alt="Illustration e-book"
          />
        </div>
      </section>

      {/* Catalogue */}
      <section id="catalogue" className="stack">
        <div className="row" style={{alignItems:'center', justifyContent:'space-between'}}>
          <h2 style={{margin:0}}>Catalogue d’e-books</h2>
          <Link className="btn outline" to="/ebooks/new">Ajouter</Link>
        </div>

        {loading && <p className="muted">Chargement…</p>}
        {error && <p style={{color:'crimson'}}>{error}</p>}

        {!loading && ebooks.length === 0 && !error && (
          <div className="card">
            <p>Aucun e-book disponible pour le moment.</p>
            <Link className="btn" to="/ebooks/new">Publier un e-book</Link>
          </div>
        )}

        {!loading && ebooks.length > 0 && (
          <div className="grid">
            {ebooks.map((b) => (
              <Link to={`/ebooks/${b.id}`} className="card" key={b.id}>
                <h3 style={{marginTop:0}}>{b.title}</h3>
                <p className="muted" style={{marginTop:8}}>
                  {b.description?.slice(0,120) || "—"}{(b.description?.length||0) > 120 ? "…" : ""}
                </p>
                <div className="row" style={{justifyContent:'space-between', marginTop:12}}>
                  <span className="muted">{Number(b.price||0).toFixed(2)} €</span>
                  {b.file_path ? <span>📄 PDF</span> : <span className="muted">Sans fichier</span>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination simple */}
        {!loading && meta.last_page > 1 && (
          <div className="row" style={{marginTop:16, justifyContent:'center'}}>
            <button
              className="btn outline"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
            >
              ← Précédent
            </button>
            <span className="muted" style={{padding:'8px 12px'}}>
              Page {page} / {meta.last_page}
            </span>
            <button
              className="btn"
              disabled={page >= meta.last_page}
              onClick={() => load(page + 1)}
            >
              Suivant →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

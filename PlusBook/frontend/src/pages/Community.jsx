import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPosts } from "../services/api";

export default function Community() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetchPosts(p);
      const list = res?.data || res?.items || res || [];
      const m = res?.meta || { current_page: 1, last_page: 1 };
      setPosts(Array.isArray(list) ? list : []);
      setMeta(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  return (
    <section className="container stack" style={{paddingTop: 24}}>
      <div className="catalog-hero">
        <div>
          <h1>Communauté</h1>
          <p className="muted">Mini-livres et articles publiés par les membres.</p>
        </div>
        <div className="catalog-cta">
          <Link className="btn" to="/community/new">Écrire un post</Link>
        </div>
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({length:4}).map((_,i)=>(
            <article key={i} className="card skeleton">
              <div className="line w90"></div>
              <div className="line w60"></div>
              <div className="line w40"></div>
            </article>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state card">
          <h3>Aucun post pour le moment</h3>
          <Link className="btn" to="/community/new">Soyez le premier</Link>
        </div>
      ) : (
        <div className="grid">
          {posts.map(p => (
            <article key={p.id} className="card">
              <h3 style={{marginTop:0}}>{p.title || `Post #${p.id}`}</h3>
              <p className="muted">
                {(p.body || "").slice(0,160)}{String(p.body||"").length>160?"…":""}
              </p>
              <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
                <span className="small muted">par {p.author_name || "membre"}</span>
                <Link className="btn outline" to={`/community/${p.id}`}>Lire</Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {meta?.last_page > 1 && (
        <div className="pagination">
          <button className="btn outline" disabled={meta.current_page<=1} onClick={()=>load(meta.current_page-1)}>← Précédent</button>
          <span className="muted">{meta.current_page} / {meta.last_page}</span>
          <button className="btn" disabled={meta.current_page>=meta.last_page} onClick={()=>load(meta.current_page+1)}>Suivant →</button>
        </div>
      )}
    </section>
  );
}

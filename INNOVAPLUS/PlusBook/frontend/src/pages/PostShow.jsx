import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchPost, fetchPostComments, addComment } from "../services/api";

export default function PostShow() {
  const { id } = useParams();
  const nav = useNavigate();
  const [post, setPost] = React.useState(null);
  const [comments, setComments] = React.useState([]);
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState("");

  const load = async () => {
    try {
      const p = await fetchPost(id);
      setPost(p?.data || p);
      const c = await fetchPostComments(id);
      setComments(c?.data || c || []);
    } catch {}
  };

  React.useEffect(()=>{ load(); }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    if (!token) return nav(`/login?next=${encodeURIComponent(`/community/${id}`)}`);
    try {
      await addComment(id, { body });
      setBody("");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Échec de l’envoi du commentaire.");
    }
  };

  if (!post) return <section className="container"><p className="muted">Chargement…</p></section>;

  return (
    <section className="container stack" style={{paddingTop: 24}}>
      <Link className="btn outline" to="/community">← Retour</Link>
      <article className="card">
        <h1 style={{marginTop:0}}>{post.title || `Post #${post.id}`}</h1>
        <p className="muted">par {post.author_name || "membre"}</p>
        <p style={{whiteSpace:"pre-line"}}>{post.body}</p>
      </article>

      <section className="stack">
        <h3>Commentaires</h3>
        {comments.length === 0 ? (
          <div className="card muted">Aucun commentaire pour le moment.</div>
        ) : (
          <div className="stack">
            {comments.map(c => (
              <div key={c.id} className="card" style={{padding:"12px 16px"}}>
                <div className="small muted">par {c.author_name || "membre"}</div>
                <div style={{whiteSpace:"pre-line"}}>{c.body}</div>
              </div>
            ))}
          </div>
        )}

        <form className="form" onSubmit={onSubmit}>
          {error && <div className="card" style={{borderLeft:"4px solid #ef4444"}}>{error}</div>}
          <label>
            Votre commentaire
            <textarea rows={4} value={body} onChange={e=>setBody(e.target.value)} required />
          </label>
          <div className="row">
            <button className="btn">Publier</button>
          </div>
        </form>
      </section>
    </section>
  );
}

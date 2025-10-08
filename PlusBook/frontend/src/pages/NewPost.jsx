import React, { useState } from "react";
import { createPost, fetchGroups } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function NewPost() {
  const nav = useNavigate();
  const [form, setForm] = useState({ title:"", body:"", group_id:"" });
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");

  React.useEffect(() => {
    fetchGroups().then(g => setGroups(g?.data || g || [])).catch(()=>setGroups([]));
  }, []);

  const onChange = (e)=> setForm(f=>({ ...f, [e.target.name]: e.target.value }));
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { title: form.title.trim(), body: form.body.trim() };
      if (form.group_id) payload.group_id = Number(form.group_id);
      await createPost(payload);
      nav("/community", { replace:true });
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de publier.");
    }
  };

  return (
    <section className="container stack" style={{paddingTop: 24}}>
      <h1>Écrire un post</h1>
      <form className="form" onSubmit={onSubmit}>
        {error && <div className="card" style={{borderLeft:"4px solid #ef4444"}}>{error}</div>}
        <label>
          Titre
          <input name="title" value={form.title} onChange={onChange} required />
        </label>
        <label>
          Contenu
          <textarea name="body" rows={10} value={form.body} onChange={onChange} required />
        </label>
        <label>
          Groupe (optionnel)
          <select name="group_id" value={form.group_id} onChange={onChange}>
            <option value="">— Aucun —</option>
            {groups.map(g=> <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>
        <div className="row">
          <button className="btn">Publier</button>
          <button type="button" className="btn outline" onClick={()=>nav(-1)}>Annuler</button>
        </div>
      </form>
    </section>
  );
}

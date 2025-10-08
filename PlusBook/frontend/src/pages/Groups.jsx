import React from "react";
import { fetchGroups, createGroup, joinGroup } from "../services/api";

export default function Groups() {
  const [groups, setGroups] = React.useState([]);
  const [form, setForm] = React.useState({ name:"", description:"", is_public:true });
  const [error, setError] = React.useState("");

  const load = async () => {
    try {
      const g = await fetchGroups();
      setGroups(g?.data || g || []);
    } catch { setGroups([]); }
  };
  React.useEffect(()=>{ load(); }, []);

  const onChange = (e)=> setForm(f=>({ ...f, [e.target.name]: e.target.value }));
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { name: form.name.trim(), description: form.description.trim(), is_public: !!form.is_public };
      await createGroup(payload);
      setForm({ name:"", description:"", is_public:true });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de créer le groupe.");
    }
  };

  return (
    <section className="container stack" style={{paddingTop: 24}}>
      <h1>Groupes</h1>

      <div className="grid">
        {groups.map(g=>(
          <article key={g.id} className="card">
            <h3 style={{marginTop:0}}>{g.name}</h3>
            <p className="muted">{g.description || "—"}</p>
            <div className="row">
              <button className="btn" onClick={()=>joinGroup(g.id).then(load)}>Rejoindre</button>
            </div>
          </article>
        ))}
      </div>

      <h2>Créer un groupe</h2>
      <form className="form" onSubmit={onSubmit}>
        {error && <div className="card" style={{borderLeft:"4px solid #ef4444"}}>{error}</div>}
        <label>
          Nom
          <input name="name" value={form.name} onChange={onChange} required />
        </label>
        <label>
          Description
          <textarea name="description" rows={4} value={form.description} onChange={onChange} />
        </label>
        <button className="btn">Créer</button>
      </form>
    </section>
  );
}

import React from "react";
import { fetchThread, sendMessage } from "../services/api";

export default function Messages() {
  const [recipient, setRecipient] = React.useState("");
  const [msgs, setMsgs] = React.useState([]);
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState("");

  const load = async (id) => {
    try {
      const t = await fetchThread(id);
      setMsgs(t?.data || t || []);
    } catch { setMsgs([]); }
  };

  const open = async (e) => {
    e.preventDefault();
    if (!recipient) return;
    await load(recipient);
  };

  const onSend = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await sendMessage({ recipient_id: recipient, body });
      setBody("");
      await load(recipient);
    } catch (err) {
      setError(err?.response?.data?.message || "Échec de l’envoi.");
    }
  };

  return (
    <section className="container stack" style={{paddingTop:24}}>
      <h1>Messages privés</h1>

      <form className="form" onSubmit={open}>
        <label>
          ID du destinataire
          <input value={recipient} onChange={e=>setRecipient(e.target.value)} required />
        </label>
        <button className="btn">Ouvrir le fil</button>
      </form>

      <div className="stack">
        {msgs.map(m => (
          <div key={m.id} className="card" style={{padding:"10px 14px"}}>
            <div className="small muted">de #{m.sender_id} → #{m.recipient_id}</div>
            <div style={{whiteSpace:"pre-line"}}>{m.body}</div>
          </div>
        ))}
      </div>

      <form className="form" onSubmit={onSend}>
        {error && <div className="card" style={{borderLeft:"4px solid #ef4444"}}>{error}</div>}
        <label>
          Votre message
          <textarea rows={3} value={body} onChange={e=>setBody(e.target.value)} required />
        </label>
        <button className="btn" disabled={!recipient}>Envoyer</button>
      </form>
    </section>
  );
}

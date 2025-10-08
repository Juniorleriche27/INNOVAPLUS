import React, { useState } from "react";
import { sendContact } from "../services/api";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setOk(false);
    try {
      await sendContact(form);
      setOk(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (e) {
      setErr(e?.response?.data?.message || "Impossible d'envoyer le message.");
    }
  };

  return (
    <section className="container stack">
      <h1>Contactez-nous</h1>
      <form className="form" onSubmit={onSubmit}>
        {ok && <div className="card" style={{ borderLeft: "4px solid #16a34a" }}>
          Merci ! Votre message a bien été envoyé.
        </div>}
        {err && <div className="card" style={{ borderLeft: "4px solid #ef4444" }}>{err}</div>}

        <label>
          Nom
          <input name="name" value={form.name} onChange={onChange} required />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={onChange} required />
        </label>
        <label>
          Sujet
          <input name="subject" value={form.subject} onChange={onChange} required />
        </label>
        <label>
          Message
          <textarea name="message" rows={5} value={form.message} onChange={onChange} required />
        </label>
        <button className="btn">Envoyer</button>
      </form>
    </section>
  );
}

import React, { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    // TODO: brancher l'endpoint backend quand il sera prêt (ex: /api/forgot-password)
    setSent(true);
  };

  return (
    <section className="container stack">
      <h1>Mot de passe oublié</h1>
      {sent ? (
        <div className="card">
          Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vous sera envoyé.
        </div>
      ) : (
        <form className="form" onSubmit={onSubmit}>
          {err && <div className="card" style={{borderLeft:"4px solid #ef4444"}}>{err}</div>}
          <label>
            Email
            <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} />
          </label>
          <button className="btn">Envoyer le lien</button>
        </form>
      )}
    </section>
  );
}

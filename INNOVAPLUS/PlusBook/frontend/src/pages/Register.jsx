import React, { useMemo, useState } from "react";
import { register } from "../services/api";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [search] = useSearchParams();
  const next = search.get("next") || "/profile";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "user",
    domain: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Politique mot de passe
  const policy = useMemo(() => {
    const pw = form.password || "";
    const upperMatches = pw.match(/[A-Z]/g) || [];
    return {
      length: pw.length >= 8,
      twoUpper: upperMatches.length >= 2,
      number: /\d/.test(pw),
      special: /[^A-Za-z0-9]/.test(pw),
      match: pw.length > 0 && pw === form.confirm,
    };
  }, [form.password, form.confirm]);

  const allOk = useMemo(
    () =>
      policy.length &&
      policy.twoUpper &&
      policy.number &&
      policy.special &&
      policy.match,
    [policy]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailTaken(false);
    if (!allOk) {
      setError("Le mot de passe ne respecte pas la politique.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        domain: form.domain.trim(),
        bio: form.bio.trim(),
      };
      const res = await register(payload);
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      window.dispatchEvent(new Event("auth-changed")); // ICI : met à jour le Header tout de suite
      nav(next, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.email?.[0] ||
        err?.response?.data?.message ||
        "Échec de l'inscription. Vérifie les champs.";
      setError(msg);
      if (/already been taken/i.test(String(msg))) {
        setEmailTaken(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container">
      <div className="auth-grid">
        <div className="auth-aside">
          <h1>Bienvenue sur PlusBooks</h1>
          <p className="muted">
            Créez votre compte pour publier, commenter et télécharger des e-books.
          </p>
        </div>

        <form className="auth-card" onSubmit={onSubmit}>
          <h2>Inscription</h2>

          {error && (
            <div className="card" style={{ borderLeft: "4px solid #ef4444" }}>
              {error}
            </div>
          )}

          {emailTaken && (
            <div className="card" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span>Ce compte existe déjà.</span>
              <Link
                className="btn outline"
                to={`/login?next=${encodeURIComponent(next)}&email=${encodeURIComponent(
                  form.email
                )}`}
              >
                Se connecter
              </Link>
            </div>
          )}

          <label>
            Nom
            <input name="name" value={form.name} onChange={onChange} required />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          <div className="row" style={{ gap: 12 }}>
            <label style={{ flex: 1 }}>
              Mot de passe
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                required
                aria-describedby="pw-policy"
              />
            </label>
            <label style={{ flex: 1 }}>
              Confirmation
              <input
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={onChange}
                required
              />
            </label>
          </div>

          <ul id="pw-policy" className="checklist">
            <li className={policy.length ? "ok" : "ko"}>Au moins 8 caractères</li>
            <li className={policy.twoUpper ? "ok" : "ko"}>Au moins 2 majuscules</li>
            <li className={policy.number ? "ok" : "ko"}>Au moins 1 chiffre</li>
            <li className={policy.special ? "ok" : "ko"}>Au moins 1 caractère spécial</li>
            <li className={policy.match ? "ok" : "ko"}>Confirmation identique</li>
          </ul>

          <label>
            Type de compte
            <select name="role" value={form.role} onChange={onChange}>
              <option value="user">Utilisateur</option>
              <option value="coach">Coach</option>
            </select>
          </label>

          <label>
            Domaine (ex: Développement personnel, Finances…)
            <input name="domain" value={form.domain} onChange={onChange} />
          </label>

          <label>
            À propos / Bio
            <textarea name="bio" value={form.bio} onChange={onChange} rows={4} />
          </label>

          <button className="btn" disabled={!allOk || loading}>
            {loading ? "Création..." : "Créer le compte"}
          </button>

          <div className="auth-links">
            <span className="muted">Déjà un compte ?</span>
            <Link
              to={`/login?next=${encodeURIComponent(next)}&email=${encodeURIComponent(
                form.email
              )}`}
            >
              Se connecter
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

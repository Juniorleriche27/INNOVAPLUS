import React, { useState } from "react";
import { createEbook } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function EbookCreate() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: 0,
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("price", String(form.price || 0));
      if (file) fd.append("file", file); // <— nom de champ attendu par l’API

      // NE PAS fixer Content-Type : axios détecte FormData et met le boundary
      await createEbook(fd);

      nav("/ebooks", { replace: true });
    } catch (err) {
      // Affiche proprement les erreurs de validation Laravel
      const data = err?.response?.data;
      const msg =
        data?.message ||
        (data?.errors &&
          Object.values(data.errors).flat().join(" · ")) ||
        "Échec de la publication. Réessaie.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container stack" style={{ paddingTop: 24 }}>
      <h1>Publier un e-book</h1>

      <form className="form" onSubmit={onSubmit}>
        {error && (
          <div className="card" style={{ borderLeft: "4px solid #ef4444" }}>
            {error}
          </div>
        )}

        <label>
          Titre
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            required
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            rows={5}
            value={form.description}
            onChange={onChange}
          />
        </label>

        <label>
          Prix (€)
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={onChange}
          />
        </label>

        <label>
          Fichier PDF (optionnel)
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <div className="row">
          <button className="btn" disabled={loading}>
            {loading ? "Publication..." : "Publier"}
          </button>
          <button
            type="button"
            className="btn outline"
            onClick={() => nav("/ebooks")}
          >
            Annuler
          </button>
        </div>
      </form>
    </section>
  );
}

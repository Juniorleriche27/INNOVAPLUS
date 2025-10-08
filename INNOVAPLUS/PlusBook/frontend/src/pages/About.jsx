import React from "react";

export default function About() {
  return (
    <section className="container stack">
      <h1>À propos de PlusBooks</h1>
      <div className="card stack">
        <p>
          PlusBooks est une plateforme simple pour <strong>publier</strong>,{" "}
          <strong>partager</strong> et <strong>lire</strong> des e-books et des articles.
        </p>
        <ul className="stack" style={{ marginLeft: 16 }}>
          <li>Catalogue public consultable sans compte.</li>
          <li>Téléchargement, publication et commentaires après connexion.</li>
          <li>Messages privés et groupes thématiques (optionnel).</li>
        </ul>
        <p className="muted">Version actuelle : v1</p>
      </div>
    </section>
  );
}

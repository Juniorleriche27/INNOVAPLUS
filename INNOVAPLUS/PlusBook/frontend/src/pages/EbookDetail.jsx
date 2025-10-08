import React from 'react'
import { useParams, Link } from 'react-router-dom'

export default function EbookDetail() {
  const { id } = useParams()

  return (
    <section className="stack">
      <h2>Détail de l’e-book #{id}</h2>
      <p className="muted">Description de l’e-book, informations et actions (acheter / télécharger).</p>
      <div className="row">
        <button className="btn">Acheter / Télécharger</button>
        <Link className="btn outline" to="/ebooks">Retour à la liste</Link>
      </div>
    </section>
  )
}

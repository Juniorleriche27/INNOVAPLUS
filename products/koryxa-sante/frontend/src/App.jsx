import { NavLink } from 'react-router-dom'

export default function App() {
  return (
    <div className="container">
      <header className="header">
        <h1>KORYXA Santé</h1>
        <nav>
          <NavLink to="/" end>Accueil</NavLink>
          <NavLink to="/health">Health</NavLink>
          <NavLink to="/chat">Chat</NavLink>
          <NavLink to="/datasets">Datasets</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </nav>
      </header>
      <section className="card">
        <h2>Bienvenue</h2>
        <p>
          Frontend React (Vite) pour le module Santé, connecté au backend commun.
          Configurez <code>VITE_API_BASE</code> pour pointer vers
          <code>https://api.innovaplus.africa/sante</code> hébergé sur Hetzner.
        </p>
      </section>
    </div>
  )
}

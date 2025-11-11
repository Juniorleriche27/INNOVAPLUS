import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { logout, me } from "../services/api";

export default function Header() {
  const nav = useNavigate();
  const location = useLocation();

  // Initialise depuis le localStorage pour éviter l'état "déconnecté" au premier rendu
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  // Revalide l'utilisateur à chaque changement de route (login/register -> profile)
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return setUser(null);
    me().then(setUser).catch(() => setUser(null));
  }, [location.pathname]);

  // Écoute un éventuel événement global "auth-changed" (utile pour mises à jour instantanées)
  useEffect(() => {
    const onAuth = () => {
      try { setUser(JSON.parse(localStorage.getItem("user"))); }
      catch { setUser(null); }
    };
    window.addEventListener("auth-changed", onAuth);
    return () => window.removeEventListener("auth-changed", onAuth);
  }, []);

  const doLogout = async () => {
    try { await logout(); } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-changed"));
    setUser(null);
    nav("/");
  };

  return (
    <header className="header">
      <div className="container row" style={{justifyContent:"space-between", alignItems:"center"}}>
        <Link to="/" className="brand-wordmark" aria-label="PlusBooks, accueil">
          <span className="plus">Plus</span><span className="dot" /><span className="books">Books</span>
        </Link>

        <nav className="nav">
          <Link to="/">Accueil</Link>
          <Link to="/ebooks">E-books</Link>
          <Link to="/community">Communauté</Link>
          <Link to="/groups">Groupes</Link>
          <Link to="/about">À propos</Link>
          <Link to="/contact">Contact</Link>

          {user && <Link to="/ebooks/new">Publier</Link>}
          {user && <Link to="/messages">Messages</Link>}
          {user ? (
            <>
              <Link to="/profile">Profil</Link>
              <button className="btn outline" onClick={doLogout}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/login">Connexion</Link>
              <Link className="btn" to="/register">Inscription</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

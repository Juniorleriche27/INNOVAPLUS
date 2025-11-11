import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">
        <span>© {year} PlusBooks</span>
        <span>•</span>
        <span>Votre bibliothèque numérique</span>
        <span className="badge">v1</span>
      </div>
    </footer>
  );
}

import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="app-shell">
      {/* En-tête global (Header.jsx gère le wordmark + nav + état user) */}
      <Header />

      {/* Contenu des pages */}
      <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <Outlet />
      </main>

      {/* Pied de page global (Footer.jsx gère le centrage et le badge) */}
      <Footer />
    </div>
  );
}

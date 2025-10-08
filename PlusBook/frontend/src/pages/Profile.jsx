import React, { useEffect, useState } from "react";
import { me } from "../services/api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    localStorage.getItem("user_avatar") || ""
  );

  useEffect(() => {
    me().then(setUser).catch(()=>{});
  }, []);

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setAvatarPreview(dataUrl);
      // En attendant l’API de stockage, on sauvegarde localement
      localStorage.setItem("user_avatar", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  if (!user) return <section className="container">Chargement…</section>;

  return (
    <section className="container stack">
      <h1>Mon tableau de bord</h1>

      <div className="card row" style={{ alignItems: "center", gap: 16 }}>
        <div>
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar"
              style={{ width: 96, height: 96, borderRadius: "999px", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 96, height: 96, borderRadius: "999px",
                background: "var(--gray)", display: "grid", placeItems: "center",
                color: "var(--gray-dark)", fontWeight: 600
              }}
            >
              {String(user.name || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="stack" style={{ flex: 1 }}>
          <div><strong>{user.name}</strong></div>
          <div className="muted">{user.email}</div>
          {user.role && <div>Rôle : <strong>{user.role}</strong></div>}
          {user.domain && <div>Domaine : {user.domain}</div>}
          {user.bio && <div className="muted">{user.bio}</div>}
        </div>

        <div className="stack">
          <label className="btn outline" style={{ cursor: "pointer" }}>
            Changer la photo
            <input type="file" accept="image/*" onChange={onPickAvatar} style={{ display: "none" }} />
          </label>
        </div>
      </div>
    </section>
  );
}

"""
KORYXA Santé — Page À propos.
"""

from __future__ import annotations

import streamlit as st

from streamlit_app.utils.ui import section_header, stat_pills


def about_page() -> None:
    """Render information about the mission, team and compliance."""
    section_header(
        "Notre mission",
        "Accélérer la prise de décision médicale grâce à l'IA responsable, la donnée gouvernée et des interfaces pensées pour les soignants.",
        icon="🌟",
    )

    st.markdown(
        """
        KORYXA Santé combine expertise clinique, data science et expérience utilisateur
        pour offrir une plateforme complète : collecte, préparation, modèles IA, copilote RAG
        et outils de visualisation. L'objectif : aider les praticiens à anticiper, personnaliser
        et sécuriser leurs décisions.
        """
    )

    stat_pills(
        [
            {"label": "Année de création", "value": "2021"},
            {"label": "Équipe", "value": "38 experts"},
            {"label": "Clients", "value": "18 établissements"},
        ]
    )

    section_header(
        "Piliers produit",
        "Les fondamentaux qui guident nos développements et déploiements.",
        icon="🧱",
    )

    col1, col2, col3 = st.columns(3)
    box_style = (
        "background: rgba(255,255,255,0.97); border: 1px solid rgba(226,232,240,0.85);"
        "border-radius: 20px; padding: 1.3rem 1.4rem; box-shadow: 0 16px 38px rgba(15,23,42,0.08);"
    )

    with col1:
        st.markdown(
            f"""
            <div style="{box_style}">
                <h4 style="margin:0; color:#0f172a;">🤝 Humain centric</h4>
                <p style="margin-top:0.65rem; color:#475569;">Expériences pensées avec les soignants, explications claires, copilotes augmentés.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with col2:
        st.markdown(
            f"""
            <div style="{box_style}">
                <h4 style="margin:0; color:#0f172a;">🔐 Confiance & conformité</h4>
                <p style="margin-top:0.65rem; color:#475569;">HDS, RGPD, éthique IA, monitoring continu et gouvernance transparente.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with col3:
        st.markdown(
            f"""
            <div style="{box_style}">
                <h4 style="margin:0; color:#0f172a;">⚡ Impact mesurable</h4>
                <p style="margin-top:0.65rem; color:#475569;">KPIs médicaux et opérationnels suivis en continu pour chaque modèle et usage.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    section_header(
        "Conformité & sécurité",
        "Cadre réglementaire et garanties pour les données de santé.",
        icon="🛡️",
    )

    st.markdown(
        """
        - **Hébergeur de Données de Santé (HDS)** certifié, zone EU-West (Paris)
        - **RGPD** : DPIA réalisé, registre des traitements maintenu, consentements tracés
        - **Sécurité** : chiffrement au repos (AES-256), en transit (TLS 1.2+), IAM Zero Trust
        - **Auditabilité** : journaux d'accès, versioning des modèles, monitoring dérive
        - **Éthique IA** : comité pluridisciplinaire, revues trimestrielles, charte d'usage
        """
    )

    section_header(
        "Équipe & partenaires",
        "Un collectif hybride santé, data et design pour faire vivre la plateforme.",
        icon="🧑‍🤝‍🧑",
    )

    st.markdown(
        """
        - **Direction médicale** : coordination des besoins cliniques, validation des guidelines
        - **Data scientists & MLOps** : conception, monitoring et industrialisation des modèles
        - **Design & produit** : expérience praticien, accessibilité et adoption
        - **Partenaires** : CHU, cliniques privées, instituts de recherche et acteurs de la e-santé
        """
    )

    st.markdown("---")
    st.markdown(
        """
        Besoin d'échanger ? Contactez-nous sur **partenariats@innova.health** ou
        planifiez une démo personnalisée.
        """
    )

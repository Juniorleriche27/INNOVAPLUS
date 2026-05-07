from __future__ import annotations

from typing import Any

from app.services.core_context_adapter import (
    get_guest_enterprise_summary,
    get_guest_trajectory_summary,
    get_user_enterprise_summary,
    get_user_trajectory_summary,
)


def _resolve_owner(current: dict | None, guest_id: str | None) -> dict[str, str]:
    if current:
        return {"user_id": str(current["_id"])}
    if guest_id:
        return {"guest_id": guest_id}
    return {}


def _format_trajectory_context(summary: dict[str, Any] | None) -> str:
    if not summary:
        return "- aucune trajectoire recente disponible"

    next_actions = list(summary.get("next_actions") or [])[:3]
    actions = ", ".join(next_actions) if next_actions else "aucune action prioritaire disponible"
    recommended = summary.get("recommended_trajectory") or "trajectoire non generee"
    readiness = summary.get("readiness_score")

    return (
        f"- objectif: {summary.get('objective') or 'non precise'}\n"
        f"- trajectoire recommandee: {recommended}\n"
        f"- readiness: {readiness if readiness is not None else 'ND'}/100\n"
        f"- statut profil KORYXA: {summary.get('profile_status') or 'not_ready'}\n"
        f"- prochaines actions: {actions}"
    )


def _format_enterprise_context(
    summary: dict[str, Any] | None,
) -> str:
    if not summary:
        return "- aucun besoin entreprise recent disponible"

    return (
        f"- besoin: {summary.get('need_title') or 'sans titre'} ({summary.get('need_status') or 'ND'})\n"
        f"- mission: {summary.get('mission_title') or 'non structuree'} "
        f"({summary.get('mission_status') or 'ND'})"
    )


async def build_chatlaya_product_context(
    current: dict | None,
    guest_id: str | None,
) -> str:
    owner = _resolve_owner(current, guest_id)
    trajectory_summary: dict[str, Any] | None = None
    enterprise_summary: dict[str, Any] | None = None
    if owner.get("user_id"):
        trajectory_summary = get_user_trajectory_summary(owner["user_id"])
        enterprise_summary = get_user_enterprise_summary(owner["user_id"])
    elif owner.get("guest_id"):
        trajectory_summary = get_guest_trajectory_summary(owner["guest_id"])
        enterprise_summary = get_guest_enterprise_summary(owner["guest_id"])

    return (
        "Reperes produit KORYXA :\n"
        "- Accueil = vue d'ensemble de KORYXA, de ses modules et des grandes entrees du site.\n"
        "- Formation IA = parcours d'orientation, diagnostic, progression et prochaines etapes pour les talents.\n"
        "- Entreprise = cadrage d'un besoin, structuration d'une mission et lecture exploitable du contexte entreprise.\n"
        "- Service IA = studio d'execution pour construire et livrer des projets IA de bout en bout.\n"
        "- ChatLAYA = assistant expert du site KORYXA pour expliquer les modules, orienter l'utilisateur et recommander la bonne entree.\n"
        "- A propos = vision, positionnement et logique d'execution de KORYXA.\n"
        "- Voix du terrain africain = collecte structuree de problemes reels observes sur le terrain.\n\n"
        "Regle de guidage :\n"
        "- si l'utilisateur hesite, recommander d'abord la bonne page ou le bon module KORYXA avant de donner des conseils generiques.\n\n"
        "Contexte Blueprint le plus recent :\n"
        f"{_format_trajectory_context(trajectory_summary)}\n\n"
        "Contexte entreprise le plus recent :\n"
        f"{_format_enterprise_context(enterprise_summary)}"
    )

from __future__ import annotations

from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


def _owner_filter(current: dict | None, guest_id: str | None) -> dict[str, Any]:
    if current:
        return {"user_id": current["_id"]}
    if guest_id:
        return {"guest_id": guest_id}
    return {"_id": None}


def _format_trajectory_context(flow: dict[str, Any] | None) -> str:
    if not flow:
        return "- aucune trajectoire recente disponible"

    onboarding = flow.get("onboarding") or {}
    diagnostic = flow.get("diagnostic") or {}
    progress_plan = flow.get("progress_plan") or {}
    verified_profile = flow.get("verified_profile") or {}
    next_actions = list(progress_plan.get("next_actions") or [])[:3]
    actions = ", ".join(next_actions) if next_actions else "aucune action prioritaire disponible"
    recommended = (
        (diagnostic.get("recommended_trajectory") or {}).get("title")
        or "trajectoire non generee"
    )
    readiness = (diagnostic.get("readiness") or {}).get("readiness_score")

    return (
        f"- objectif: {onboarding.get('objective') or 'non precise'}\n"
        f"- trajectoire recommandee: {recommended}\n"
        f"- readiness: {readiness if readiness is not None else 'ND'}/100\n"
        f"- statut profil KORYXA: {verified_profile.get('profile_status') or 'not_ready'}\n"
        f"- prochaines actions: {actions}"
    )


def _format_enterprise_context(
    need: dict[str, Any] | None,
    mission: dict[str, Any] | None,
) -> str:
    if not need:
        return "- aucun besoin entreprise recent disponible"

    return (
        f"- besoin: {need.get('title') or 'sans titre'} ({need.get('status') or 'ND'})\n"
        f"- mission: {(mission or {}).get('title') or 'non structuree'} "
        f"({(mission or {}).get('status') or 'ND'})"
    )


async def build_chatlaya_product_context(
    db: AsyncIOMotorDatabase,
    current: dict | None,
    guest_id: str | None,
) -> str:
    owner = _owner_filter(current, guest_id)
    trajectory_flow = await db["trajectory_flows"].find_one(
        owner,
        sort=[("updated_at", -1)],
    )
    latest_need = await db["enterprise_needs"].find_one(
        owner,
        sort=[("created_at", -1)],
    )
    latest_mission = None
    if latest_need:
        latest_mission = await db["enterprise_missions"].find_one(
            {"need_id": latest_need["_id"]},
        )

    return (
        "Reperes produit KORYXA :\n"
        "- Blueprint = parcours d'orientation, diagnostic, progression et prochaines etapes.\n"
        "- Entreprise = cadrage d'un besoin, structuration d'une mission et lecture exploitable du contexte entreprise.\n"
        "- Service IA = studio d'execution pour construire et livrer des projets IA de bout en bout.\n"
        "- ChatLAYA = copilote conversationnel pour clarifier, cadrer et orienter l'utilisateur dans KORYXA.\n\n"
        "Contexte Blueprint le plus recent :\n"
        f"{_format_trajectory_context(trajectory_flow)}\n\n"
        "Contexte entreprise le plus recent :\n"
        f"{_format_enterprise_context(latest_need, latest_mission)}"
    )

from __future__ import annotations

from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.partner_registry import list_public_partners
from app.services.product_registry import list_public_products


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
    recommended = (diagnostic.get("recommended_trajectory") or {}).get("title") or "trajectoire non générée"
    readiness = (diagnostic.get("readiness") or {}).get("readiness_score")
    return (
        f"- objectif: {onboarding.get('objective') or 'non précisé'}\n"
        f"- trajectoire recommandée: {recommended}\n"
        f"- readiness: {readiness if readiness is not None else 'ND'}/100\n"
        f"- statut profil KORYXA: {verified_profile.get('profile_status') or 'not_ready'}\n"
        f"- prochaines actions: {actions}"
    )


def _format_enterprise_context(need: dict[str, Any] | None, mission: dict[str, Any] | None, opportunity: dict[str, Any] | None) -> str:
    if not need:
        return "- aucun besoin entreprise recent disponible"
    return (
        f"- besoin: {need.get('title') or 'sans titre'} ({need.get('status') or 'ND'})\n"
        f"- mission: {(mission or {}).get('title') or 'non structurée'} ({(mission or {}).get('status') or 'ND'})\n"
        f"- opportunité publique: {(opportunity or {}).get('title') or 'non publiée'}"
    )


async def build_chatlaya_product_context(
    db: AsyncIOMotorDatabase,
    current: dict | None,
    guest_id: str | None,
) -> str:
    owner = _owner_filter(current, guest_id)
    trajectory_flow = await db["trajectory_flows"].find_one(owner, sort=[("updated_at", -1)])
    latest_need = await db["enterprise_needs"].find_one(owner, sort=[("created_at", -1)])
    latest_mission = None
    latest_opportunity = None
    if latest_need:
        latest_mission = await db["enterprise_missions"].find_one({"need_id": latest_need["_id"]})
        latest_opportunity = await db["enterprise_opportunities"].find_one({"need_id": latest_need["_id"]})

    public_products = await list_public_products(db)
    public_partners = await list_public_partners(db)

    product_lines = "\n".join(
        f"- {item['name']}: {item['summary']}" for item in public_products[:2]
    ) or "- aucun produit public trouvé"
    partner_lines = "\n".join(
        f"- {item['name']} ({item['type']}): {item['headline']}" for item in public_partners[:3]
    ) or "- aucun partenaire publié"

    return (
        "Repères produit KORYXA :\n"
        "- Trajectoire = onboarding, diagnostic, partenaires recommandés, progression pilotée, preuves, score, validation et opportunités.\n"
        "- Entreprise = une organisation dépose un besoin ; KORYXA le transforme en mission claire, suivie et éventuellement publiée comme opportunité.\n"
        "- Produits publics visibles = MyPlanningAI et ChatLAYA.\n"
        "- ChatLAYA = copilote d’orientation, de cadrage et d’exécution ; il assiste mais ne remplace pas l’onboarding Trajectoire.\n\n"
        "Produits publics :\n"
        f"{product_lines}\n\n"
        "Partenaires publiés :\n"
        f"{partner_lines}\n\n"
        "Contexte trajectoire le plus récent :\n"
        f"{_format_trajectory_context(trajectory_flow)}\n\n"
        "Contexte entreprise le plus récent :\n"
        f"{_format_enterprise_context(latest_need, latest_mission, latest_opportunity)}"
    )

from __future__ import annotations

"""
Seed initial certificates for KORYXA School of Opportunity.
Usage:
    python -m scripts.seed_school
"""

import asyncio
from datetime import datetime
from typing import List

from bson import ObjectId

from app.core.config import settings
from app.db.mongo import connect_to_mongo, get_db_instance


NOW = datetime.utcnow().isoformat()

CERTIFICATES = [
    {
        "title": "KORYXA Pro – Mindset & Systèmes d’Habitudes",
        "slug": "koryxa-pro-mindset",
        "short_label": "Mindset & Habitudes",
        "description": "Construire la discipline, les routines et la prise de décision pour délivrer dans des environnements contraints.",
        "category": "pro",
        "is_paid": True,
        "estimated_duration": "4-6 semaines",
        "required_evidence_types": [],
        "skills": ["mindset", "habits", "execution"],
    },
    {
        "title": "KORYXA Impact – Défis & Opportunités Africaines",
        "slug": "koryxa-impact-opportunites",
        "short_label": "Défis & Opportunités",
        "description": "Lire les signaux terrain, cadrer un défi et proposer des pistes d’impact rapide.",
        "category": "pro",
        "is_paid": True,
        "estimated_duration": "4-6 semaines",
        "required_evidence_types": ["project_link"],
        "skills": ["impact", "problem_framing", "field_ops"],
    },
    {
        "title": "KORYXA Design – Résolution de Problèmes & Innovation Humaine",
        "slug": "koryxa-design-problemes",
        "short_label": "Design & Problèmes",
        "description": "Méthodes de design orientées terrain, prototypage rapide et validation frugale.",
        "category": "pro",
        "is_paid": True,
        "estimated_duration": "4-6 semaines",
        "required_evidence_types": ["project_link"],
        "skills": ["design_thinking", "prototyping", "ux"],
    },
    {
        "title": "KORYXA Digital – Recherche Web & Outils Data de Base",
        "slug": "koryxa-digital-data-basics",
        "short_label": "Recherche & Data",
        "description": "Savoir trouver, nettoyer et analyser des données web pour éclairer une décision.",
        "category": "pro",
        "is_paid": True,
        "estimated_duration": "3-4 semaines",
        "required_evidence_types": ["project_link"],
        "skills": ["web_research", "data_basics", "spreadsheets"],
    },
    {
        "title": "KORYXA Team – Communication, Storytelling & Collaboration",
        "slug": "koryxa-team-communication",
        "short_label": "Storytelling & Collaboration",
        "description": "Structurer des récits courts, clarifier les décisions et collaborer en asynchrone.",
        "category": "pro",
        "is_paid": True,
        "estimated_duration": "3-4 semaines",
        "required_evidence_types": ["text_response"],
        "skills": ["communication", "storytelling", "collaboration"],
    },
    {
        "title": "KORYXA Life – Développement Personnel pour l’Impact",
        "slug": "koryxa-life-impact",
        "short_label": "Life & Impact",
        "description": "Ancrer des routines personnelles, hygiène mentale et énergie pour durer.",
        "category": "life",
        "is_paid": False,
        "estimated_duration": "3 semaines",
        "required_evidence_types": [],
        "skills": ["life_design", "habits", "energy"],
    },
    {
        "title": "KORYXA Business – Modèles Économiques & Business Plan",
        "slug": "koryxa-business-models",
        "short_label": "Business Models",
        "description": "Comprendre les briques d’un modèle économique et structurer un plan frugal.",
        "category": "business",
        "is_paid": True,
        "estimated_duration": "4-6 semaines",
        "required_evidence_types": ["project_link"],
        "skills": ["business_model", "unit_economics", "gtm"],
    },
    {
        "title": "KORYXA Passeport – CV, Pitch & Portfolio",
        "slug": "koryxa-passeport",
        "short_label": "Passeport",
        "description": "Mettre à jour son CV, clarifier son pitch et consolider un portfolio.",
        "category": "explorer",
        "is_paid": False,
        "estimated_duration": "2 semaines",
        "required_evidence_types": ["project_link"],
        "skills": ["cv", "pitch", "portfolio"],
    },
    {
        "title": "KORYXA Explorer – Métiers de la Donnée & du Big Data",
        "slug": "koryxa-explorer-data",
        "short_label": "Explorer Data",
        "description": "Panorama des métiers data, pipelines et outils pour débuter.",
        "category": "explorer",
        "is_paid": False,
        "estimated_duration": "2-3 semaines",
        "required_evidence_types": [],
        "skills": ["data_basics", "data_roles"],
    },
    {
        "title": "KORYXA Explorer – Métiers du Cloud & d’AWS",
        "slug": "koryxa-explorer-cloud",
        "short_label": "Explorer Cloud",
        "description": "Notions fondamentales du cloud, AWS et architectures simples.",
        "category": "explorer",
        "is_paid": False,
        "estimated_duration": "2-3 semaines",
        "required_evidence_types": [],
        "skills": ["cloud", "aws_intro"],
    },
    {
        "title": "KORYXA Explorer – Métiers du Software Engineering",
        "slug": "koryxa-explorer-software",
        "short_label": "Explorer Software",
        "description": "Panorama des rôles d’ingénierie logicielle et pratiques essentielles.",
        "category": "explorer",
        "is_paid": False,
        "estimated_duration": "2-3 semaines",
        "required_evidence_types": [],
        "skills": ["software_engineering"],
    },
    {
        "title": "KORYXA Explorer – Métiers de la Cybersécurité",
        "slug": "koryxa-explorer-cyber",
        "short_label": "Explorer Cyber",
        "description": "Bases de la sécurité, menaces courantes et parcours de formation.",
        "category": "explorer",
        "is_paid": False,
        "estimated_duration": "2-3 semaines",
        "required_evidence_types": [],
        "skills": ["cybersecurity"],
    },
    {
        "title": "KORYXA Explorer – Salesforce & Creative Tech",
        "slug": "koryxa-explorer-salesforce",
        "short_label": "Explorer Salesforce",
        "description": "Découverte de l’écosystème Salesforce et des métiers associées + creative tech.",
        "category": "explorer",
        "is_paid": False,
        "estimated_duration": "2-3 semaines",
        "required_evidence_types": [],
        "skills": ["salesforce", "creative_tech"],
    },
]


def _lesson_block(certificate_id: str, title: str, lesson_type: str, summary: str, order: int, resource: dict | None = None):
    lesson_id = ObjectId()
    lesson_doc = {
        "_id": lesson_id,
        "certificate_id": certificate_id,
        "module_id": None,  # filled by caller
        "title": title,
        "lesson_type": lesson_type,
        "order_index": order,
        "summary": summary,
    }
    resource_doc = None
    if resource:
        resource_doc = {
            "_id": ObjectId(),
            "certificate_id": certificate_id,
            "lesson_id": str(lesson_id),
            **resource,
        }
    return lesson_doc, resource_doc


def _module_block(certificate_id: str, title: str, description: str, order: int, lessons: List[dict]):
    module_id = ObjectId()
    module_doc = {
        "_id": module_id,
        "certificate_id": certificate_id,
        "title": title,
        "description": description,
        "order_index": order,
    }
    for lesson in lessons:
        lesson["module_id"] = str(module_id)
    return module_doc, lessons


async def seed_certificate(db, cert_def: dict, order_index: int) -> None:
    existing = await db["certificate_programs"].find_one({"slug": cert_def["slug"]})
    base_doc = {
        "title": cert_def["title"],
        "slug": cert_def["slug"],
        "short_label": cert_def.get("short_label"),
        "description": cert_def.get("description"),
        "category": cert_def["category"],
        "is_paid": cert_def.get("is_paid", False),
        "price": cert_def.get("price"),
        "estimated_duration": cert_def.get("estimated_duration"),
        "status": "published",
        "required_evidence_types": cert_def.get("required_evidence_types", []),
        "skills": cert_def.get("skills", []),
        "order_index": order_index,
    }

    if existing:
        cert_id = str(existing["_id"])
        await db["certificate_programs"].update_one({"_id": existing["_id"]}, {"$set": base_doc})
    else:
        res = await db["certificate_programs"].insert_one(base_doc)
        cert_id = str(res.inserted_id)

    # Skill links
    for skill_slug in cert_def.get("skills", []):
        await db["certificate_skill_links"].update_one(
            {"certificate_id": cert_id, "skill_slug": skill_slug},
            {"$set": {"certificate_id": cert_id, "skill_slug": skill_slug}},
            upsert=True,
        )

    # Simple default module + lessons if none exist
    module_exists = await db["certificate_modules"].count_documents({"certificate_id": cert_id})
    if module_exists == 0:
        intro_lesson, intro_resource = _lesson_block(
            cert_id,
            "Présentation",
            "internal_text",
            "Objectifs du certificat et modalités.",
            1,
            {
                "resource_type": "internal_text",
                "content_text": f"Bienvenue dans {cert_def['title']}. Ce parcours est data-driven et évolutif.",
            },
        )
        resource_list = [intro_resource] if intro_resource else []

        apply_lesson, apply_resource = _lesson_block(
            cert_id,
            "Ressource clé",
            "external_article",
            "Lecture essentielle pour commencer.",
            2,
            {
                "resource_type": "external_article",
                "url": "https://www.notion.so/",
                "metadata": {"title": "Guide de démarrage", "source": "Notion"},
            },
        )
        resource_list.append(apply_resource)

        module_doc, lessons = _module_block(
            cert_id,
            "Module 1 — Base",
            "Structure minimale pour démarrer le certificat.",
            1,
            [intro_lesson, apply_lesson],
        )

        await db["certificate_modules"].insert_one(module_doc)
        await db["certificate_lessons"].insert_many(lessons)
        await db["lesson_resources"].insert_many([r for r in resource_list if r])


async def main():
    await connect_to_mongo()
    db = get_db_instance()
    for idx, cert in enumerate(CERTIFICATES, start=1):
        await seed_certificate(db, cert, idx)
    print(f"Seeded {len(CERTIFICATES)} certificates.")


if __name__ == "__main__":
    asyncio.run(main())

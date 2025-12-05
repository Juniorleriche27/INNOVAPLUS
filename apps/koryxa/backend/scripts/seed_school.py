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
        "short_description": "Discipline, routines, prise de décision sous contrainte.",
        "category": "pro",
        "is_paid": True,
        "estimated_duration": "4-6 semaines",
        "required_evidence_types": ["project_link"],
        "skills": ["mindset", "habits", "execution"],
    },
    {
        "title": "KORYXA Impact – Défis & Opportunités Africaines",
        "slug": "koryxa-impact-opportunites",
        "short_label": "Défis & Opportunités",
        "description": "Lire les signaux terrain, cadrer un défi et proposer des pistes d’impact rapide.",
        "short_description": "Lire les signaux terrain, cadrer un défi, proposer des pistes d’impact.",
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
        "short_description": "Design terrain, prototypage rapide, validation frugale.",
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
        "short_description": "Trouver, nettoyer et analyser des données web pour décider.",
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
        "short_description": "Récits courts, décisions claires, collaboration asynchrone.",
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
        "short_description": "Routines personnelles, hygiène mentale, énergie durable.",
        "category": "life",
        "is_paid": True,
        "estimated_duration": "3 semaines",
        "required_evidence_types": [],
        "skills": ["life_design", "habits", "energy"],
    },
    {
        "title": "KORYXA Business – Modèles Économiques & Business Plan",
        "slug": "koryxa-business-models",
        "short_label": "Business Models",
        "description": "Comprendre les briques d’un modèle économique et structurer un plan frugal.",
        "short_description": "Briques de modèle économique et plan frugal.",
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
        "short_description": "CV, pitch et portfolio prêts à l’emploi.",
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
        "short_description": "Panorama des métiers data, pipelines et outils de départ.",
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
        "short_description": "Bases du cloud, AWS et architectures simples.",
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
        "short_description": "Rôles d’ingénierie logicielle et pratiques essentielles.",
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
        "short_description": "Bases de la sécurité, menaces courantes, parcours de formation.",
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
        "short_description": "Découvrir l’écosystème Salesforce et la creative tech.",
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


async def _seed_mindset_cert(db, cert_id: str) -> None:
    """Seed full modules/lessons/resources for KORYXA Pro – Mindset & Systèmes d’Habitudes."""
    await db["certificate_modules"].delete_many({"certificate_id": cert_id})
    await db["certificate_lessons"].delete_many({"certificate_id": cert_id})
    await db["lesson_resources"].delete_many({"certificate_id": cert_id})

    modules_payload = []
    resources_payload = []

    # Module 1 – Comprendre le Mindset & le Cerveau qui Apprend
    m1_lessons = []
    l11, r11 = _lesson_block(cert_id, "Pourquoi ce certificat & comment l’utiliser", "internal_text", "Présentation du parcours et lien avec l’emploi infini et KORYXA.", 1, {
        "resource_type": "internal_text",
        "content_text": "Bienvenue dans KORYXA Pro – Mindset & Habitudes. Ce parcours t’aide à bâtir un système personnel pour apprendre, livrer et tenir dans la durée.",
    })
    m1_lessons.append(l11)
    if r11:
        resources_payload.append(r11)

    l12, r12 = _lesson_block(cert_id, "Mindset fixe vs mindset de croissance", "external_article", "Différence entre mindset fixe et croissance, inspiré de Carol Dweck.", 2, {
        "resource_type": "external_article",
        "url": "https://teachingcommons.stanford.edu/resources/learning/mindset",
        "metadata": {"title": "Growth mindset expliqué simplement", "source": "Teaching Commons"},
    })
    m1_lessons.append(l12)
    if r12:
        resources_payload.append(r12)
    # Add internal text snippet for growth mindset
    r12b = {
        "_id": ObjectId(),
        "certificate_id": cert_id,
        "lesson_id": str(l12["_id"]),
        "resource_type": "internal_text",
        "content_text": "Mindset de croissance: l’intelligence se développe par l’effort stratégique, feedback et itérations. Le progrès est le signal.",
    }
    resources_payload.append(r12b)

    l13, r13 = _lesson_block(cert_id, "Neuroplasticité : le cerveau se modifie avec la pratique", "youtube_video", "Vidéo/article montrant que le cerveau reste plastique à l’âge adulte.", 3, {
        "resource_type": "youtube_video",
        "url": "https://www.youtube.com/watch?v=ELpfYCZa87g",
        "metadata": {"title": "Neuroplasticité et apprentissage", "source": "YouTube"},
    })
    m1_lessons.append(l13)
    if r13:
        resources_payload.append(r13)

    l14, r14 = _lesson_block(cert_id, "Croyances limitantes & réécriture", "internal_text", "Lister 3 croyances limitantes et les reformuler en version croissance.", 4, {
        "resource_type": "internal_text",
        "content_text": "Exercice: écris 3 croyances («Je ne suis pas bon en…») puis reformule-les («Je peux progresser si…»).",
    })
    m1_lessons.append(l14)
    if r14:
        resources_payload.append(r14)

    m1, m1_lessons = _module_block(cert_id, "Module 1 – Mindset & Cerveau", "Comprendre mindset de croissance et neuroplasticité.", 1, m1_lessons)
    modules_payload.append(m1)

    # Module 2 – Construire des Habitudes qui Tiennent (Tiny Habits & B=MAP)
    m2_lessons = []
    l21, r21 = _lesson_block(cert_id, "Comment naît un comportement : B = MAP", "external_article", "Modèle BJ Fogg: Motivation, Ability, Prompt.", 1, {
        "resource_type": "external_article",
        "url": "https://behaviormodel.org/",
        "metadata": {"title": "Fogg Behavior Model", "source": "Stanford / BJ Fogg"},
    })
    m2_lessons.append(l21)
    if r21:
        resources_payload.append(r21)
    r21b = {
        "_id": ObjectId(),
        "certificate_id": cert_id,
        "lesson_id": str(l21["_id"]),
        "resource_type": "internal_text",
        "content_text": "B = MAP : Motivation, Ability, Prompt. Ajuste ability (rendre facile) et crée un prompt clair pour sécuriser l’action.",
    }
    resources_payload.append(r21b)

    l22, r22 = _lesson_block(cert_id, "Tiny Habits : commencer ridiculement petit", "external_article", "Micro-habitudes ancrées sur une routine existante.", 2, {
        "resource_type": "external_article",
        "url": "https://www.tinyhabits.com/next-steps/",
        "metadata": {"title": "Tiny Habits guide", "source": "BJ Fogg"},
    })
    m2_lessons.append(l22)
    if r22:
        resources_payload.append(r22)

    l23, r23 = _lesson_block(cert_id, "Designer 3 mini-habitudes", "internal_text", "Créer 3 habitudes: apprentissage, santé/énergie, projet KORYXA.", 3, {
        "resource_type": "internal_text",
        "content_text": "Choisis 3 tiny habits (1 apprentissage, 1 énergie, 1 projet). Formule-les: «Après [routine], je ferai [micro-action de 30s]».",
    })
    m2_lessons.append(l23)
    if r23:
        resources_payload.append(r23)

    l24, r24 = _lesson_block(cert_id, "Gérer les obstacles : motivation en baisse", "internal_text", "Réduire la taille de l’habitude, ajuster l’environnement, prompts visuels.", 4, {
        "resource_type": "internal_text",
        "content_text": "Plan anti-obstacles: réduire la taille, préparer matériel, placer un rappel visuel, lier à une routine fixe.",
    })
    m2_lessons.append(l24)
    if r24:
        resources_payload.append(r24)

    m2, m2_lessons = _module_block(cert_id, "Module 2 – Habitudes qui tiennent", "Tiny Habits et B=MAP pour installer des routines.", 2, m2_lessons)
    modules_payload.append(m2)

    # Module 3 – Rituels d’écriture & clarté
    m3_lessons = []
    l31, r31 = _lesson_block(cert_id, "Pourquoi écrire chaque jour ?", "external_article", "Bénéfices du journaling sur clarté mentale et stress.", 1, {
        "resource_type": "external_article",
        "url": "https://www.vox.com/future-perfect/2018/7/25/17593884/journaling-mental-health-anxiety-depression-benefits",
        "metadata": {"title": "Journaling et bien-être", "source": "Vox"},
    })
    m3_lessons.append(l31)
    if r31:
        resources_payload.append(r31)
    r31b = {
        "_id": ObjectId(),
        "certificate_id": cert_id,
        "lesson_id": str(l31["_id"]),
        "resource_type": "internal_text",
        "content_text": "Le journaling réduit le stress, clarifie les idées, aide la régulation émotionnelle. 5 minutes suffisent pour débuter.",
    }
    resources_payload.append(r31b)

    l32, r32 = _lesson_block(cert_id, "Les “Morning Pages” de Julia Cameron", "youtube_video", "3 pages manuscrites le matin, sans censure.", 2, {
        "resource_type": "youtube_video",
        "url": "https://www.youtube.com/watch?v=K7r6v6dUQpw",
        "metadata": {"title": "Morning Pages expliquées", "source": "YouTube"},
    })
    m3_lessons.append(l32)
    if r32:
        resources_payload.append(r32)

    l33, r33 = _lesson_block(cert_id, "Adapter le rituel à la réalité locale", "internal_text", "Faire sans matériel coûteux: feuilles recyclées, carnet simple, téléphone si besoin.", 3, {
        "resource_type": "internal_text",
        "content_text": "Pas de carnet ? Utilise des feuilles simples ou ton téléphone. Objectif: 5-10 minutes, pas de perfection.",
    })
    m3_lessons.append(l33)
    if r33:
        resources_payload.append(r33)

    l34, r34 = _lesson_block(cert_id, "Challenge 7 jours : journal d’apprentissage & d’opportunités", "project_brief", "Écrire chaque jour: ce que tu as appris, un problème vu, une idée d’action.", 4, {
        "resource_type": "internal_text",
        "content_text": "Pendant 7 jours, note: 1) ce que tu as appris, 2) un problème dans ton environnement, 3) une micro-idée d’action.",
    })
    m3_lessons.append(l34)
    if r34:
        resources_payload.append(r34)

    m3, m3_lessons = _module_block(cert_id, "Module 3 – Rituels d’écriture", "Journaling, morning pages et adaptation locale.", 3, m3_lessons)
    modules_payload.append(m3)

    # Module 4 – Priorisation, énergie & système quotidien
    m4_lessons = []
    l41, r41 = _lesson_block(cert_id, "Temps, énergie, attention : les 3 ressources", "internal_text", "Comprendre que l’attention prime sur le temps.", 1, {
        "resource_type": "internal_text",
        "content_text": "On ne gère pas que le temps: l’énergie et l’attention sont clés. Protéger 1 bloc focus par jour.",
    })
    m4_lessons.append(l41)
    if r41:
        resources_payload.append(r41)

    l42, r42 = _lesson_block(cert_id, "Prioriser quand tout est urgent", "internal_text", "Cadres simples type MoSCoW/Daily 3 adaptés KORYXA.", 2, {
        "resource_type": "internal_text",
        "content_text": "Priorise avec 3 items par jour: 1 critique, 1 importante, 1 rapide. Tout le reste est optionnel.",
    })
    m4_lessons.append(l42)
    if r42:
        resources_payload.append(r42)

    l43, r43 = _lesson_block(cert_id, "Construire une journée “KORYXA Pro”", "internal_text", "Une journée type: apprentissage, projet/opportunité, bien-être.", 3, {
        "resource_type": "internal_text",
        "content_text": "Plan-type: 1 bloc apprentissage (30-60min), 1 bloc projet/opportunité, 1 bloc bien-être/récup.",
    })
    m4_lessons.append(l43)
    if r43:
        resources_payload.append(r43)

    l44, r44 = _lesson_block(cert_id, "Bilan hebdo : ce qui marche, ce qui bloque", "internal_text", "Questions guidées pour ajuster.", 4, {
        "resource_type": "internal_text",
        "content_text": "Chaque semaine: Qu’est-ce qui a changé ? Qu’ai-je tenu ? Qu’est-ce qui bloque ? Que vais-je ajuster ?",
    })
    m4_lessons.append(l44)
    if r44:
        resources_payload.append(r44)

    m4, m4_lessons = _module_block(cert_id, "Module 4 – Système quotidien", "Priorisation, énergie, journée type et bilans.", 4, m4_lessons)
    modules_payload.append(m4)

    # Module 5 – Projet final
    m5_lessons = []
    l51, r51 = _lesson_block(cert_id, "Concevoir ton plan 30 jours", "project_brief", "Intention principale, 3 tiny habits, rituel d’écriture, bilan hebdo.", 1, {
        "resource_type": "internal_text",
        "content_text": "Plan 30 jours: intention, 3 tiny habits, rituel d’écriture quotidien, bilan hebdo planifié.",
    })
    m5_lessons.append(l51)
    if r51:
        resources_payload.append(r51)

    l52, r52 = _lesson_block(cert_id, "Soumettre ta preuve KORYXA", "project_brief", "Photo/scan de journal, capture planning, paragraphe de bilan.", 2, {
        "resource_type": "internal_text",
        "content_text": "Preuve: photo/scan d’une page de journal (sans infos sensibles), capture de planning/suivi, paragraphe de bilan.",
    })
    m5_lessons.append(l52)
    if r52:
        resources_payload.append(r52)

    m5, m5_lessons = _module_block(cert_id, "Module 5 – Projet final", "Plan 30 jours et preuve finale.", 5, m5_lessons)
    modules_payload.append(m5)

    # Insert all
    if modules_payload:
        await db["certificate_modules"].insert_many(modules_payload)
    all_lessons = m1_lessons + m2_lessons + m3_lessons + m4_lessons + m5_lessons
    if all_lessons:
        await db["certificate_lessons"].insert_many(all_lessons)
    if resources_payload:
        await db["lesson_resources"].insert_many(resources_payload)


async def seed_certificate(db, cert_def: dict, order_index: int) -> None:
    existing = await db["certificate_programs"].find_one({"slug": cert_def["slug"]})
    base_doc = {
        "title": cert_def["title"],
        "slug": cert_def["slug"],
        "short_label": cert_def.get("short_label"),
        "description": cert_def.get("description"),
        "short_description": cert_def.get("short_description"),
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
    if cert_def["slug"] == "koryxa-pro-mindset":
        await _seed_mindset_cert(db, cert_id)
    elif module_exists == 0:
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

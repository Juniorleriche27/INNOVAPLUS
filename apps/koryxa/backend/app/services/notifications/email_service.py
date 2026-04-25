from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.core.email import send_email_async

logger = logging.getLogger(__name__)

_QUALITY_EMOJI: dict[str, str] = {
    "excellent": "Excellent",
    "bon": "Bon",
    "moyen": "Moyen",
    "faible": "Faible",
}


def _build_html(
    *,
    filename: str,
    score: int,
    level: str,
    insight_count: int,
    recommendation_count: int,
    job_url: str,
) -> str:
    level_label = _QUALITY_EMOJI.get(level.lower(), level)
    return f"""
    <html><body style="font-family:sans-serif;color:#333;max-width:560px;margin:auto">
      <h2 style="color:#1a1a2e">Votre analyse est prete</h2>
      <p>Le fichier <strong>{filename}</strong> a ete analyse avec succes.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr>
          <td style="padding:8px;background:#f5f5f5;font-weight:bold">Score qualite</td>
          <td style="padding:8px"><strong>{score}/100</strong> — {level_label}</td>
        </tr>
        <tr>
          <td style="padding:8px;background:#f5f5f5;font-weight:bold">Insights</td>
          <td style="padding:8px">{insight_count} detecte(s)</td>
        </tr>
        <tr>
          <td style="padding:8px;background:#f5f5f5;font-weight:bold">Recommandations</td>
          <td style="padding:8px">{recommendation_count} generee(s)</td>
        </tr>
      </table>
      <a href="{job_url}"
         style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;
                border-radius:6px;text-decoration:none;font-weight:bold">
        Voir le rapport complet
      </a>
      <p style="color:#999;font-size:12px;margin-top:24px">
        Ce message est envoye automatiquement par KORYXA.
      </p>
    </body></html>
    """


def _build_text(
    *,
    filename: str,
    score: int,
    level: str,
    insight_count: int,
    recommendation_count: int,
    job_url: str,
) -> str:
    return (
        f"Votre analyse est prete.\n\n"
        f"Fichier         : {filename}\n"
        f"Score qualite   : {score}/100 — {level}\n"
        f"Insights        : {insight_count}\n"
        f"Recommandations : {recommendation_count}\n\n"
        f"Voir le rapport : {job_url}\n"
    )

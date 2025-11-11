"""
UI helper utilities for the KORYXA Santé Streamlit experience.
"""

from __future__ import annotations

from html import escape
from typing import Iterable, Mapping, Optional, Sequence

import streamlit as st


def inject_app_css() -> None:
    """Push the global design tokens and components styling into the app."""
    st.markdown(
        """
        <style>
        :root {
            --surface-page: #f8fafc;
            --surface-muted: #e2e8f0;
            --surface-card: #ffffff;
            --surface-chip: rgba(226, 232, 240, 0.68);
            --surface-chip-strong: rgba(148, 163, 184, 0.22);
            --text-strong: #0f172a;
            --text-default: #1e293b;
            --text-muted: #475569;
            --text-soft: #64748b;
            --accent-primary: #2563eb;
            --accent-secondary: #0ea5e9;
            --accent-gradient: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%);
            --shadow-soft: 0 20px 45px rgba(15, 23, 42, 0.08);
        }

        html, body {
            background: var(--surface-page);
        }

        [data-testid="stAppViewContainer"] > .main {
            background: linear-gradient(140deg, #f8fafc 0%, #eef2ff 45%, #e0f2fe 100%);
            padding: 2.8rem 3.4rem 4rem 3.4rem;
            color: var(--text-default);
        }

        [data-testid="stHeader"], [data-testid="stToolbar"], #MainMenu {
            display: none;
        }

        [data-testid="stSidebar"] {
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(14px);
            border-right: 1px solid rgba(226, 232, 240, 0.9);
        }

        [data-testid="stSidebar"] > div:first-child {
            padding: 2.2rem 1.6rem 2.6rem;
        }

        [data-testid="stSidebarNav"] {
            display: none;
        }

        [data-testid="stSidebar"] .stRadio {
            width: 100%;
        }

        [data-testid="stSidebar"] .stRadio > label {
            color: var(--text-muted);
            font-size: 0.78rem;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }

        [data-testid="stSidebar"] .stRadio div[role="radiogroup"] {
            display: grid;
            gap: 0.55rem;
            margin-top: 0.4rem;
        }

        [data-testid="stSidebar"] .stRadio div[role="radiogroup"] > label {
            background: rgba(226, 232, 240, 0.6);
            border-radius: 14px;
            border: 1px solid rgba(226, 232, 240, 0.85);
            padding: 0.75rem 0.85rem;
            font-weight: 600;
            color: var(--text-muted);
            transition: all 0.2s ease;
        }

        [data-testid="stSidebar"] .stRadio div[role="radiogroup"] > label:hover {
            border-color: rgba(37, 99, 235, 0.45);
            background: rgba(59, 130, 246, 0.12);
            color: var(--text-default);
        }

        [data-testid="stSidebar"] .stRadio div[role="radiogroup"] > label:has(input[checked]) {
            border-color: rgba(37, 99, 235, 0.65);
            background: rgba(37, 99, 235, 0.16);
            color: var(--text-strong);
            box-shadow: 0 14px 28px rgba(37, 99, 235, 0.15);
        }

        .sidebar-section {
            margin-top: 1.8rem;
            padding: 1.2rem 1.1rem;
            border-radius: 18px;
            background: rgba(248, 250, 252, 0.92);
            border: 1px solid rgba(226, 232, 240, 0.85);
            box-shadow: var(--shadow-soft);
        }

        .sidebar-section-title {
            font-size: 0.75rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--text-muted);
        }

        .sidebar-section-value {
            margin-top: 0.35rem;
            font-size: 1.05rem;
            font-weight: 700;
            color: var(--text-strong);
        }

        .sidebar-status {
            list-style: none;
            padding: 0;
            margin: 0.75rem 0 0;
            display: grid;
            gap: 0.45rem;
            font-size: 0.85rem;
            color: var(--text-soft);
        }

        .sidebar-footer {
            margin-top: 2.2rem;
            font-size: 0.82rem;
            color: var(--text-muted);
        }

        .sidebar-footer a {
            color: var(--accent-primary);
            text-decoration: none;
            font-weight: 600;
        }

        .sidebar-footer a:hover {
            color: #1d4ed8;
        }

        .top-nav {
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1.6rem;
            padding: 1.4rem 2rem;
            margin-bottom: 1.8rem;
            background: rgba(255, 255, 255, 0.96);
            border-radius: 24px;
            border: 1px solid rgba(226, 232, 240, 0.85);
            box-shadow: var(--shadow-soft);
        }

        .top-nav .brand {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .brand-logo {
            width: 52px;
            height: 52px;
            border-radius: 18px;
            background: var(--accent-gradient);
            color: #ffffff;
            display: grid;
            place-items: center;
            font-size: 1.55rem;
            font-weight: 700;
        }

        .brand-meta {
            display: flex;
            flex-direction: column;
        }

        .brand-title {
            margin: 0;
            font-size: 1.35rem;
            font-weight: 700;
            color: var(--text-strong);
        }

        .brand-subtitle {
            margin: 0.1rem 0 0;
            font-size: 0.9rem;
            color: var(--text-muted);
        }

        .nav-tabs {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
        }

        .nav-tab {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            padding: 0.55rem 1.05rem;
            border-radius: 999px;
            background: var(--surface-chip);
            border: 1px solid rgba(226, 232, 240, 0.8);
            font-size: 0.86rem;
            font-weight: 600;
            color: var(--text-muted);
        }

        .nav-tab.active {
            background: rgba(37, 99, 235, 0.16);
            color: var(--accent-primary);
            border-color: rgba(37, 99, 235, 0.45);
            box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
        }

        .app-hero {
            margin-top: 0.8rem;
            padding: 2rem 2.2rem;
            background: rgba(255, 255, 255, 0.94);
            border-radius: 26px;
            border: 1px solid rgba(226, 232, 240, 0.85);
            box-shadow: var(--shadow-soft);
        }

        .hero-title {
            font-size: 2rem;
            font-weight: 700;
            margin: 0;
            color: var(--text-strong);
        }

        .hero-subtitle {
            margin-top: 0.75rem;
            font-size: 1.02rem;
            line-height: 1.6;
            color: var(--text-soft);
            max-width: 860px;
        }

        .chip-collection {
            margin-top: 1.2rem;
            display: flex;
            gap: 0.55rem;
            flex-wrap: wrap;
        }

        .section-chip {
            font-size: 0.78rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 0.38rem 0.9rem;
            border-radius: 999px;
            background: var(--surface-chip-strong);
            border: 1px solid rgba(203, 213, 225, 0.7);
            color: var(--text-muted);
            font-weight: 600;
        }

        .metric-grid {
            display: grid;
            gap: 1.1rem;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            margin-top: 1.2rem;
        }

        .metric-card {
            position: relative;
            padding: 1.4rem 1.5rem;
            border-radius: 22px;
            background: var(--surface-card);
            border: 1px solid rgba(226, 232, 240, 0.85);
            box-shadow: var(--shadow-soft);
            transition: transform 0.18s ease, box-shadow 0.2s ease;
        }

        .metric-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 26px 52px rgba(15, 23, 42, 0.12);
        }

        .metric-icon {
            font-size: 1.4rem;
            margin-bottom: 0.6rem;
        }

        .metric-title {
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-muted);
            font-weight: 600;
        }

        .metric-value {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--text-strong);
            margin-top: 0.3rem;
        }

        .metric-delta {
            margin-top: 0.45rem;
            font-size: 0.85rem;
            color: var(--accent-primary);
        }

        .metric-helper {
            margin-top: 0.45rem;
            font-size: 0.8rem;
            color: var(--text-soft);
        }

        .section-header {
            margin: 2.3rem 0 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }

        .section-title {
            font-size: 1.28rem;
            font-weight: 600;
            color: var(--text-strong);
            display: flex;
            align-items: center;
            gap: 0.65rem;
        }

        .section-title span {
            font-size: 1.35rem;
        }

        .section-subtitle {
            font-size: 0.95rem;
            color: var(--text-muted);
            max-width: 860px;
            line-height: 1.6;
        }

        .app-footer {
            margin-top: 3rem;
            padding: 1.2rem 0 0.6rem;
            text-align: center;
            color: var(--text-muted);
            border-top: 1px solid rgba(203, 213, 225, 0.75);
        }

        .app-footer strong {
            color: var(--text-strong);
        }

        [data-testid="stTable"] table,
        [data-testid="stDataFrame"] table {
            border: 1px solid rgba(226, 232, 240, 0.85);
            border-radius: 16px;
            overflow: hidden;
        }

        [data-testid="stTable"] table thead th,
        [data-testid="stDataFrame"] table thead th {
            background: rgba(37, 99, 235, 0.08);
            color: var(--text-default);
        }

        [data-testid="stChatMessage"] {
            background: rgba(255, 255, 255, 0.94);
            border: 1px solid rgba(226, 232, 240, 0.85);
            border-radius: 18px;
            padding: 1rem 1.1rem;
            box-shadow: var(--shadow-soft);
        }

        [data-testid="stChatMessage"] + [data-testid="stChatMessage"] {
            margin-top: 1rem;
        }

        [data-testid="stChatInput"] > div {
            background: rgba(255, 255, 255, 0.96);
            border: 1px solid rgba(226, 232, 240, 0.9);
            border-radius: 16px;
            box-shadow: var(--shadow-soft);
        }

        [data-testid="stChatInput"] textarea {
            background: transparent;
            color: var(--text-default);
        }

        .analysis-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.45rem 0.85rem;
            border-radius: 12px;
            background: rgba(148, 163, 184, 0.18);
            color: var(--text-muted);
            font-size: 0.82rem;
            font-weight: 600;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def page_header(title: str, subtitle: str, highlights: Optional[Sequence[str]] = None) -> None:
    """Render the hero section for the currently active page."""
    chips_html = ""
    if highlights:
        chips = "".join(
            f"<span class='section-chip'>{escape(highlight)}</span>"
            for highlight in highlights
        )
        chips_html = f"<div class='chip-collection'>{chips}</div>"

    st.markdown(
        f"""
        <section class="app-hero">
            <h1 class="hero-title">{escape(title)}</h1>
            <p class="hero-subtitle">{escape(subtitle)}</p>
            {chips_html}
        </section>
        """,
        unsafe_allow_html=True,
    )


def section_header(title: str, subtitle: Optional[str] = None, *, icon: Optional[str] = None) -> None:
    """Render a consistent section header block."""
    icon_html = f"<span>{escape(icon)}</span>" if icon else ""
    subtitle_html = (
        f"<p class='section-subtitle'>{escape(subtitle)}</p>"
        if subtitle
        else ""
    )
    st.markdown(
        f"""
        <div class="section-header">
            <h3 class="section-title">{icon_html}{escape(title)}</h3>
            {subtitle_html}
        </div>
        """,
        unsafe_allow_html=True,
    )


def metric_cards(metrics: Sequence[Mapping[str, str]]) -> None:
    """Display metrics using the modern glassmorphism cards."""
    if not metrics:
        return

    cards: list[str] = []
    for metric in metrics:
        icon = escape(metric.get("icon", ""))
        label = escape(metric.get("label", ""))
        value = escape(metric.get("value", ""))
        delta = metric.get("delta")
        helper = metric.get("helper")

        delta_html = (
            f"<div class='metric-delta'>{escape(delta)}</div>" if delta else ""
        )
        helper_html = (
            f"<p class='metric-helper'>{escape(helper)}</p>" if helper else ""
        )
        icon_html = f"<div class='metric-icon'>{icon}</div>" if icon else ""

        cards.append(
            f"""
            <div class="metric-card">
                {icon_html}
                <div class="metric-title">{label}</div>
                <div class="metric-value">{value}</div>
                {delta_html}
                {helper_html}
            </div>
            """
        )

    st.markdown(
        f"<div class='metric-grid'>{''.join(cards)}</div>",
        unsafe_allow_html=True,
    )


def stat_pills(items: Iterable[Mapping[str, str]]) -> None:
    """Render inline pills for quick stats or filters."""
    pills = []
    for item in items:
        label = escape(item.get("label", ""))
        value = escape(item.get("value", ""))
        pills.append(
            f"<span class='section-chip'>{label} : {value}</span>"
        )

    if pills:
        st.markdown(
            f"<div class='chip-collection'>{''.join(pills)}</div>",
            unsafe_allow_html=True,
        )

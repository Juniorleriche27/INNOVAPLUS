# KORYXA Site Architecture

## Positioning

KORYXA is the visible platform and primary brand.

The site must present a single coherent system:

- `KORYXA` handles orientation, readiness, validation, opportunity activation, community and enterprise entry points.
- `MyPlanningAI` is the execution engine used inside KORYXA.
- `ChatLAYA` is the transversal conversational layer.

The product experience must not feel like unrelated tools stitched together.

## Public Information Architecture

Canonical public navigation:

- `/` -> Accueil
- `/entreprise` -> besoins entreprise
- `/trajectoire` -> trajectoires, progression, validation
- `/produits` -> solutions actives
- `/opportunites` -> activation et matching
- `/communaute` -> réseau IA
- `/a-propos` -> vision, équipe, méthode

Public rules:

- French slugs are the canonical marketing routes.
- English aliases may remain available for compatibility, but they are not the preferred visible links.
- Only active solutions remain in the public portfolio.

## Connected Information Architecture

Canonical connected entry:

- `/myplanning/app/koryxa-home`

Canonical connected navigation:

- `/myplanning/app/koryxa-home` -> accueil connecté KORYXA
- `/myplanning/app/koryxa` -> cockpit trajectoire
- `/myplanning/app/koryxa-enterprise` -> cockpit entreprise
- `/chatlaya` -> copilote conversationnel
- `/myplanning/opportunities` -> opportunités internes
- `/myplanning/profile` -> profil vérifié KORYXA
- `/myplanning/settings` -> paramètres et accès

Connected rules:

- The visible shell is KORYXA.
- MyPlanningAI appears as an execution engine, not as a competing top-level universe.
- Auth flows for the connected layer should point to `/myplanning/login` and `/myplanning/signup`.

## Product Scope

Active solutions:

- `MyPlanningAI`
- `ChatLAYA`

Removed from scope:

- `Farmlink`
- `PieAgency`
- `PlusBook` / `PlusBooks`
- `Koryxa Santé`

Rules:

- Removed products must not appear in navigation, product catalogs, docs or backend mounts.
- Legacy slugs should redirect to the remaining portfolio instead of rendering stale pages.

## Legacy Compatibility

Legacy routes can stay available through redirects when they already circulated publicly.

Current compatibility intent:

- `/platform/*` -> redirect to the matching KORYXA connected route
- legacy product slugs -> redirect to `/produits`
- English marketing aliases can remain reachable when needed

## Ongoing Cleanup Priorities

1. Keep reducing route duplication between French and English slugs where it creates confusion.
2. Remove remaining copy that presents MyPlanningAI as the main umbrella brand.
3. Reconnect demo-like pages to real KORYXA data sources whenever possible.
4. Keep the connected shell centered on readiness, activation, enterprise needs and opportunities.
5. Avoid adding new pages that create a second dashboard universe.

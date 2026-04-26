# chatlaya-service

Status: non actif en production.

## Role du service

`chatlaya-service` est le futur service metier dedie a ChatLAYA.

Il portera a terme :
- l'assistant IA ;
- les conversations ;
- les messages ;
- les modes assistant ;
- le RAG ;
- l'orchestration du contexte de reponse ;
- l'historique conversationnel.

## Port cible

- `8010`

## Endpoint present dans ce squelette

- `GET /health`

Reponse :

```json
{
  "status": "ok",
  "service": "chatlaya-service"
}
```

## Endpoints prevus plus tard

- `/api/v1/chatlaya/session`
- `/api/v1/chatlaya/conversations`
- `/api/v1/chatlaya/messages`
- `/api/v1/chatlaya/message`

Le prefix final sera routé plus tard par la gateway/API gateway.  
Ce squelette n'est pas branche a la production actuelle.

## Ce qui sera migre plus tard

Sources candidates actuelles :
- `apps/koryxa/backend/app/routers/chatlaya.py`
- `apps/koryxa/backend/app/repositories/chatlaya_pg.py`
- `apps/koryxa/backend/app/schemas/chatlaya.py`
- `apps/koryxa/backend/app/services/chatlaya_context.py`
- `apps/koryxa/backend/app/services/chatlaya_service.py`
- `apps/koryxa/backend/app/services/chatlaya_specialist.py`
- `apps/koryxa/backend/app/core/rag_client.py`
- `apps/koryxa/backend/app/prompts.py`
- `apps/koryxa/training`

## Dependances futures avec koryxa-core-service

Apres extraction, `chatlaya-service` dependra de `koryxa-core-service` pour :
- auth et validation de session ;
- `user_id` canonique ;
- `guest_id` ;
- roles ;
- acces produit ;
- resume utilisateur ;
- resume trajectoire ;
- resume entreprise.

Le contrat d'echange est documente dans :
- `docs/CHATLAYA_CORE_CONTRACT.md`
- `docs/INTERNAL_CORE_API.md`

## Structure actuelle du squelette

```text
services/chatlaya-service/backend/
  app/
    main.py
    core/config.py
    routers/health.py
```

## Database migration plan

Le service contient maintenant un brouillon de migration SQL :

- `services/chatlaya-service/migrations/001_create_chatlaya_tables.sql`

Objectif :
- reproduire proprement la structure actuelle de `app.chatlaya_conversations`
- reproduire proprement la structure actuelle de `app.chatlaya_messages`
- preparer le futur passage du bootstrap monolithe vers des migrations explicites

Regles actuelles :
- cette migration n'est pas executee automatiquement
- elle ne modifie pas la base active a ce stade
- `ensure_chatlaya_tables()` reste la source active de creation de tables dans le monolithe
- toute application future doit etre validee avant execution

Ordre cible plus tard :
1. valider la migration SQL
2. comparer avec la base de production
3. brancher les migrations dans `chatlaya-service`
4. seulement ensuite retirer la creation implicite du monolithe

## Statut

- service scaffold seulement
- non branche a Nginx
- non branche a systemd
- non branche aux routes publiques existantes
- non utilise en production actuelle

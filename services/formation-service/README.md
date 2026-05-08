# formation-service

Service dédié de `Formation IA` pour KORYXA.

Contenu présent ici :

- `backend/` : backend FastAPI provenant du projet formation existant
- `content/` : notebooks, documents et datasets des modules
- `supabase/` : schéma source de vérité du service
- `programme_a_suivre.md` : programme pédagogique source

Règle d'architecture :

- l'authentification centrale reste gérée par KORYXA core ;
- la logique métier formation doit vivre dans ce service, pas dans `apps/koryxa/backend`.

Déploiement serveur attendu :

- service systemd : `formation.service`
- port local : `127.0.0.1:8013`
- proxy public : `https://api.innovaplus.africa/api/formation/*`
- frontend public : `https://formation.innovaplus.africa`

Configuration IA attendue :

- `formation.service` hérite aussi de `/etc/innovaplus/backend.env`
- le provider recommandé est `CHAT_PROVIDER=ai_gateway`
- le service consomme alors les mêmes variables que KORYXA central :
  - `AI_GATEWAY_BASE_URL`
  - `AI_GATEWAY_API_KEY`
  - `AI_GATEWAY_TIMEOUT_SECONDS`

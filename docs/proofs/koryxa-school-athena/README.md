## KORYXA School — preuves UI (Athena)

Ce dossier est destiné à contenir les captures demandées pour vérifier :
- layout plein écran
- dropdown Parcours/Module
- sommaire qui change selon le module
- item actif après navigation
- scroll indépendants (sidebar vs contenu)
- ressources FR/EN dans le flux

### Générer automatiquement (recommandé)

1) Build + start:

```bash
cd apps/koryxa/frontend
npm run build
PORT=3010 npm run start
```

2) Installer les dépendances système Playwright (une seule fois) :

```bash
cd apps/koryxa/frontend
sudo npx playwright install-deps chromium
npx playwright install chromium
```

3) Générer les captures :

```bash
cd apps/koryxa/frontend
BASE_URL=http://127.0.0.1:3010 node scripts/capture_school_proofs.mjs
```

Les images sont sauvegardées dans `docs/proofs/koryxa-school-athena/`.


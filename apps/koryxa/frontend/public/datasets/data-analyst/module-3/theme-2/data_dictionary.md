# Data Dictionary — users_identity_messy.csv

## Colonnes
- user_id (string) : identifiant utilisateur (censé être unique, mais dataset contient des doublons)
  Exemple: U001
- email (string) : email utilisateur (souvent unique, mais peut être partagé/dupliqué)
  Exemple: user001@mail.com
- phone (string) : téléphone (format variable)
  Exemple: +22890000001
- country (string) : pays (sale: espaces, casse)
  Exemple: "  togo"
- channel (string) : canal acquisition (sale: casse)
  Exemple: "Facebook"
- signup_date (string/date) : date inscription (formats mixtes)
  Exemple: "03/01/2026" ou "2026-01-03"
- last_active (string/date) : dernière activité (formats mixtes)
  Exemple: "2026-01-25 18:20"
- revenue (string/float) : revenu total (peut être manquant)
  Exemple: 1200.5

## Pièges injectés
- user_id dupliqué (updates multiples)
- email dupliqué sur plusieurs user_id (conflit identité)
- lignes strictement identiques
- strings non normalisées
- dates non homogènes


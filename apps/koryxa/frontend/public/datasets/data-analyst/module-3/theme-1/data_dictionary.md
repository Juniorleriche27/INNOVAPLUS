# Data Dictionary — sales_users_messy.csv

- user_id: identifiant utilisateur (string). Ex: U0001
- country: pays (string). Peut être vide / mal formaté. Ex: "  togo"
- channel: canal acquisition (string). Peut être vide. Ex: facebook
- age: âge (num). Peut contenir anomalies (0, 999) ou manquants.
- signup_date: date inscription (string). Formats mixtes (dd/mm/yyyy ou yyyy-mm-dd).
- last_active: dernière activité (string). Formats mixtes (dd/mm/yyyy HH:MM ou ISO-like).
- revenue: revenu/CA associé (num). Peut être manquant, ou négatif (anomalie).


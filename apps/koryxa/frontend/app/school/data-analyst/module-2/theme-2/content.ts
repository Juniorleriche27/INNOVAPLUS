import type { ThemeArticle, ThemeVideo } from "../../module-1/content";

export type ThemePageSection = {
  heading: string;
  body: string[];
};

export type ThemePage = {
  title: string;
  sections: ThemePageSection[];
};

export const module2Theme2Meta = {
  title: "Thème 2 — CSV/Excel + Power Query : import, types, profiling, transformations",
  module: "Module 2 — Collecte des données",
  readingTime: "90–120 min",
};

export const module2Theme2Videos: ThemeVideo[] = [
  { lang: "fr", youtubeId: "sHX_q7wUKOU", title: "Je vous apprends Power Query en 45 minutes" },
  { lang: "en", youtubeId: "y-6ffGMK8Ow", title: "Import Data from CSV Files into Excel using Power Query" },
];

export const module2Theme2Articles: ThemeArticle[] = [
  { label: "Data types in Power Query (locale inclus)", url: "https://learn.microsoft.com/en-us/power-query/data-types" },
  {
    label: "Set a locale or region for data (Using Locale)",
    url: "https://support.microsoft.com/en-us/office/set-a-locale-or-region-for-data-power-query-d42b9390-1fff-413f-8120-d7df0ced20b9",
  },
  {
    label: "Using the data profiling tools",
    url: "https://learn.microsoft.com/en-us/power-query/data-profiling-tools",
  },
  { label: "Text/CSV connector", url: "https://learn.microsoft.com/en-us/power-query/connectors/text-csv" },
  {
    label: "Import data from data sources (Excel Power Query)",
    url: "https://support.microsoft.com/en-us/office/import-data-from-data-sources-power-query-be4330b3-5356-486c-a168-b68e9e616f5a",
  },
];

export const module2Theme2Pages: ThemePage[] = [
  {
    title: "CSV/Excel + Power Query : importer, typer, profiler, transformer",
    sections: [
      {
        heading: "1) Pourquoi ce thème est critique",
        body: [
          "Dans 80% des cas terrain, tes données arrivent sous forme : CSV exporté d’un outil, Excel multi-feuilles, fichiers “sales” (dates incohérentes, colonnes fusionnées, séparateurs bizarres).",
          "Si tu importes sans contrôle : tu crées des KPI faux, tu perds du temps à réparer, tu livres un dashboard incohérent.",
          "Objectif du thème : importer proprement (CSV/Excel), fixer les types + locale (dates, nombres), profiler (qualité/distribution/profile), transformer (split/trim/merge/append/pivot/unpivot), produire un dataset final reproductible + documentation + preuves (notebook + Power Query).",
        ],
      },
      {
        heading: "2) CSV vs Excel : différences pratiques",
        body: [
          "CSV (pièges) : séparateur ( , vs ; ), encoding (UTF-8 vs ANSI), décimales (1,25 vs 1.25), dates (13/01/2026 vs 01/13/2026), texte contenant le séparateur (ex: “Lomé, Togo”).",
          "Règle pro : un CSV n’est “simple” que si tu contrôles séparateur + encoding + types.",
          "Excel (pièges) : multi-feuilles, lignes de titre au-dessus, colonnes fusionnées, totaux en bas, formats visuels mais valeurs incohérentes.",
          "Règle pro : viser 1 ligne = 1 observation, 1 colonne = 1 variable, pas de totaux dans la table source.",
        ],
      },
      {
        heading: "3) Importer avec Power Query (Excel / Power BI)",
        body: [
          "Power Query sert à connecter/importer, transformer/combiner, puis charger.",
          "Import CSV : Données → Obtenir des données → À partir d’un fichier → À partir d’un texte/CSV. Contrôles : bon séparateur, encodage, première ligne = en-têtes, types non “auto” si fichier instable.",
          "Import Excel : préférer une Table Excel (Ctrl+T) plutôt qu’une plage brute ; nettoyer titres/totaux.",
        ],
      },
      {
        heading: "4) Typage + locale : le point qui casse les projets",
        body: [
          "Locale : une chaîne “1,234” peut signifier 1234 ou 1.234. Idem dates : “01/02/2026” peut être 1 février ou 2 janvier.",
          "Bonne pratique : Change Type → Using Locale quand nécessaire ; documenter la locale ; éviter les conversions silencieuses.",
          "Règle pro : les colonnes nombres et dates doivent être forcées explicitement.",
        ],
      },
      {
        heading: "5) Profilage (data profiling)",
        body: [
          "Power Query propose : Column quality (valid/error/empty), Column distribution, Column profile. Active ces vues (View/Affichage).",
          "But : détecter vite valeurs vides, erreurs de conversion, valeurs rares, distributions bizarres (outliers).",
        ],
      },
      {
        heading: "6) Transformations essentielles",
        body: [
          "Nettoyage texte : Trim/Clean, normaliser casse, remplacer caractères invisibles.",
          "Split/Extract : séparer “Nom Prénom” en 2 colonnes.",
          "Pivot/Unpivot : transformer format large (mois en colonnes) vers format long (1 ligne par mois).",
          "Merge vs Append : Merge = ajouter des colonnes via clé ; Append = empiler des fichiers identiques.",
        ],
      },
      {
        heading: "7) Reproductibilité : éviter le copier-coller éternel",
        body: [
          "Pipeline fichier = ré-exécutable (refresh), documenté (data dictionary), versionné (date extraction), vérifiable (rapport qualité).",
          "Tu dois pouvoir refaire l’import demain et obtenir le même schéma.",
        ],
      },
      {
        heading: "8) Mini-cas complet (KORYXA School)",
        body: [
          "Tu reçois raw_events_messy.csv (log événements) + raw_profiles_messy.xlsx (profils).",
          "But : produire clean_learning_dataset.csv avec user_id, event_time, event_type, theme, country, channel + un rapport qualité.",
          "Preuves attendues : conversions correctes, pas de doublons inattendus, % missing acceptable, colonnes standardisées.",
        ],
      },
      {
        heading: "9) Exercices obligatoires (avant quiz)",
        body: [
          "A) Power Query : importer + typer avec locale si besoin + activer profiling.",
          "B) Power Query : transformer (clean/split/unpivot si utile) + exporter le M code (Advanced Editor).",
          "C) Notebook : produire exports (dataset clean + quality report + data dictionary).",
        ],
      },
      {
        heading: "10) Checklist validation (Thème 2)",
        body: [
          "Dataset final propre exporté (CSV).",
          "Rapport qualité JSON (missing, duplicates, date range).",
          "Data dictionary (md).",
          "Script Power Query (M) exporté.",
          "Mini-projet soumis + validé.",
        ],
      },
    ],
  },
];


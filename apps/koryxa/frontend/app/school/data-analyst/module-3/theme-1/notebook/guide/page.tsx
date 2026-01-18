import Link from "next/link";

export default function Module3Theme1NotebookGuide() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mx-auto max-w-[820px]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Module 3 — Thème 1</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Partie 2 — Notebook : exécuter et produire les preuves</h1>

        <div className="prose prose-slate mt-6 max-w-none prose-p:text-[17px] prose-p:leading-[1.8]">
          <p>
            Dans cette partie, l’objectif n’est pas seulement de “corriger” un dataset, mais de produire des preuves
            vérifiables. Tu vas exécuter un notebook qui mesure la qualité des données, explique tes décisions, applique
            un nettoyage reproductible, puis exporte des fichiers que la plateforme peut contrôler. Autrement dit : tu
            dois pouvoir montrer ce que tu as observé (profilage), ce que tu as décidé (plan), ce que tu as modifié
            (dataset nettoyé) et comment tu le démontres (rapport qualité + exports).
          </p>
          <p>
            Tout ce dont tu as besoin est déjà fourni dans l’onglet Dataset + notebook. Tu y trouveras le fichier{" "}
            <code>sales_users_messy.csv</code> (dataset volontairement “sale”), un <code>data_dictionary.md</code>{" "}
            (description des colonnes et attentes métier), le notebook <code>theme-1_missing_values_profiling.ipynb</code>{" "}
            (à exécuter), et un script optionnel <code>generate_sales_users_messy.py</code> si tu veux régénérer une
            version similaire du dataset. Tu n’as pas à chercher de données ailleurs : le travail demandé se fait
            uniquement avec ces ressources.
          </p>
          <p>
            Commence par télécharger le dataset et le notebook, puis ouvre le notebook dans ton environnement (Jupyter,
            VS Code, Colab, etc.). Avant de nettoyer, le notebook doit afficher un “état initial” : dimensions, types de
            colonnes, nombre d’identifiants uniques et nombre de doublons. Cette étape est importante car elle sert de
            référence : sans “avant”, tu ne peux pas prouver l’impact de tes décisions “après”.
          </p>
          <p>
            Ensuite, le notebook doit traiter les problèmes injectés : faux vides (espaces, chaînes vides), types
            incohérents (âge/revenu/dates), valeurs aberrantes (ex : 0/999, revenus négatifs), et doublons sur{" "}
            <code>user_id</code>. L’idée n’est pas d’appliquer une magie, mais de suivre une méthode traçable : conversion
            propre des types, diagnostic des manquants, choix d’une stratégie et ajout de flags <code>missing_*</code>{" "}
            lorsque c’est nécessaire pour conserver l’information “cette valeur était manquante”.
          </p>
          <p>
            À la fin de l’exécution, tu dois générer exactement quatre fichiers. Ces fichiers sont les preuves attendues
            par la page Soumettre les preuves : <code>m3t1_profiling_table.csv</code> (table de profilage),{" "}
            <code>m3t1_dataset_clean.csv</code> (dataset nettoyé), <code>m3t1_quality_report.json</code> (rapport
            qualité), <code>m3t1_missingness_plan.md</code> (plan de traitement des manquants).
          </p>
          <p>
            Important : génère ces fichiers dans le même dossier que le notebook (ou un sous-dossier <code>outputs/</code>
            ), puis dépose-les ensuite dans Soumettre les preuves. Si un fichier manque, si le nom est différent, ou si
            un export est vide, la validation échoue même si ton nettoyage est correct.
          </p>
          <p>
            Une fois les quatre fichiers créés, rends-toi sur Soumettre les preuves, charge-les dans les champs
            correspondants et envoie. La plateforme vérifie la cohérence (ex : unicité de <code>user_id</code>, âges
            raisonnables, dates parsables et présence des colonnes <code>missing_*</code>). Le quiz se débloque
            uniquement après une soumission validée.
          </p>
          <p>
            Enfin, garde en tête la rigueur attendue : sur MCAR/MAR/MNAR, tu formules une hypothèse raisonnable et tu
            assumes l’incertitude. Ce qui est évalué ici, c’est un raisonnement propre et une trace vérifiable, pas une
            certitude impossible à démontrer sur un simple export.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            href="/school/data-analyst/module-3/theme-1/notebook"
          >
            Dataset + notebook →
          </Link>
          <Link className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white" href="/school/data-analyst/module-3/theme-1/submit">
            Soumettre les preuves →
          </Link>
        </div>
      </div>
    </section>
  );
}


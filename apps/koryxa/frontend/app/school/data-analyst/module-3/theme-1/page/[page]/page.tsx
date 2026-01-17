import ThemeContent from "@/content/data-analyst/module-3/theme-1.mdx";
import resources from "@/content/data-analyst/module-3/theme-1.resources.json";
import SingleThemeLayout from "../../../../module-1/components/SingleThemeLayout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResourceSchema = {
  videos?: Array<{ lang: "fr" | "en"; youtubeId: string; title: string }>;
  articles?: Array<{ title: string; url: string }>;
  toc?: string[];
};

const typedResources = resources as ResourceSchema;

type Props = { params: { page: string } | Promise<{ page: string }> };

export default async function Module3Theme1Paged({ params }: Props) {
  const resolved = await Promise.resolve(params);
  const page = typeof resolved.page === "string" ? Number(resolved.page) : 1;
  if (!Number.isFinite(page) || page !== 1) {
    // Theme 1 is a single-page lesson.
  }

  const videos = typedResources.videos || [];
  const articles = typedResources.articles || [];
  const toc = typedResources.toc || [];

  return (
    <SingleThemeLayout
      meta={{
        module: "Module 3 — Nettoyage & Qualité des données",
        title: "Thème 1 — Profilage & valeurs manquantes : diagnostiquer, choisir une stratégie, prouver",
        readingTime: "120–150 min",
      }}
      description="Profilage (dtype/min/max/top values), diagnostic missingness (MCAR/MAR/MNAR), stratégies + preuves"
      actions={[
        { label: "Notebook", href: "/school/data-analyst/module-3/theme-1/notebook" },
        { label: "Soumettre", href: "/school/data-analyst/module-3/theme-1/submit" },
        { label: "Quiz", href: "/school/data-analyst/module-3/theme-1/quiz" },
      ]}
      videos={videos}
      articles={articles}
      toc={toc.map((label) => ({ label }))}
      sidebarSections={[
        {
          title: "Livrables à soumettre",
          content: (
            <ul className="list-disc pl-5">
              <li>m3t1_profiling_table.csv</li>
              <li>m3t1_dataset_clean.csv</li>
              <li>m3t1_quality_report.json</li>
              <li>m3t1_missingness_plan.md</li>
            </ul>
          ),
        },
        {
          title: "Corrections critiques",
          content: (
            <ul className="list-disc pl-5">
              <li>Ne pas faire `astype(str)` (préserver les NA, utiliser dtype string).</li>
              <li>Dédup: `sort_values(..., na_position=\"first\")` puis `drop_duplicates(... keep=\"last\")`.</li>
              <li>Profilage: inclure `dtype` + min/max (numériques & dates).</li>
            </ul>
          ),
        },
      ]}
    >
      <ThemeContent />
    </SingleThemeLayout>
  );
}


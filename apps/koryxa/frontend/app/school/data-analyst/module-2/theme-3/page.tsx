import ThemeContent from "@/content/data-analyst/module-2/theme-3.mdx";
import resources from "@/content/data-analyst/module-2/theme-3.resources.json";
import SingleThemeLayout from "../../module-1/components/SingleThemeLayout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResourceSchema = {
  videos?: Array<{ lang: "fr" | "en"; youtubeId: string; title: string }>;
  articles?: Array<{ title: string; url: string }>;
};

const typedResources = resources as ResourceSchema;

export default function Module2Theme3Page() {
  const videos = typedResources.videos || [];
  const articles = typedResources.articles || [];

  return (
    <SingleThemeLayout
      meta={{
        module: "Module 2 — Collecte des données",
        title: "Thème 3 — SQL extraction",
        readingTime: "60–90 min",
      }}
      description="SELECT · JOIN · GROUP BY · HAVING · exports reproductibles"
      actions={[
        { label: "Notebook", href: "/school/data-analyst/module-2/theme-3/notebook" },
        { label: "Soumettre", href: "/school/data-analyst/module-2/theme-3/submit" },
        { label: "Quiz", href: "/school/data-analyst/module-2/theme-3/quiz" },
      ]}
      videos={videos}
      articles={articles}
      sidebarSections={[
        {
          title: "Livrables attendus",
          content: (
            <ul className="list-disc pl-5">
              <li>m2t3_queries.sql</li>
              <li>m2t3_q1_funnel_by_theme.csv</li>
              <li>m2t3_q2_completion_by_country.csv</li>
              <li>m2t3_q3_notebook48h_vs_validation.csv</li>
              <li>m2t3_run_report.json</li>
            </ul>
          ),
        },
      ]}
    >
      <ThemeContent />
    </SingleThemeLayout>
  );
}

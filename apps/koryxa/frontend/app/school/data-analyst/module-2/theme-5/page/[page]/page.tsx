import ThemeContent from "@/content/data-analyst/module-2/theme-5.mdx";
import resources from "@/content/data-analyst/module-2/theme-5.resources.json";
import SingleThemeLayout from "../../../../module-1/components/SingleThemeLayout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResourceSchema = {
  videos?: Array<{ lang: "fr" | "en"; youtubeId: string; title: string }>;
  articles?: Array<{ title: string; url: string }>;
  toc?: string[];
};

const typedResources = resources as ResourceSchema;

export default function Module2Theme5Paged() {
  const videos = typedResources.videos || [];
  const articles = typedResources.articles || [];
  const toc = typedResources.toc || [];

  return (
    <SingleThemeLayout
      meta={{
        module: "Module 2 — Collecte des données",
        title: "Thème 5 — Capstone collecte",
        readingTime: "90–120 min",
      }}
      description="Pack reproductible · RAP · lineage · README · data dictionary"
      actions={[
        { label: "Notebook", href: "/school/data-analyst/module-2/theme-5/notebook" },
        { label: "Soumettre", href: "/school/data-analyst/module-2/theme-5/submit" },
        { label: "Quiz", href: "/school/data-analyst/module-2/theme-5/quiz" },
      ]}
      videos={videos}
      articles={articles}
      toc={toc.map((label) => ({ label }))}
      sidebarSections={[
        {
          title: "Fichiers attendus dans le ZIP",
          content: (
            <ul className="list-disc pl-5">
              <li>README.md</li>
              <li>manifest.json</li>
              <li>lineage.md</li>
              <li>data_dictionary.csv</li>
              <li>quality_report.json</li>
              <li>final_dataset.csv</li>
              <li>extract_sql.sql</li>
              <li>extract_api.py</li>
              <li>powerquery.m</li>
              <li>packager.ipynb</li>
            </ul>
          ),
        },
      ]}
    >
      <ThemeContent />
    </SingleThemeLayout>
  );
}


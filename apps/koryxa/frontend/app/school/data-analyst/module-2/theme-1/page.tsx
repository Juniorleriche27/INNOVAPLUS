import ThemeContent from "@/content/data-analyst/module-2/theme-1.mdx";
import resources from "@/content/data-analyst/module-2/theme-1.resources.json";
import SingleThemeLayout from "../../module-1/components/SingleThemeLayout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResourceSchema = {
  videos?: Array<{ lang: "fr" | "en"; youtubeId: string; title: string }>;
  articles?: Array<{ title: string; url: string }>;
  toc?: string[];
};

const typedResources = resources as ResourceSchema;

export default function Theme1Index() {
  const videos = typedResources.videos || [];
  const articles = typedResources.articles || [];
  const toc = typedResources.toc || [];

  return (
    <SingleThemeLayout
      meta={{
        module: "Module 2 — Collecte des données",
        title: "Thème 1 — Panorama des sources & plan de collecte",
        readingTime: "70–100 min",
      }}
      description="Inventaire de sources, data mapping minimal, plan de collecte reproductible"
      actions={[
        { label: "Notebook", href: "/school/data-analyst/module-2/theme-1/notebook" },
        { label: "Soumettre", href: "/school/data-analyst/module-2/theme-1/submit" },
        { label: "Quiz", href: "/school/data-analyst/module-2/theme-1/quiz" },
      ]}
      videos={videos}
      articles={articles}
      toc={toc.map((label) => ({ label }))}
      sidebarSections={[
        {
          title: "Livrables attendus",
          content: (
            <ul className="list-disc pl-5">
              <li>m2t1_inventory_filled.csv</li>
              <li>m2t1_data_mapping.md</li>
              <li>m2t1_collection_plan.md</li>
              <li>m2t1_quality_checks.json</li>
            </ul>
          ),
        },
      ]}
    >
      <ThemeContent />
    </SingleThemeLayout>
  );
}

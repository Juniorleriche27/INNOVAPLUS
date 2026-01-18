import ThemeContent from "@/content/data-analyst/module-3/theme-2.mdx";
import resources from "@/content/data-analyst/module-3/theme-2.resources.json";
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

export default async function Module3Theme2Paged({ params }: Props) {
  const resolved = await Promise.resolve(params);
  const page = typeof resolved.page === "string" ? Number(resolved.page) : 1;
  if (!Number.isFinite(page) || page !== 1) {
    // Theme 2 is a single-page lesson.
  }

  const videos = typedResources.videos || [];
  const articles = typedResources.articles || [];
  const toc = typedResources.toc || [];

  return (
    <SingleThemeLayout
      meta={{
        module: "Module 3 — Nettoyage & Qualité des données",
        title: "Thème 2 — Doublons, clés, unicité : détecter, dédupliquer sans casser les KPI",
        readingTime: "120–150 min",
      }}
      description="Doublons (exact/key/entity), audit de clés candidates, dédup contrôlée + audit des suppressions"
      actions={[
        { label: "Notebook", href: "/school/data-analyst/module-3/theme-2/notebook" },
        { label: "Soumettre", href: "/school/data-analyst/module-3/theme-2/submit" },
        { label: "Quiz", href: "/school/data-analyst/module-3/theme-2/quiz" },
      ]}
      videos={videos}
      articles={articles}
      toc={toc.map((label) => ({ label }))}
      sidebarSections={[
        {
          title: "Livrables à soumettre",
          content: (
            <ul className="list-disc pl-5">
              <li>m3t2_key_audit.csv</li>
              <li>m3t2_duplicates_report.csv</li>
              <li>m3t2_dataset_dedup.csv</li>
              <li>m3t2_dedup_audit.csv</li>
              <li>m3t2_quality_report.json</li>
              <li>m3t2_dedup_rules.md</li>
            </ul>
          ),
        },
        {
          title: "Règle de dédup (simple)",
          content: (
            <ul className="list-disc pl-5">
              <li>`entity_id = email ?? phone ?? user_id`</li>
              <li>Garder: complétude max → last_active max → stable.</li>
              <li>Exporter un audit des lignes supprimées.</li>
            </ul>
          ),
        },
      ]}
    >
      <ThemeContent />
    </SingleThemeLayout>
  );
}


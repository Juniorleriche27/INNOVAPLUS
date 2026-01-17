import ThemeContent from "@/content/data-analyst/module-2/theme-4.mdx";
import resources from "@/content/data-analyst/module-2/theme-4.resources.json";
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

export default async function Theme4Paged({ params }: Props) {
  const resolved = await Promise.resolve(params);
  const page = typeof resolved.page === "string" ? Number(resolved.page) : 1;
  if (!Number.isFinite(page) || page !== 1) {
    // Theme 4 is a single-page lesson.
  }

  const videos = typedResources.videos || [];
  const articles = typedResources.articles || [];
  const toc = typedResources.toc || [];

  return (
    <SingleThemeLayout
      meta={{
        module: "Module 2 — Collecte des données",
        title: "Thème 4 — APIs + Python : auth, paramètres, pagination, rate limit, logs",
        readingTime: "90–120 min",
      }}
      description="Auth (API key/Bearer/OAuth2), params/headers, pagination via next, 429+Retry-After, retries + logs"
      actions={[
        { label: "Notebook", href: "/school/data-analyst/module-2/theme-4/notebook" },
        { label: "Soumettre", href: "/school/data-analyst/module-2/theme-4/submit" },
        { label: "Quiz", href: "/school/data-analyst/module-2/theme-4/quiz" },
      ]}
      videos={videos}
      articles={articles}
      toc={toc.map((label) => ({ label }))}
      sidebarSections={[
        {
          title: "Livrables à soumettre",
          content: (
            <ul className="list-disc pl-5">
              <li>m2t4_transactions_raw.csv</li>
              <li>m2t4_transactions_clean.csv</li>
              <li>m2t4_request_log.csv</li>
              <li>m2t4_run_report.json</li>
              <li>m2t4_api_contract.md</li>
            </ul>
          ),
        },
        {
          title: "Règles pro (preuve forte)",
          content: (
            <ul className="list-disc pl-5">
              <li>Pagination: suivre `next` jusqu’à null.</li>
              <li>429: lire `Retry-After`, attendre puis retry.</li>
              <li>Timeout + `raise_for_status()` + logs d’erreurs.</li>
            </ul>
          ),
        },
      ]}
    >
      <ThemeContent />
    </SingleThemeLayout>
  );
}


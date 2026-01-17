import PagedThemeLayout from "../../../../module-1/components/PagedThemeLayout";
import { module2Theme2Articles, module2Theme2Meta, module2Theme2Pages, module2Theme2Videos } from "../../content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: { page: string } | Promise<{ page: string }> };

export function generateStaticParams() {
  return module2Theme2Pages.map((_, idx) => ({ page: String(idx + 1) }));
}

export default async function Module2Theme2Paged({ params }: Props) {
  const resolved = await Promise.resolve(params);
  const pageNumber = typeof resolved.page === "string" ? Number(resolved.page) : 1;
  return (
    <PagedThemeLayout
      meta={module2Theme2Meta}
      pages={module2Theme2Pages}
      videos={module2Theme2Videos}
      articles={module2Theme2Articles}
      currentPage={pageNumber}
      hrefForPage={(p) => `/school/data-analyst/module-2/theme-2/page/${p}`}
      actions={[
        { label: "Notebook", href: "/school/data-analyst/module-2/theme-2/notebook" },
        { label: "Soumettre", href: "/school/data-analyst/module-2/theme-2/submit" },
        { label: "Quiz", href: "/school/data-analyst/module-2/theme-2/quiz" },
      ]}
    />
  );
}

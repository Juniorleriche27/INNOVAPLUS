import PagedThemeLayout from "../../../components/PagedThemeLayout";
import { theme3Articles, theme3Meta, theme3Pages, theme3Videos } from "../../content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { page: string } | Promise<{ page: string }>;
};

export function generateStaticParams() {
  return theme3Pages.map((_, idx) => ({ page: String(idx + 1) }));
}

export default async function Theme3Paged({ params }: Props) {
  const resolved = await Promise.resolve(params);
  const pageNumber = typeof resolved.page === "string" ? Number(resolved.page) : 1;
  return (
    <PagedThemeLayout
      meta={theme3Meta}
      pages={theme3Pages}
      videos={theme3Videos}
      articles={theme3Articles}
      currentPage={pageNumber}
      hrefForPage={(p) => `/school/data-analyst/module-1/theme-3/page/${p}`}
      actions={[
        { label: "Notebook", href: "/school/data-analyst/module-1/theme-3/notebook" },
        { label: "Soumettre", href: "/school/data-analyst/module-1/theme-3/submit" },
        { label: "Quiz", href: "/school/data-analyst/module-1/theme-3/quiz" },
      ]}
    />
  );
}

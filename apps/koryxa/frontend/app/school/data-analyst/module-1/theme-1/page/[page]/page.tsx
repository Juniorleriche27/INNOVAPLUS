import { theme1Articles, theme1Meta, theme1Pages, theme1Videos } from "../../content";
import PagedThemeLayout from "../../../components/PagedThemeLayout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { page: string };
};

export function generateStaticParams() {
  return theme1Pages.map((_, idx) => ({ page: String(idx + 1) }));
}

export default function Theme1Paged({ params }: Props) {
  const pageNumber = typeof params.page === "string" ? Number(params.page) : 1;
  return (
    <PagedThemeLayout
      meta={theme1Meta}
      pages={theme1Pages}
      videos={theme1Videos}
      articles={theme1Articles}
      currentPage={pageNumber}
      hrefForPage={(p) => `/school/data-analyst/module-1/theme-1/page/${p}`}
      actions={[
        { label: "Notebook", href: "/school/data-analyst/module-1/theme-1/notebook" },
        { label: "Soumettre", href: "/school/data-analyst/module-1/theme-1/submit" },
        { label: "Quiz", href: "/school/data-analyst/module-1/theme-1/quiz" },
      ]}
    />
  );
}

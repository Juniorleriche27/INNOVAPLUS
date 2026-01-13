import { theme2Articles, theme2Meta, theme2Pages, theme2Videos } from "../../content";
import PagedThemeLayout from "../../../components/PagedThemeLayout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: { page: string } };

export function generateStaticParams() {
  return theme2Pages.map((_, idx) => ({ page: String(idx + 1) }));
}

export default function Theme2Paged({ params }: Props) {
  const pageNumber = typeof params.page === "string" ? Number(params.page) : 1;
  return (
    <PagedThemeLayout
      meta={theme2Meta}
      pages={theme2Pages}
      videos={theme2Videos}
      articles={theme2Articles}
      currentPage={pageNumber}
      hrefForPage={(p) => `/school/data-analyst/module-1/theme-2/page/${p}`}
      actions={[
        { label: "Notebook", href: "/school/data-analyst/module-1/theme-2/notebook" },
        { label: "Soumettre", href: "/school/data-analyst/module-1/theme-2/submit" },
        { label: "Quiz", href: "/school/data-analyst/module-1/theme-2/quiz" },
      ]}
    />
  );
}


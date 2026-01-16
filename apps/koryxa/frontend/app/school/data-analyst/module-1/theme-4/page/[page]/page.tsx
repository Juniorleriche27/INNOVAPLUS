import PagedThemeLayout from "../../../components/PagedThemeLayout";
import { theme4Articles, theme4Meta, theme4Pages, theme4Videos } from "../../content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: { page: string } };

export function generateStaticParams() {
  return theme4Pages.map((_, idx) => ({ page: String(idx + 1) }));
}

export default function Theme4Paged({ params }: Props) {
  const pageNumber = typeof params.page === "string" ? Number(params.page) : 1;

  return (
    <PagedThemeLayout
      meta={theme4Meta}
      pages={theme4Pages}
      videos={theme4Videos}
      articles={theme4Articles}
      currentPage={pageNumber}
      hrefForPage={(p) => `/school/data-analyst/module-1/theme-4/page/${p}`}
    />
  );
}

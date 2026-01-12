import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { page?: string } };

function parsePage(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.floor(n);
}

export default function Theme1Legacy({ searchParams }: Props) {
  const page = parsePage(searchParams?.page);
  redirect(`/school/data-analyst/module-1/theme-1/page/${page}`);
}

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Theme4Page() {
  redirect("/school/data-analyst/module-1/theme-4/page/1");
}

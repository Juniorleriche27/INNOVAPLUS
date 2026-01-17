import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Theme4Index() {
  redirect("/school/data-analyst/module-2/theme-4/page/1");
}


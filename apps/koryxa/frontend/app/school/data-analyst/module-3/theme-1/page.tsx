import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Module3Theme1Index() {
  redirect("/school/data-analyst/module-3/theme-1/page/1");
}


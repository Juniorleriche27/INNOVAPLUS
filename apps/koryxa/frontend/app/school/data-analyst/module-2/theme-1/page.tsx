import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Theme1Index() {
  redirect("/school/data-analyst/module-2/theme-1/page/1");
}

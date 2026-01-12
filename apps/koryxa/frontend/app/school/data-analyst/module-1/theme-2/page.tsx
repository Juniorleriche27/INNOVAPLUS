import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Theme2Index() {
  redirect("/school/data-analyst/module-1/theme-2/page/1");
}


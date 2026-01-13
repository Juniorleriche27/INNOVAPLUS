import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Theme5Entry() {
  redirect("/school/data-analyst/module-1/theme-5/page/1");
}


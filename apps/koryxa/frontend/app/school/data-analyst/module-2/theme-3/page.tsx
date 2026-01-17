import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Module2Theme3Page() {
  redirect("/school/data-analyst/module-2/theme-3/page/1");
}

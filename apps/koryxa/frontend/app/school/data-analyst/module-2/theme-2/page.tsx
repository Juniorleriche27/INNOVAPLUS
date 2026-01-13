import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Module2Theme2Entry() {
  redirect("/school/data-analyst/module-2/theme-2/page/1");
}

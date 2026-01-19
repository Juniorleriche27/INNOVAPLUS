import { redirect } from "next/navigation";

export default function DataAnalystModuleIndex({ params }: { params: { module: string } }) {
  redirect(`/school/data-analyst/module-${params.module}/videos`);
}


import { redirect } from "next/navigation";

export default function DataScienceModuleIndex({ params }: { params: { module: string } }) {
  redirect(`/school/data-science/module-${params.module}/videos`);
}


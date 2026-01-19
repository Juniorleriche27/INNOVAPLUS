import { redirect } from "next/navigation";

export default function DataEngineerModuleIndex({ params }: { params: { module: string } }) {
  redirect(`/school/data-engineer/module-${params.module}/videos`);
}


import { redirect } from "next/navigation";

export default function MachineLearningModuleIndex({ params }: { params: { module: string } }) {
  redirect(`/school/machine-learning/module-${params.module}/videos`);
}


import { notFound, redirect } from "next/navigation";
import ModuleReader from "@/app/school/v1/ModuleReader";
import { foundationalProgram } from "@/app/school/v1/content";

export function generateStaticParams() {
  return foundationalProgram.modules.map((module) => ({ module: module.id }));
}

export default function FundamentalModulePage({ params }: { params: { module: string } }) {
  const normalized = decodeURIComponent(params.module || "").toLowerCase();
  const moduleIndex = foundationalProgram.modules.findIndex(
    (m) => m.id.toLowerCase() === normalized
  );
  const fallback = foundationalProgram.modules[0];
  if (moduleIndex === -1) {
    if (fallback && params.module !== fallback.id) {
      redirect(`/school/parcours/fondamental/${fallback.id}`);
    }
    if (!fallback) {
      notFound();
    }
  }
  const activeIndex = moduleIndex === -1 ? 0 : moduleIndex;
  const module = moduleIndex === -1 ? fallback : foundationalProgram.modules[moduleIndex];
  const prev = foundationalProgram.modules[activeIndex - 1];
  const next = foundationalProgram.modules[activeIndex + 1];

  return (
    <ModuleReader
      module={module}
      programTitle={foundationalProgram.title}
      moduleIndex={activeIndex}
      moduleCount={foundationalProgram.modules.length}
      prevHref={prev ? `/school/parcours/fondamental/${prev.id}` : undefined}
      nextHref={next ? `/school/parcours/fondamental/${next.id}` : undefined}
      isLast={!next}
    />
  );
}

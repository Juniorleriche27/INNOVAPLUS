import { notFound, redirect } from "next/navigation";
import ModuleReader from "@/app/school/v1/ModuleReader";
import { specialisations } from "@/app/school/v1/content";

export function generateStaticParams() {
  return Object.values(specialisations).flatMap((program) =>
    program.modules.map((mod) => ({
      track: program.id,
      module: mod.id,
    }))
  );
}

export default function SpecialisationModulePage({ params }: { params: { track: string; module: string } }) {
  const normalizedTrack = decodeURIComponent(params.track || "").toLowerCase();
  const program =
    specialisations[params.track] ||
    Object.values(specialisations).find((item) => item.id.toLowerCase() === normalizedTrack);
  if (!program) {
    notFound();
  }
  const normalizedModule = decodeURIComponent(params.module || "").toLowerCase();
  const moduleIndex = program.modules.findIndex((m) => m.id.toLowerCase() === normalizedModule);
  const fallback = program.modules[0];
  if (moduleIndex === -1) {
    if (fallback && params.module !== fallback.id) {
      redirect(`/school/parcours/specialisations/${program.id}/${fallback.id}`);
    }
    if (!fallback) {
      notFound();
    }
  }
  const activeIndex = moduleIndex === -1 ? 0 : moduleIndex;
  const activeModule = moduleIndex === -1 ? fallback : program.modules[moduleIndex];
  const prev = program.modules[activeIndex - 1];
  const next = program.modules[activeIndex + 1];

  return (
    <ModuleReader
      module={activeModule}
      programTitle={program.title}
      moduleIndex={activeIndex}
      moduleCount={program.modules.length}
      prevHref={prev ? `/school/parcours/specialisations/${program.id}/${prev.id}` : `/school/parcours/specialisations/${program.id}`}
      nextHref={next ? `/school/parcours/specialisations/${program.id}/${next.id}` : undefined}
      isLast={!next}
    />
  );
}

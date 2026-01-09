import { notFound } from "next/navigation";
import ModuleReader from "@/app/school/v1/ModuleReader";
import { specialisations } from "@/app/school/v1/content";

export default function SpecialisationModulePage({ params }: { params: { track: string; module: string } }) {
  const program = specialisations[params.track];
  if (!program) {
    notFound();
  }
  const moduleIndex = program.modules.findIndex((m) => m.id === params.module);
  if (moduleIndex === -1) {
    notFound();
  }
  const module = program.modules[moduleIndex];
  const prev = program.modules[moduleIndex - 1];
  const next = program.modules[moduleIndex + 1];

  return (
    <ModuleReader
      module={module}
      programTitle={program.title}
      moduleIndex={moduleIndex}
      moduleCount={program.modules.length}
      prevHref={prev ? `/school/parcours/specialisations/${program.id}/${prev.id}` : `/school/parcours/specialisations/${program.id}`}
      nextHref={next ? `/school/parcours/specialisations/${program.id}/${next.id}` : undefined}
      isLast={!next}
    />
  );
}

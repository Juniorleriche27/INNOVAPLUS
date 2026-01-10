import ModuleReader from "@/app/school/v1/ModuleReader";
import { foundationalProgram } from "@/app/school/v1/content";

export default function VisualisationPage() {
  const moduleIndex = foundationalProgram.modules.findIndex((m) => m.id === "visualisation");
  const module = foundationalProgram.modules[moduleIndex];
  const prev = foundationalProgram.modules[moduleIndex - 1];
  const next = foundationalProgram.modules[moduleIndex + 1];

  return (
    <ModuleReader
      module={module}
      programTitle={foundationalProgram.title}
      moduleIndex={moduleIndex}
      moduleCount={foundationalProgram.modules.length}
      prevHref={prev ? `/school/parcours/fondamental/${prev.id}` : undefined}
      nextHref={next ? `/school/parcours/fondamental/${next.id}` : undefined}
      isLast={!next}
    />
  );
}

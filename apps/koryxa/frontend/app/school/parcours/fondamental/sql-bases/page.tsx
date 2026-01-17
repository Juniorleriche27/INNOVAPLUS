import ModuleReader from "@/app/school/v1/ModuleReader";
import { foundationalProgram } from "@/app/school/v1/content";

export default function SqlBasesPage() {
  const moduleIndex = foundationalProgram.modules.findIndex((m) => m.id === "sql-bases");
  const activeModule = foundationalProgram.modules[moduleIndex];
  const prev = foundationalProgram.modules[moduleIndex - 1];
  const next = foundationalProgram.modules[moduleIndex + 1];

  return (
    <ModuleReader
      module={activeModule}
      programTitle={foundationalProgram.title}
      moduleIndex={moduleIndex}
      moduleCount={foundationalProgram.modules.length}
      prevHref={prev ? `/school/parcours/fondamental/${prev.id}` : undefined}
      nextHref={next ? `/school/parcours/fondamental/${next.id}` : undefined}
      isLast={!next}
    />
  );
}

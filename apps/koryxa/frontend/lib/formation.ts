import { INNOVA_API_BASE } from "@/lib/env";

export type FormationResource = {
  id: string;
  module_id: string;
  title: string;
  url: string;
  resource_type: "document" | "notebook" | "dataset" | "video" | "article";
  description: string | null;
  order_index: number;
  created_at: string;
};

export type FormationModule = {
  id: string;
  track_id: string;
  track_key: string;
  module_key: string;
  title: string;
  description: string;
  order_index: number;
  duration: string | null;
  notebook_path: string | null;
  lesson_count: number;
  skills: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  resources: FormationResource[];
};

export type FormationTrack = {
  id: string;
  track_key: string;
  title: string;
  summary: string;
  description: string;
  domain: string | null;
  difficulty: string | null;
  estimated_duration: string | null;
  skills: string[];
  module_count: number;
  created_at: string;
  updated_at: string;
};

export type FormationTrackDetail = FormationTrack & {
  modules: FormationModule[];
};

type NotebookCell = {
  cell_type?: "markdown" | "code" | "raw";
  source?: string[] | string;
  outputs?: Array<{ text?: string[] | string; data?: Record<string, string | string[]> }>;
};

export type ParsedNotebookCell = {
  cell_type: "markdown" | "code" | "raw";
  source: string;
  text_outputs: string[];
};

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${INNOVA_API_BASE}${path}`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!response.ok) {
    throw new Error(`Formation API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getFormationTracks(): Promise<FormationTrack[]> {
  return fetchJson<FormationTrack[]>("/trajectoire/tracks");
}

export async function getFormationTrack(trackKey: string): Promise<FormationTrackDetail> {
  return fetchJson<FormationTrackDetail>(`/trajectoire/tracks/${encodeURIComponent(trackKey)}`);
}

export async function getFormationModule(moduleId: string): Promise<FormationModule> {
  return fetchJson<FormationModule>(`/trajectoire/modules/${encodeURIComponent(moduleId)}`);
}

function normalizeSource(source: NotebookCell["source"]): string {
  if (Array.isArray(source)) {
    return source.join("");
  }
  return typeof source === "string" ? source : "";
}

function normalizeOutputs(outputs: NotebookCell["outputs"]): string[] {
  const lines: string[] = [];
  for (const output of outputs || []) {
    if (Array.isArray(output.text)) {
      lines.push(output.text.join(""));
      continue;
    }
    if (typeof output.text === "string") {
      lines.push(output.text);
      continue;
    }
    const plain = output.data?.["text/plain"];
    if (Array.isArray(plain)) {
      lines.push(plain.join(""));
    } else if (typeof plain === "string") {
      lines.push(plain);
    }
  }
  return lines.filter(Boolean);
}

export async function getNotebookCellsFromResource(url: string): Promise<ParsedNotebookCell[]> {
  const response = await fetch(url, {
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!response.ok) {
    return [];
  }
  const notebook = (await response.json()) as { cells?: NotebookCell[] };
  return (notebook.cells || [])
    .map((cell) => ({
      cell_type: cell.cell_type || "raw",
      source: normalizeSource(cell.source).trim(),
      text_outputs: normalizeOutputs(cell.outputs),
    }))
    .filter((cell) => cell.source.length > 0 || cell.text_outputs.length > 0);
}

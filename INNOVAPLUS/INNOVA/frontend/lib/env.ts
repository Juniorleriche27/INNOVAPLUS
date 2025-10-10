export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_CHATLAYA_URL || "").replace(/\/+$/, "");

export function apiUrl(path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  // If API_BASE is set, use it; otherwise rely on Next rewrites to /api
  return API_BASE ? `${API_BASE}${path}` : `/api${path}`;
}


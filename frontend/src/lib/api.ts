// Central place for talking to the FastAPI backend.
//
// Development: leave PUBLIC_API_URL empty. Calls go to /api/* and the Vite proxy
//              (astro.config.mjs) forwards them to http://localhost:8000/*.
// Production:  set PUBLIC_API_URL=https://your-api-domain before `npm run build`.

const RAW = import.meta.env.PUBLIC_API_URL?.trim();
export const API_BASE = RAW ? RAW.replace(/\/$/, "") : "/api";

export interface Genre {
  id: number;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Game {
  id: number;
  title: string;
  description: string | null;
  cover_url: string | null;
  rating: number | null;
  genres: Genre[];
  tags: Tag[];
}

export interface Recommendation extends Game {
  because_of: string | null;
  similarity: number | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function searchGames(q: string, signal?: AbortSignal): Promise<Game[]> {
  return request<Game[]>(`/games/search?q=${encodeURIComponent(q)}`, { signal });
}

export function getGames(signal?: AbortSignal): Promise<Game[]> {
  return request<Game[]>("/games", { signal });
}

export function getRecommendations(titles: string[], signal?: AbortSignal): Promise<Recommendation[]> {
  return request<Recommendation[]>("/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(titles.map((title) => ({ title }))),
    signal,
  });
}

// The ingest script stores this placeholder when it has no real description.
export function cleanDescription(text: string | null): string | null {
  if (!text || text.trim() === "" || text.trim() === "Fetching details...") return null;
  return text;
}

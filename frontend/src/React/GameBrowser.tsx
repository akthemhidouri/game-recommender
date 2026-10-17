import { useEffect, useMemo, useState } from "react";
import { getGames } from "../lib/api";
import type { Game } from "../lib/api";
import GameCard from "./GameCard";

const PAGE_SIZE = 12;

const GameBrowser = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [genre, setGenre] = useState("All");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    const controller = new AbortController();
    getGames(controller.signal)
      .then((data) => setGames(data))
      .catch((e) => {
        if ((e as Error).name !== "AbortError") {
          setError("Could not load games. Is the backend running?");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const genres = useMemo(() => {
    const names = new Set<string>();
    games.forEach((g) => g.genres.forEach((x) => names.add(x.name)));
    return ["All", ...Array.from(names).sort()];
  }, [games]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return games.filter(
      (g) =>
        (genre === "All" || g.genres.some((x) => x.name === genre)) &&
        (q === "" || g.title.toLowerCase().includes(q)),
    );
  }, [games, filter, genre]);

  useEffect(() => setVisible(PAGE_SIZE), [filter, genre]);

  if (loading) return <p className="text-[var(--white-icon)]">Loading games…</p>;
  if (error)
    return (
      <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </p>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by title…"
          aria-label="Filter games by title"
          className="w-full rounded-lg border border-[var(--white-icon-tr)] bg-[#1414149c] px-4 py-2.5 text-[var(--white)] placeholder:text-[var(--white-icon)] focus:outline-none focus:ring-2 focus:ring-[var(--sec)] md:max-w-sm"
        />
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          aria-label="Filter by genre"
          className="rounded-lg border border-[var(--white-icon-tr)] bg-[#161616] px-4 py-2.5 text-[var(--white)] focus:outline-none focus:ring-2 focus:ring-[var(--sec)]"
        >
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <span className="text-sm text-[var(--white-icon)] md:ml-auto">
          {filtered.length} {filtered.length === 1 ? "game" : "games"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[var(--white-icon)]">No games match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, visible).map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}

      {visible < filtered.length && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-full border border-[var(--white-icon-tr)] bg-[#1414149c] px-6 py-2.5 text-[var(--white-icon)] transition hover:scale-105 hover:text-white"
          >
            Show more
          </button>
        </div>
      )}
    </div>
  );
};

export default GameBrowser;

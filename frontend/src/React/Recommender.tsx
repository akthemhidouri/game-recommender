import { useEffect, useRef, useState } from "react";
import { getRecommendations, searchGames } from "../lib/api";
import type { Game, Recommendation } from "../lib/api";
import GameCard from "./GameCard";

const STORAGE_KEY = "gamematch:selected";

function loadSelected(): Game[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSelected(games: Game[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch {
    /* storage unavailable: ignore */
  }
}

const Recommender = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Game[]>([]);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  // Restore the last selection (client only)
  useEffect(() => {
    setSelected(loadSelected());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current) saveSelected(selected);
  }, [selected]);

  // Debounced search-as-you-type
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchGames(q, controller.signal);
        setSuggestions(data);
        setError(null);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setSuggestions([]);
          setError("Could not reach the game server. Is the backend running?");
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const isSelected = (g: Game) => selected.some((s) => s.id === g.id);

  const addGame = (g: Game) => {
    if (isSelected(g)) return;
    setSelected((prev) => [...prev, g]);
    setQuery("");
    setSuggestions([]);
  };

  const removeGame = (id: number) => setSelected((prev) => prev.filter((g) => g.id !== id));

  const recommend = async () => {
    if (selected.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRecommendations(selected.map((g) => g.title));
      setResults(data);
    } catch {
      setResults(null);
      setError("Something went wrong while getting recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[var(--white-icon-tr)] bg-[#1414149c] p-5 md:p-6">
        <label htmlFor="game-search" className="mb-2 block text-sm text-[var(--white-icon)]">
          Search for a game you have played
        </label>
        <div className="relative">
          <input
            id="game-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && suggestions[0]) {
                e.preventDefault();
                addGame(suggestions.find((s) => !isSelected(s)) ?? suggestions[0]);
              }
            }}
            placeholder="e.g. The Witcher 3, Portal, Hades…"
            autoComplete="off"
            className="w-full rounded-lg border border-[var(--white-icon-tr)] bg-[#1414149c] px-4 py-3 text-[var(--white)] placeholder:text-[var(--white-icon)] focus:outline-none focus:ring-2 focus:ring-[var(--sec)]"
          />

          {query.trim().length >= 2 && (
            <ul
              role="listbox"
              aria-label="Matching games"
              className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-lg border border-[var(--white-icon-tr)] bg-[#161616] shadow-xl"
            >
              {searching && suggestions.length === 0 && (
                <li className="px-4 py-3 text-sm text-[var(--white-icon)]">Searching…</li>
              )}
              {!searching && suggestions.length === 0 && !error && (
                <li className="px-4 py-3 text-sm text-[var(--white-icon)]">No games found.</li>
              )}
              {suggestions.map((g) => (
                <li key={g.id} role="option" aria-selected={isSelected(g)}>
                  <button
                    type="button"
                    onClick={() => addGame(g)}
                    disabled={isSelected(g)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-[var(--white-icon-tr)] disabled:opacity-40"
                  >
                    {g.cover_url ? (
                      <img src={g.cover_url} alt="" className="h-10 w-14 rounded object-cover" loading="lazy" />
                    ) : (
                      <span className="h-10 w-14 rounded bg-[#222]" />
                    )}
                    <span className="flex-1 truncate text-sm text-[var(--white)]">{g.title}</span>
                    <span className="text-xs text-[var(--white-icon)]">
                      {isSelected(g) ? "Added" : "+ Add"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm text-[var(--white-icon)]">Games you have played</p>
            <ul className="flex flex-wrap gap-2">
              {selected.map((g) => (
                <li
                  key={g.id}
                  className="fade-up flex items-center gap-2 rounded-full border border-[var(--sec)]/50 bg-[var(--sec)]/10 py-1 pl-3 pr-1 text-sm text-[var(--white)]"
                >
                  <span className="max-w-[14rem] truncate">{g.title}</span>
                  <button
                    type="button"
                    onClick={() => removeGame(g.id)}
                    aria-label={`Remove ${g.title}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--white-icon)] transition hover:bg-[var(--white-icon-tr)] hover:text-white"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={recommend}
            disabled={selected.length === 0 || loading}
            className="rounded-lg bg-[var(--sec)] px-5 py-2.5 font-semibold text-[var(--background)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Finding games…" : "Get recommendations"}
          </button>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelected([]);
                setResults(null);
              }}
              className="rounded-lg border border-[var(--white-icon-tr)] px-4 py-2.5 text-sm text-[var(--white-icon)] transition hover:text-white"
            >
              Clear all
            </button>
          )}
          {selected.length === 0 && (
            <span className="text-sm text-[var(--white-icon)]">Add at least one game to start.</span>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
      </div>

      {results && (
        <div aria-live="polite">
          {results.length === 0 ? (
            <p className="rounded-lg border border-[var(--white-icon-tr)] p-5 text-[var(--white-icon)]">
              No recommendations found for these games. The games may not have embeddings yet. Run{" "}
              <code className="text-[var(--white)]">python generate_embeddings.py</code> on the backend.
            </p>
          ) : (
            <>
              <h4 className="mb-5 text-2xl font-medium text-[var(--white)]">
                Recommended for you
                <span className="ml-3 text-base text-[var(--white-icon)]">{results.length} games</span>
              </h4>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((r) => (
                  <GameCard key={r.id} game={r} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Recommender;

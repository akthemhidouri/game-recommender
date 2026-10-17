"use client";

import { useState, useEffect, useRef } from "react";

const API_URL = "http://localhost:8000";

type Genre = { id: number; name: string };
type Tag = { id: number; name: string };

type Game = {
  id: number;
  title: string;
  cover_url: string | null;
  description: string | null;
  rating: number;
  genres: Genre[];
  tags: Tag[];
};

type Recommendation = Game & {
  because_of: string | null;
  similarity: number | null;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Game[]>([]);
  const [selected, setSelected] = useState<Game[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced autocomplete search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/games/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (e) {
        console.error(e);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const addGame = (game: Game) => {
    if (!selected.find((g) => g.id === game.id)) {
      setSelected([...selected, game]);
    }
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const removeGame = (id: number) => {
    setSelected(selected.filter((g) => g.id !== id));
  };

  const getRecommendations = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    setRecommendations([]);
    try {
      const res = await fetch(`${API_URL}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected.map((g) => ({ title: g.title }))),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecommendations(data);
      } else {
        alert(data.message || "No recommendations found.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Decorative blur */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-indigo-600/20 to-transparent blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            Game Recommender
          </h1>
          <p className="mt-4 text-slate-400 text-lg">
            Tell us what you&apos;ve played. We&apos;ll find your next obsession.
          </p>
        </div>

        {/* Search Card */}
        <div className="rounded-2xl bg-slate-900/70 backdrop-blur border border-slate-800 shadow-2xl p-6 md:p-8">
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Search a game you&apos;ve played
          </label>
          <div className="relative" ref={suggestionsRef}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="e.g., Hades, Payday 2, Elden Ring..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                {suggestions.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => addGame(game)}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-700/60 transition text-left"
                  >
                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={game.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-slate-700" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-white">{game.title}</p>
                      <p className="text-xs text-slate-400">
                        {game.genres.map((g) => g.name).join(", ") || "Unknown genre"}
                      </p>
                    </div>
                    {game.rating > 0 && (
                      <span className="text-xs font-bold text-emerald-400">
                        {game.rating}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected games chips */}
          <div className="mt-6">
            <p className="text-sm font-medium text-slate-400 mb-3">
              Your library ({selected.length})
            </p>
            {selected.length === 0 ? (
              <p className="text-slate-600 italic text-sm">
                No games added yet. Search above to start.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {selected.map((game) => (
                  <div
                    key={game.id}
                    className="group flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full pl-1 pr-3 py-1 hover:border-indigo-500/50 transition"
                  >
                    {game.cover_url && (
                      <img
                        src={game.cover_url}
                        alt={game.title}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    )}
                    <span className="text-sm text-slate-200">{game.title}</span>
                    <button
                      onClick={() => removeGame(game.id)}
                      className="text-slate-500 hover:text-red-400 transition text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA Button */}
          <button
            onClick={getRecommendations}
            disabled={selected.length === 0 || loading}
            className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition shadow-lg shadow-indigo-900/40"
          >
            {loading ? "Finding your next game..." : "Get Recommendations"}
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-slate-800/60 border border-slate-800 overflow-hidden animate-pulse"
              >
                <div className="w-full h-56 bg-slate-800" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {!loading && recommendations.length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-bold text-white mb-6">
              You might like these
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {recommendations.map((game) => (
                <div
                  key={game.id}
                  className="group rounded-xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-indigo-500/60 hover:-translate-y-1 transition-all duration-200 shadow-lg"
                >
                  <div className="relative">
                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={game.title}
                        className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-56 bg-slate-800 flex items-center justify-center text-slate-600">
                        No Image
                      </div>
                    )}
                    {game.rating > 0 && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 text-xs font-bold px-2 py-1 rounded-md shadow">
                        {game.rating}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-white text-sm leading-tight mb-1">
                      {game.title}
                    </h3>
                    {game.because_of && (
                      <p className="text-[11px] text-slate-400 italic mb-2">
                        Because you liked{" "}
                        <span className="text-indigo-300 font-medium not-italic">
                          {game.because_of}
                        </span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {game.genres.slice(0, 2).map((g) => (
                        <span
                          key={g.id}
                          className="text-[10px] uppercase tracking-wide bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded"
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
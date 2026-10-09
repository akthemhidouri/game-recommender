"use client";

import { useEffect, useState } from "react";

type Game = {
  id: number;
  title: string;
  cover_url: string;
  description: string;
};

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/games")
      .then((res) => res.json())
      .then((data) => {
        setGames(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching games:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-xl">Loading games...</div>;

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-8">My Game Library</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {games.map((game) => (
          <div key={game.id} className="border rounded-lg shadow-md overflow-hidden bg-white">
            {game.cover_url ? (
              <img src={game.cover_url} alt={game.title} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">No Image</div>
            )}
            <div className="p-4">
              <h2 className="font-bold text-lg">{game.title}</h2>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
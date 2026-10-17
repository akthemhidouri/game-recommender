import { useState } from "react";
import type { Game, Recommendation } from "../lib/api";
import { cleanDescription } from "../lib/api";

interface Props {
  game: Game | Recommendation;
  action?: { label: string; onClick: () => void; disabled?: boolean };
}

function ratingColor(rating: number): string {
  if (rating >= 75) return "bg-[#1f6f3a] text-[#c8ffd9]";
  if (rating >= 50) return "bg-[#7a6a1c] text-[#fff3b0]";
  return "bg-[#7a2b2b] text-[#ffd0d0]";
}

const GameCard = ({ game, action }: Props) => {
  const [imgFailed, setImgFailed] = useState(false);
  const rec = game as Recommendation;
  const description = cleanDescription(game.description);
  const match = rec.similarity != null ? Math.max(0, Math.round(rec.similarity * 100)) : null;

  return (
    <article className="fade-up group flex flex-col overflow-hidden rounded-2xl border border-[var(--white-icon-tr)] bg-[#1414149c] transition hover:border-[var(--sec)]/50">
      <div className="relative h-44 w-full overflow-hidden bg-[#1a1a1a]">
        {game.cover_url && !imgFailed ? (
          <img
            src={game.cover_url}
            alt={`${game.title} cover`}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--white-icon)]">
            No image
          </div>
        )}
        {game.rating ? (
          <span
            className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${ratingColor(game.rating)}`}
            title="Metacritic / converted user rating"
          >
            {game.rating}
          </span>
        ) : null}
        {match !== null && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--sec)] px-2.5 py-1 text-xs font-semibold text-[var(--background)]">
            {match}% match
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h4 className="text-lg font-semibold leading-snug text-[var(--white)]">{game.title}</h4>

        {rec.because_of && (
          <p className="text-sm text-[var(--sec)]">
            Because you played <span className="font-semibold">{rec.because_of}</span>
          </p>
        )}

        {game.genres.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {game.genres.map((g) => (
              <li
                key={g.id}
                className="rounded-full border border-[var(--white-icon-tr)] px-2.5 py-0.5 text-xs text-[var(--white-icon)]"
              >
                {g.name}
              </li>
            ))}
          </ul>
        )}

        {description && (
          <p className="line-clamp-3 text-sm text-[var(--white-icon)]">{description}</p>
        )}

        {action && (
          <button
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className="mt-auto rounded-lg border border-[var(--white-icon-tr)] bg-[var(--white-icon-tr)] px-3 py-2 text-sm text-[var(--white)] opacity-70 transition hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {action.label}
          </button>
        )}
      </div>
    </article>
  );
};

export default GameCard;

import { useState } from "react";
import type { Game, Recommendation } from "../lib/api";
import { cleanDescription } from "../lib/api";

interface Props {
  game: Game | Recommendation;
  action?: { label: string; onClick: () => void; disabled?: boolean };
}

function ratingColor(rating: number): string {
  if (rating >= 75) return "border-[#c5f36a]/30 bg-[#c5f36a]/15 text-[#d8ff9c]";
  if (rating >= 50) return "border-[#f3c86a]/30 bg-[#f3c86a]/15 text-[#ffe5a0]";
  return "border-[#ff7c70]/30 bg-[#ff7c70]/15 text-[#ffc0b9]";
}

const GameCard = ({ game, action }: Props) => {
  const [imgFailed, setImgFailed] = useState(false);
  const rec = game as Recommendation;
  const description = cleanDescription(game.description);
  const match = rec.similarity != null ? Math.max(0, Math.round(rec.similarity * 100)) : null;

  return (
    <article className="fade-up group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#11161a] transition duration-300 hover:-translate-y-1 hover:border-[var(--sec)]/45 hover:shadow-[0_18px_50px_#00000055]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#171d1e]">
        {game.cover_url && !imgFailed ? (
          <img
            src={game.cover_url}
            alt={`${game.title} cover`}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--white-icon)]">
            No image
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080a0d]/90 via-transparent to-black/10" aria-hidden="true" />
        {game.rating ? (
          <span
            className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-md ${ratingColor(game.rating)}`}
            title="Metacritic / converted user rating"
          >
            {game.rating}
          </span>
        ) : null}
        {match !== null && (
          <span className="absolute left-3 top-3 rounded-full border border-[var(--sec)]/30 bg-[#11180c]/85 px-2.5 py-1 text-xs font-semibold text-[var(--sec)] backdrop-blur-md">
            {match}% match
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h4 className="text-lg font-semibold leading-snug text-[var(--white)]">{game.title}</h4>

        {rec.because_of && (
          <p className="border-l-2 border-[var(--sec)]/70 pl-3 text-sm text-[var(--white-icon)]">
            Matches your taste for <span className="font-semibold text-[var(--sec)]">{rec.because_of}</span>
          </p>
        )}

        {game.genres.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {game.genres.map((g) => (
              <li
                key={g.id}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.68rem] text-[var(--white-icon)]"
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
            className="mt-auto rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-[var(--white)] transition hover:border-[var(--sec)]/50 hover:bg-[var(--sec)]/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {action.label}
          </button>
        )}
      </div>
    </article>
  );
};

export default GameCard;

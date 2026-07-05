import { Card, SUIT_COLORS, SUIT_SYMBOLS } from "@/lib/types";

type PlayingCardProps = {
  card?: Card;
  hidden?: boolean;
  blind?: boolean;
  small?: boolean;
};

export function PlayingCard({ card, hidden, blind, small }: PlayingCardProps) {
  const sizeClass = small ? "h-16 w-11 text-sm" : "h-24 w-16 text-lg";

  if (hidden || blind || !card) {
    return (
      <div
        className={`${sizeClass} flex shrink-0 items-center justify-center rounded-lg border-2 border-neutral-600 bg-neutral-800 font-bold text-neutral-400`}
      >
        {blind ? "?" : "🂠"}
      </div>
    );
  }

  const colorClass = SUIT_COLORS[card.suit];

  return (
    <div
      className={`${sizeClass} flex shrink-0 flex-col items-center justify-center rounded-lg border-2 border-neutral-500 bg-neutral-900 shadow-md`}
    >
      <span className={`font-bold ${colorClass}`}>{card.rank}</span>
      <span className={`text-base ${colorClass}`}>{SUIT_SYMBOLS[card.suit]}</span>
    </div>
  );
}

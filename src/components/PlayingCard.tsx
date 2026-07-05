import type { CSSProperties } from "react";
import { Card, SUIT_COLORS, SUIT_SYMBOLS } from "@/lib/types";

export type CardSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<CardSize, string> = {
  xs: "h-14 w-10 text-[10px]",
  sm: "h-[4.5rem] w-[3.2rem] text-xs",
  md: "h-24 w-[4.25rem] text-sm",
  lg: "h-32 w-[5.6rem] text-base",
  xl: "h-[7.5rem] w-[5.4rem] text-lg sm:h-40 sm:w-[5.8rem] sm:text-xl",
};

const CENTER_SUIT: Record<CardSize, string> = {
  xs: "text-lg",
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
  xl: "text-5xl",
};

type PlayingCardProps = {
  card?: Card;
  hidden?: boolean;
  blind?: boolean;
  size?: CardSize;
  className?: string;
  style?: CSSProperties;
};

function CardBack({ size, blind }: { size: CardSize; blind?: boolean }) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} relative overflow-hidden rounded-xl border-2 border-red-900/80 shadow-[0_4px_14px_rgba(0,0,0,0.45)]`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-900 to-[#3b0a0a]" />
      <div className="absolute inset-1 rounded-lg border border-red-400/20 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_4px,transparent_4px,transparent_8px)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        {blind ? (
          <span className="text-2xl font-black text-red-200/90">?</span>
        ) : (
          <span className="text-xl font-bold tracking-widest text-red-200/40">BLIND</span>
        )}
      </div>
    </div>
  );
}

function CardFace({ card, size }: { card: Card; size: CardSize }) {
  const colorClass = SUIT_COLORS[card.suit];
  const suit = SUIT_SYMBOLS[card.suit];
  const isRed = card.suit === "H" || card.suit === "D";

  return (
    <div
      className={`${SIZE_CLASSES[size]} relative overflow-hidden rounded-xl border border-neutral-300 bg-gradient-to-br from-white via-neutral-50 to-neutral-100 shadow-[0_4px_14px_rgba(0,0,0,0.35)]`}
    >
      <div
        className={`absolute left-1.5 top-1 flex flex-col items-center leading-none ${colorClass}`}
      >
        <span className="font-black">{card.rank}</span>
        <span className="text-[0.85em]">{suit}</span>
      </div>

      <div
        className={`absolute inset-0 flex items-center justify-center ${CENTER_SUIT[size]} ${colorClass} opacity-90`}
      >
        {suit}
      </div>

      <div
        className={`absolute bottom-1 right-1.5 flex rotate-180 flex-col items-center leading-none ${colorClass}`}
      >
        <span className="font-black">{card.rank}</span>
        <span className="text-[0.85em]">{suit}</span>
      </div>

      {card.rank === "2" ? (
        <div className="absolute right-1 top-1 rounded bg-amber-400 px-1 text-[8px] font-bold text-amber-950">
          JOKER
        </div>
      ) : null}

      <div
        className={`pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ${isRed ? "ring-red-200/30" : "ring-neutral-300/40"}`}
      />
    </div>
  );
}

export function PlayingCard({
  card,
  hidden,
  blind,
  size = "md",
  className = "",
  style,
}: PlayingCardProps) {
  if (hidden || blind || !card) {
    return (
      <div className={className} style={style}>
        <CardBack size={size} blind={blind} />
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <CardFace card={card} size={size} />
    </div>
  );
}

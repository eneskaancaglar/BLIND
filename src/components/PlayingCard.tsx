import type { CSSProperties } from "react";
import { Card, SUIT_SYMBOLS } from "@/lib/types";

export type CardSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<CardSize, string> = {
  xs: "h-14 w-10 text-[10px]",
  sm: "h-[4.75rem] w-[3.35rem] text-xs",
  md: "h-24 w-[4.35rem] text-sm",
  lg: "h-32 w-[5.75rem] text-base",
  xl: "h-[7.75rem] w-[5.5rem] text-lg sm:h-[10.25rem] sm:w-[6rem] sm:text-xl",
};

const CENTER_SUIT: Record<CardSize, string> = {
  xs: "text-lg",
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
  xl: "text-5xl sm:text-6xl",
};

type PlayingCardProps = {
  card?: Card;
  hidden?: boolean;
  blind?: boolean;
  size?: CardSize;
  faceDown?: boolean;
  tilt?: "hand" | "table" | "flat";
  className?: string;
  style?: CSSProperties;
};

const TILT_CLASS = {
  hand: "card-tilt-hand",
  table: "card-tilt-table",
  flat: "card-tilt-flat",
};

function CardBack({ size, blind }: { size: CardSize; blind?: boolean }) {
  return (
    <div className={`card-body card-body-back ${SIZE_CLASSES[size]}`}>
      <div className="card-back-pattern absolute inset-1 rounded-[0.6rem]" />
      <div className="card-back-diamond absolute inset-3 rounded-md border border-white/15" />
      <div className="absolute inset-0 flex items-center justify-center">
        {blind ? (
          <span className="text-2xl font-black text-white/90 drop-shadow">?</span>
        ) : (
          <span className="text-[0.65rem] font-bold tracking-[0.25em] text-white/50 sm:text-xs">
            BLIND
          </span>
        )}
      </div>
    </div>
  );
}

function CardFace({ card, size }: { card: Card; size: CardSize }) {
  const suit = SUIT_SYMBOLS[card.suit];
  const isRed = card.suit === "H" || card.suit === "D";
  const inkClass = isRed ? "text-red-700" : "text-slate-900";

  return (
    <div className={`card-body card-body-face ${SIZE_CLASSES[size]}`}>
      <div className="card-face-shine pointer-events-none absolute inset-0 rounded-[0.65rem]" />

      <div
        className={`absolute left-1.5 top-1.5 flex flex-col items-center leading-none ${inkClass}`}
      >
        <span className="font-black drop-shadow-sm">{card.rank}</span>
        <span className="text-[0.9em] font-bold">{suit}</span>
      </div>

      <div
        className={`absolute inset-0 flex items-center justify-center ${CENTER_SUIT[size]} ${inkClass}`}
      >
        <span className="drop-shadow-sm">{suit}</span>
      </div>

      <div
        className={`absolute bottom-1.5 right-1.5 flex rotate-180 flex-col items-center leading-none ${inkClass}`}
      >
        <span className="font-black">{card.rank}</span>
        <span className="text-[0.9em] font-bold">{suit}</span>
      </div>

      {card.rank === "2" ? (
        <div className="absolute right-1 top-1 rounded-md bg-gradient-to-r from-amber-300 to-yellow-400 px-1.5 py-0.5 text-[8px] font-black text-amber-950 shadow">
          JOKER
        </div>
      ) : null}

      <div
        className={`pointer-events-none absolute inset-0 rounded-[0.65rem] ring-1 ring-inset ${isRed ? "ring-red-300/40" : "ring-slate-400/30"}`}
      />
    </div>
  );
}

export function PlayingCard({
  card,
  hidden,
  blind,
  size = "md",
  faceDown,
  tilt = "hand",
  className = "",
  style,
}: PlayingCardProps) {
  const showBack = hidden || blind || faceDown || !card;

  return (
    <div className={`card-scene ${className}`} style={style}>
      <div className={TILT_CLASS[tilt]}>
        {showBack ? (
          <CardBack size={size} blind={blind} />
        ) : (
          <CardFace card={card} size={size} />
        )}
      </div>
    </div>
  );
}

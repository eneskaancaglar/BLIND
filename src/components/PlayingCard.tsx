"use client";

import type { CSSProperties } from "react";
import { cardMatchesBid } from "@/lib/gameLogic";
import { Card, CardBackColor, Rank, SUIT_SYMBOLS } from "@/lib/types";

export type CardSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<CardSize, string> = {
  xs: "h-[4.5rem] w-[3.2rem] text-[12px]",
  sm: "h-[5.5rem] w-[3.95rem] text-sm",
  md: "h-[6.75rem] w-[4.85rem] text-base",
  lg: "h-[8.25rem] w-[5.85rem] text-lg",
  xl: "h-[9rem] w-[6.35rem] text-xl sm:h-[10.5rem] sm:w-[7rem]",
};

type PlayingCardProps = {
  card?: Card;
  hidden?: boolean;
  blind?: boolean;
  size?: CardSize;
  faceDown?: boolean;
  backColor?: CardBackColor;
  tilt?: "hand" | "table" | "flat";
  highlight?: boolean;
  highlightRank?: Rank;
  className?: string;
  style?: CSSProperties;
};

const TILT_CLASS = {
  hand: "card-tilt-hand",
  table: "card-tilt-table",
  flat: "card-tilt-flat",
};

function CardBack({
  size,
  blind,
  backColor = "blue",
}: {
  size: CardSize;
  blind?: boolean;
  backColor?: CardBackColor;
}) {
  const toneClass = backColor === "red" ? "card-back-red" : "card-back-blue";

  return (
    <div className={`card-body card-body-back ${toneClass} ${SIZE_CLASSES[size]}`}>
      <div className="card-back-lattice absolute inset-[4px]" />
      <div className="card-back-frame" />
      <div className="absolute inset-0 flex items-center justify-center">
        {blind ? (
          <span className="text-2xl font-light text-white/90">?</span>
        ) : (
          <span className={`card-back-emblem ${backColor === "red" ? "card-back-emblem-red" : ""}`}>
            ♠
          </span>
        )}
      </div>
    </div>
  );
}

function CardFace({ card, size }: { card: Card; size: CardSize }) {
  const suit = SUIT_SYMBOLS[card.suit];
  const isRed = card.suit === "H" || card.suit === "D";
  const inkClass = isRed ? "text-[#c8102e]" : "text-[#111827]";

  return (
    <div className={`card-body card-body-face ${SIZE_CLASSES[size]}`}>
      <div
        className={`card-corner absolute left-1 top-0.5 flex flex-col items-center leading-none ${inkClass}`}
      >
        <span className="font-bold leading-none">{card.rank}</span>
        <span className="text-[0.95em] font-bold leading-none">{suit}</span>
      </div>

      <div
        className={`absolute inset-0 flex items-center justify-center font-bold ${inkClass} ${
          size === "xs" ? "text-2xl" : size === "sm" ? "text-3xl" : size === "md" ? "text-4xl" : "text-5xl"
        }`}
      >
        <span>{suit}</span>
      </div>

      <div
        className={`card-corner absolute bottom-0.5 right-1 flex rotate-180 flex-col items-center leading-none ${inkClass}`}
      >
        <span className="font-bold leading-none">{card.rank}</span>
        <span className="text-[0.95em] font-bold leading-none">{suit}</span>
      </div>

      {card.rank === "2" ? (
        <div className="absolute right-0.5 top-0.5 rounded border border-amber-500 bg-amber-50 px-1 py-0.5 text-[7px] font-bold text-amber-900">
          2
        </div>
      ) : null}
    </div>
  );
}

export function PlayingCard({
  card,
  hidden,
  blind,
  size = "md",
  faceDown,
  backColor,
  tilt = "hand",
  highlight = false,
  highlightRank,
  className = "",
  style,
}: PlayingCardProps) {
  const showBack = hidden || blind || faceDown || !card;
  const resolvedBack = backColor ?? card?.backColor ?? "blue";
  const isHighlighted =
    highlight || Boolean(card && highlightRank && cardMatchesBid(card, highlightRank));

  return (
    <div
      className={`card-scene ${isHighlighted ? "card-bid-highlight" : ""} ${className}`}
      style={style}
    >
      <div className={TILT_CLASS[tilt]}>
        {showBack ? (
          <CardBack size={size} blind={blind} backColor={resolvedBack} />
        ) : (
          <CardFace card={card} size={size} />
        )}
      </div>
    </div>
  );
}

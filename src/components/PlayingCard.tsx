import type { CSSProperties } from "react";
import { cardMatchesBid } from "@/lib/gameLogic";
import { Card, Rank, SUIT_SYMBOLS } from "@/lib/types";

export type CardSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<CardSize, string> = {
  xs: "h-14 w-10 text-[10px]",
  sm: "h-[4.75rem] w-[3.35rem] text-xs",
  md: "h-24 w-[4.35rem] text-sm",
  lg: "h-32 w-[5.75rem] text-base",
  xl: "h-[7.75rem] w-[5.5rem] text-lg sm:h-[10.25rem] sm:w-[6rem] sm:text-xl",
};

const RANK_FONT: Record<CardSize, string> = {
  xs: "text-[12px]",
  sm: "text-[15px]",
  md: "text-[17px]",
  lg: "text-[20px]",
  xl: "text-[22px]",
};

const SUIT_CORNER: Record<CardSize, string> = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

type PlayingCardProps = {
  card?: Card;
  hidden?: boolean;
  blind?: boolean;
  size?: CardSize;
  faceDown?: boolean;
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
  tableBack,
}: {
  size: CardSize;
  blind?: boolean;
  tableBack?: boolean;
}) {
  return (
    <div
      className={`card-body ${tableBack ? "card-body-back-table" : "card-body-back"} ${SIZE_CLASSES[size]}`}
    >
      <div className="card-back-pattern absolute inset-[3px]" />
      <div className="card-back-frame" />
      <div className="absolute inset-0 flex items-center justify-center">
        {blind ? (
          <span className="text-xl font-light tracking-widest text-slate-300/90">?</span>
        ) : (
          <span className="card-back-label">BLIND</span>
        )}
      </div>
    </div>
  );
}

function CardFace({ card, size }: { card: Card; size: CardSize }) {
  const suit = SUIT_SYMBOLS[card.suit];
  const isRed = card.suit === "H" || card.suit === "D";
  const inkClass = isRed ? "text-red-800" : "text-slate-900";

  return (
    <div className={`card-body card-body-face ${SIZE_CLASSES[size]}`}>
      <div className="card-face-shine pointer-events-none absolute inset-0" />

      <div
        className={`card-corner absolute left-1 top-1 flex flex-col items-center leading-none ${inkClass}`}
      >
        <span className={`card-rank font-bold ${RANK_FONT[size]}`}>{card.rank}</span>
        <span className={`font-semibold ${SUIT_CORNER[size]}`}>{suit}</span>
      </div>

      <div
        className={`absolute inset-0 flex items-center justify-center text-2xl font-semibold sm:text-3xl ${inkClass} ${size === "xs" ? "text-xl" : ""} ${size === "lg" || size === "xl" ? "text-4xl sm:text-5xl" : ""}`}
      >
        <span>{suit}</span>
      </div>

      <div
        className={`card-corner absolute bottom-1 right-1 flex rotate-180 flex-col items-center leading-none ${inkClass}`}
      >
        <span className={`card-rank font-bold ${RANK_FONT[size]}`}>{card.rank}</span>
        <span className={`font-semibold ${SUIT_CORNER[size]}`}>{suit}</span>
      </div>

      {card.rank === "2" ? (
        <div className="absolute right-0.5 top-0.5 rounded-sm border border-amber-400/40 bg-amber-100 px-1 py-0.5 text-[7px] font-semibold tracking-wide text-amber-900">
          JOKER
        </div>
      ) : null}

      <div
        className={`pointer-events-none absolute inset-0 ring-1 ring-inset ${isRed ? "ring-red-300/30" : "ring-slate-400/25"}`}
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
  highlight = false,
  highlightRank,
  className = "",
  style,
}: PlayingCardProps) {
  const showBack = hidden || blind || faceDown || !card;
  const tableBack = Boolean(faceDown && !blind);
  const isHighlighted =
    highlight || Boolean(card && highlightRank && cardMatchesBid(card, highlightRank));

  return (
    <div
      className={`card-scene ${isHighlighted ? "card-bid-highlight" : ""} ${className}`}
      style={style}
    >
      <div className={TILT_CLASS[tilt]}>
        {showBack ? (
          <CardBack size={size} blind={blind} tableBack={tableBack} />
        ) : (
          <CardFace card={card} size={size} />
        )}
      </div>
    </div>
  );
}

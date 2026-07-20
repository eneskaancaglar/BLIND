"use client";

import { Bid, Suit } from "@/lib/types";
import { PlayingCard } from "./PlayingCard";

function demoSuit(): Suit {
  return "H";
}

type CurrentBidDisplayProps = {
  bid: Bid;
  playerName?: string;
  compact?: boolean;
  strip?: boolean;
};

export function CurrentBidDisplay({
  bid,
  playerName,
  compact = false,
  strip = false,
}: CurrentBidDisplayProps) {
  const cardSize = strip ? "xs" : compact ? "sm" : "md";

  return (
    <div className={`bid-display flex items-center ${strip ? "flex-row gap-2" : "flex-col gap-1"}`}>
      <div
        className={`bid-display-row flex items-center justify-center ${strip ? "gap-1.5" : "gap-2 sm:gap-3"}`}
      >
        <PlayingCard card={{ rank: bid.rank, suit: demoSuit() }} size={cardSize} tilt="flat" />
        <span className={`bid-display-count ${strip ? "bid-display-count-strip" : ""}`}>
          ×{bid.count}
        </span>
      </div>
      {playerName ? (
        <p
          className={`truncate text-slate-400 ${
            strip ? "max-w-[7rem] text-[10px]" : "max-w-[11rem] text-[11px]"
          }`}
        >
          {playerName}
        </p>
      ) : null}
    </div>
  );
}

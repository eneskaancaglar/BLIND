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
};

export function CurrentBidDisplay({ bid, playerName, compact = false }: CurrentBidDisplayProps) {
  return (
    <div className="bid-display flex flex-col items-center gap-1">
      <div className="bid-display-row flex items-center justify-center gap-2 sm:gap-3">
        <PlayingCard
          card={{ rank: bid.rank, suit: demoSuit() }}
          size={compact ? "sm" : "md"}
          tilt="flat"
        />
        <div className="bid-display-meta flex flex-col items-start leading-none">
          <span className="bid-display-count">×{bid.count}</span>
        </div>
      </div>
      {playerName ? (
        <p className="max-w-[11rem] truncate text-[11px] text-slate-400">{playerName}</p>
      ) : null}
    </div>
  );
}

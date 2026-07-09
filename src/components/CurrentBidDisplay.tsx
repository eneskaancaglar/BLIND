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
  const displayCount = Math.min(bid.count, compact ? 4 : 5);
  const cardSize = compact ? "xs" : "sm";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end justify-center">
        {Array.from({ length: displayCount }).map((_, index) => (
          <div
            key={`bid-card-${index}`}
            style={{ marginLeft: index === 0 ? 0 : compact ? -14 : -18, zIndex: index }}
          >
            <PlayingCard
              card={{ rank: bid.rank, suit: demoSuit() }}
              size={cardSize}
              tilt="flat"
            />
          </div>
        ))}
        {bid.count > displayCount ? (
          <span className="ml-2 text-lg font-semibold text-white">×{bid.count}</span>
        ) : (
          <span className="ml-2 text-sm font-medium text-slate-400">×{bid.count}</span>
        )}
      </div>
      {playerName ? (
        <p className="max-w-[10rem] truncate text-xs text-slate-400">{playerName}</p>
      ) : null}
    </div>
  );
}

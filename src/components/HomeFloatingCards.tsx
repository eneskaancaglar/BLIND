"use client";

import { useMemo } from "react";
import { PlayingCard } from "@/components/PlayingCard";
import type { Card, Suit } from "@/lib/types";

const SUITS: Suit[] = ["H", "D", "C", "S"];
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7"] as const;

const X_OFFSETS = [-105, -75, -45, -15, 15, 45, 75, 105, -90, -30, 30, 90];

type Floater = {
  id: number;
  card: Card;
  xOffset: number;
  top: number;
  delay: number;
  duration: number;
  rotation: number;
  drift: number;
};

function randomCard(seed: number): Card {
  return {
    rank: RANKS[seed % RANKS.length] as Card["rank"],
    suit: SUITS[seed % SUITS.length],
  };
}

function buildFloaters(count: number): Floater[] {
  return Array.from({ length: count }, (_, i) => {
    const duration = 10 + (i % 5) * 2.2;
    const phase = (i * 1.85) % duration;

    return {
      id: i,
      card: randomCard(i * 7 + 3),
      xOffset: X_OFFSETS[i % X_OFFSETS.length],
      top: 8 + ((i * 23 + 11) % 78),
      delay: -phase,
      duration,
      rotation: -18 + (i % 9) * 5,
      drift: i % 2 === 0 ? 1 : -1,
    };
  });
}

export function HomeFloatingCards() {
  const floaters = useMemo(() => buildFloaters(12), []);

  return (
    <div className="home-floating-cards pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {floaters.map((item) => (
        <div
          key={item.id}
          className="home-floater absolute"
          style={{
            left: "50%",
            top: `${item.top}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            ["--x" as string]: `${item.xOffset}px`,
            ["--drift" as string]: item.drift,
            ["--rot" as string]: `${item.rotation}deg`,
          }}
        >
          <PlayingCard card={item.card} size="sm" tilt="flat" />
        </div>
      ))}
    </div>
  );
}

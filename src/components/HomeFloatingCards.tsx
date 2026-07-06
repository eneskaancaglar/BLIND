"use client";

import { useMemo } from "react";
import { PlayingCard } from "@/components/PlayingCard";
import type { Card, Suit } from "@/lib/types";

const SUITS: Suit[] = ["H", "D", "C", "S"];
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7"] as const;

type Floater = {
  id: number;
  card: Card;
  left: number;
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
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    card: randomCard(i * 7 + 3),
    left: 28 + ((i * 19 + 7) % 44),
    top: 10 + ((i * 23 + 5) % 72),
    delay: (i % 8) * 0.85,
    duration: 11 + (i % 6) * 1.8,
    rotation: -22 + (i % 9) * 6,
    drift: i % 2 === 0 ? 1 : -1,
  }));
}

export function HomeFloatingCards() {
  const floaters = useMemo(() => buildFloaters(12), []);

  return (
    <div className="home-floating-cards pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {floaters.map((item) => (
        <div
          key={item.id}
          className="home-floater absolute opacity-[0.22]"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
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

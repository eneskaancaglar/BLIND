"use client";

import { useEffect, useMemo, useState } from "react";
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

function buildFloaters(count: number, seed: number): Floater[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    card: randomCard(i * 7 + 3 + seed),
    left: 5 + ((i * 17 + seed) % 85),
    top: 8 + ((i * 23 + seed) % 78),
    delay: (i % 6) * 0.7,
    duration: 9 + (i % 5) * 2,
    rotation: -25 + (i % 7) * 8,
    drift: i % 2 === 0 ? 1 : -1,
  }));
}

export function HomeFloatingCards() {
  const [tick, setTick] = useState(0);
  const floaters = useMemo(() => buildFloaters(10, tick), [tick]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick((t) => t + 1);
    }, 12000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="home-floating-cards pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {floaters.map((item) => (
        <div
          key={`${item.id}-${tick}`}
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

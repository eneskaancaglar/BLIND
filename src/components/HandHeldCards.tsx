"use client";

import { useEffect, useRef } from "react";
import { useSound } from "@/context/SoundContext";
import type { HandOrientation } from "@/lib/seatLayout";
import { Card as CardType } from "@/lib/types";
import { CardFan } from "./CardFan";
import type { CardSize } from "./PlayingCard";

type HandHeldCardsProps = {
  cards?: CardType[];
  count?: number;
  hidden?: boolean;
  blind?: boolean;
  faceDown?: boolean;
  showCards?: boolean;
  size?: CardSize;
  orientation?: HandOrientation;
  animateDeal?: boolean;
  dealKey?: string | number;
};

function HandPalm({ orientation }: { orientation: HandOrientation }) {
  const rotation =
    orientation === "up"
      ? 180
      : orientation === "down"
        ? 0
        : orientation === "left"
          ? 90
          : -90;

  return (
    <svg
      className="hand-palm-svg"
      viewBox="0 0 72 48"
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden
    >
      <path
        d="M8 28 C8 14, 18 6, 28 8 L30 2 C32 0, 36 0, 36 4 L36 10 C38 8, 42 8, 42 12 L42 18 C44 16, 48 16, 48 20 L48 26 C50 24, 56 24, 58 28 C62 34, 58 42, 48 44 L20 44 C12 42, 6 36, 8 28 Z"
        fill="rgba(210, 170, 130, 0.55)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
      />
      <ellipse cx="22" cy="10" rx="4" ry="7" fill="rgba(210, 170, 130, 0.5)" />
      <ellipse cx="30" cy="6" rx="4" ry="8" fill="rgba(210, 170, 130, 0.5)" />
      <ellipse cx="38" cy="6" rx="4" ry="8" fill="rgba(210, 170, 130, 0.5)" />
      <ellipse cx="46" cy="10" rx="4" ry="7" fill="rgba(210, 170, 130, 0.5)" />
      <ellipse cx="54" cy="16" rx="3.5" ry="6" fill="rgba(210, 170, 130, 0.45)" />
    </svg>
  );
}

export function HandHeldCards({
  cards = [],
  count,
  hidden,
  blind,
  faceDown,
  showCards,
  size = "sm",
  orientation = "down",
  animateDeal = false,
  dealKey,
}: HandHeldCardsProps) {
  const { play } = useSound();
  const total = count ?? cards.length;
  const playedRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (!animateDeal || total === 0) return;
    if (dealKey !== undefined && playedRef.current === dealKey) return;
    playedRef.current = dealKey ?? Date.now();

    const timers: number[] = [];
    for (let i = 0; i < Math.min(total, 6); i += 1) {
      timers.push(
        window.setTimeout(() => {
          play(i === 0 ? "deal" : "card");
        }, i * 90)
      );
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [animateDeal, dealKey, total, play]);

  if (total === 0) return null;

  const showFace = showCards && !hidden && !blind && !faceDown;

  return (
    <div className={`hand-held hand-held-${orientation}`}>
      <div className="hand-palm-wrap">
        <HandPalm orientation={orientation} />
      </div>
      <div className="hand-cards-wrap">
        <CardFan
          cards={showFace ? cards : []}
          count={showFace ? undefined : total}
          hidden={hidden}
          blind={blind}
          faceDown={faceDown || !showFace}
          size={size}
          spread="tight"
          tilt="table"
          showCountBadge
          animateDeal={animateDeal}
          dealKey={dealKey}
        />
      </div>
    </div>
  );
}

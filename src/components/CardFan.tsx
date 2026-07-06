"use client";

import { useEffect, useState } from "react";
import { Card as CardType } from "@/lib/types";
import { PlayingCard, CardSize } from "./PlayingCard";

type CardFanProps = {
  cards?: CardType[];
  count?: number;
  hidden?: boolean;
  blind?: boolean;
  size?: CardSize;
  spread?: "tight" | "normal" | "wide";
  faceDown?: boolean;
  tilt?: "hand" | "table" | "flat";
  showCountBadge?: boolean;
  animateDeal?: boolean;
  dealKey?: string | number;
};

export function CardFan({
  cards = [],
  count,
  hidden,
  blind,
  size = "md",
  spread = "normal",
  faceDown = false,
  tilt = "hand",
  showCountBadge = false,
  animateDeal = false,
  dealKey,
}: CardFanProps) {
  const total = count ?? cards.length;
  const [visibleCount, setVisibleCount] = useState(animateDeal ? 0 : total);

  useEffect(() => {
    if (!animateDeal) {
      setVisibleCount(total);
      return;
    }

    setVisibleCount(0);
    const timers: number[] = [];
    for (let i = 1; i <= total; i += 1) {
      timers.push(window.setTimeout(() => setVisibleCount(i), i * 85));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [animateDeal, dealKey, total]);

  if (total === 0) return null;

  const overlap =
    spread === "tight" ? 20 : spread === "wide" ? 32 : size === "xl" ? 36 : 24;
  const maxRotate = spread === "wide" ? 14 : spread === "tight" ? 6 : 10;

  const items = hidden || blind || faceDown
    ? Array.from({ length: total })
    : cards.map((card, index) => ({ card, index }));

  const isBack = hidden || blind || faceDown;
  const renderCount = animateDeal ? Math.min(visibleCount, total) : total;

  return (
    <div className="relative flex w-full flex-col items-center">
      {showCountBadge && isBack ? (
        <div className="count-badge mb-1">{total}</div>
      ) : null}

      <div
        className="card-fan-row flex items-end justify-center"
        style={{
          minHeight:
            size === "xl" ? "11rem" : size === "lg" ? "8.5rem" : size === "sm" ? "5.5rem" : "6rem",
        }}
      >
        {items.slice(0, renderCount).map((item, i) => {
          const center = (total - 1) / 2;
          const rotate = (i - center) * (maxRotate / Math.max(center, 1));
          const lift = Math.abs(i - center) * (spread === "wide" ? 3 : 2);

          return (
            <div
              key={isBack ? `wrap-${i}` : `wrap-${(item as { index: number }).index}`}
              className={animateDeal ? "card-deal-in" : ""}
              style={{
                marginLeft: i === 0 ? 0 : -overlap,
                zIndex: i,
                animationDelay: animateDeal ? `${i * 0.07}s` : undefined,
              }}
            >
              <PlayingCard
                key={isBack ? `back-${i}` : `card-${(item as { index: number }).index}`}
                card={isBack ? undefined : (item as { card: CardType }).card}
                hidden={hidden && !blind && !faceDown}
                blind={blind}
                faceDown={faceDown}
                size={size}
                tilt={tilt}
                style={{
                  transform: `rotate(${rotate}deg) translateY(${lift}px)`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

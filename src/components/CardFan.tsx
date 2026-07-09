"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Card as CardType, Rank } from "@/lib/types";
import { PlayingCard, CardSize } from "./PlayingCard";

const CARD_WIDTH_PX: Record<CardSize, number> = {
  xs: 40,
  sm: 53.6,
  md: 69.6,
  lg: 92,
  xl: 96,
};

function computeFitOverlap(
  cardWidth: number,
  count: number,
  maxWidth: number,
  baseOverlap: number
): number {
  if (count <= 1) return 0;

  const minVisibleStep = 7;
  const maxAllowedOverlap = cardWidth - minVisibleStep;
  const requiredOverlap = (count * cardWidth - maxWidth) / (count - 1);

  return Math.min(maxAllowedOverlap, Math.max(baseOverlap, requiredOverlap));
}

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
  maxVisible?: number;
  fitAll?: boolean;
  animateDeal?: boolean;
  dealKey?: string | number;
  highlightRank?: Rank;
  className?: string;
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
  maxVisible,
  fitAll = false,
  animateDeal = false,
  dealKey,
  highlightRank,
  className = "",
}: CardFanProps) {
  const total = count ?? cards.length;
  const displayTotal = maxVisible ? Math.min(total, maxVisible) : total;
  const [visibleCount, setVisibleCount] = useState(animateDeal ? 0 : displayTotal);
  const fanWrapRef = useRef<HTMLDivElement>(null);
  const [fanWidth, setFanWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!fitAll) {
      setFanWidth(null);
      return;
    }

    const el = fanWrapRef.current;
    if (!el) return;

    const measure = () => setFanWidth(el.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitAll, displayTotal]);

  useEffect(() => {
    if (!animateDeal) {
      setVisibleCount(displayTotal);
      return;
    }

    setVisibleCount(0);
    const timers: number[] = [];
    for (let i = 1; i <= displayTotal; i += 1) {
      timers.push(window.setTimeout(() => setVisibleCount(i), i * 85));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [animateDeal, dealKey, displayTotal]);

  if (total === 0) return null;

  const baseOverlap =
    spread === "tight" ? (size === "xs" ? 14 : 20) : spread === "wide" ? 32 : size === "xl" ? 36 : 24;
  const overlap =
    fitAll && fanWidth
      ? computeFitOverlap(CARD_WIDTH_PX[size], displayTotal, fanWidth, baseOverlap)
      : baseOverlap;
  const cardWidth = CARD_WIDTH_PX[size];
  const step = displayTotal <= 1 ? cardWidth : cardWidth - overlap;
  const estimatedWidth =
    displayTotal <= 1 ? cardWidth : cardWidth + (displayTotal - 1) * step;
  const fitScale =
    fitAll && fanWidth && estimatedWidth > fanWidth ? (fanWidth / estimatedWidth) * 0.96 : 1;
  const fanLift =
    fitAll && displayTotal > 3 ? 0 : spread === "wide" ? 3 : spread === "tight" ? 1 : 2;
  const maxRotate =
    fitAll && displayTotal > 4 ? 2 : spread === "wide" ? 14 : spread === "tight" ? 5 : 10;

  const visibleCards = maxVisible ? cards.slice(0, maxVisible) : cards;
  const items = hidden || blind || faceDown
    ? Array.from({ length: displayTotal })
    : visibleCards.map((card, index) => ({ card, index }));

  const isBack = hidden || blind || faceDown;
  const renderCount = animateDeal ? Math.min(visibleCount, displayTotal) : displayTotal;

  const rowMinHeight =
    size === "xl"
      ? "11rem"
      : size === "lg"
        ? "8.5rem"
        : size === "sm"
          ? "5.5rem"
          : size === "xs"
            ? "3.25rem"
            : "6rem";

  return (
    <div ref={fanWrapRef} className={`relative flex w-full flex-col items-center ${className}`}>
      {showCountBadge && isBack ? (
        <div className="count-badge mb-1">{total}</div>
      ) : null}

      <div
        className="card-fan-row flex items-end justify-center"
        style={{
          minHeight: rowMinHeight,
          transform: fitScale < 1 ? `scale(${fitScale})` : undefined,
          transformOrigin: "bottom center",
        }}
      >
        {items.slice(0, renderCount).map((item, i) => {
          const center = (displayTotal - 1) / 2;
          const rotate = (i - center) * (maxRotate / Math.max(center, 1));
          const lift = Math.abs(i - center) * fanLift;

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
                highlightRank={highlightRank}
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

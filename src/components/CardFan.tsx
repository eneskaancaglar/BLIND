"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getSeatCardLayout, getSeatLayoutFromAnchor, type SeatPosition } from "@/lib/seatLayout";
import { Card as CardType, CardBackColor, Rank } from "@/lib/types";
import { PlayingCard, CardSize, CARD_DIMENSIONS } from "./PlayingCard";

function resolveBackColor(
  index: number,
  deckCount: 1 | 2,
  card?: CardType
): CardBackColor {
  if (card?.backColor) return card.backColor;
  if (deckCount === 2) return index % 2 === 0 ? "blue" : "red";
  return "blue";
}

function computeFitOverlap(
  cardWidth: number,
  count: number,
  maxWidth: number,
  baseOverlap: number
): number {
  if (count <= 1) return 0;

  const minVisibleStep = 10;
  const maxAllowedOverlap = cardWidth - minVisibleStep;
  const requiredOverlap = (count * cardWidth - maxWidth) / (count - 1);

  return Math.min(maxAllowedOverlap, Math.max(baseOverlap, requiredOverlap));
}

function computeClassicSpread(count: number, maxSpread: number): number {
  if (count <= 1) return 0;
  if (count === 2) return Math.min(maxSpread * 0.5, 26);
  return Math.min(maxSpread, 8 + count * (maxSpread / Math.max(count, 5)));
}

/** Symmetric hand fan — pivot bottom center (reference photo). */
function computePhotoFanAngles(count: number, spreadDeg: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [0];
  const half = spreadDeg / 2;
  return Array.from({ length: count }, (_, i) => -half + (i / (count - 1)) * spreadDeg);
}

function computePhotoFanOffset(index: number, count: number, cardWidth: number, spacing = 0.16): number {
  if (count <= 1) return 0;
  const center = (count - 1) / 2;
  return (index - center) * cardWidth * spacing;
}

function estimateClassicWidth(cardWidth: number, cardHeight: number, spreadDeg: number, count = 1): number {
  const rad = (spreadDeg / 2) * (Math.PI / 180);
  return cardWidth + 2 * Math.sin(rad) * cardHeight + Math.max(0, count - 1) * cardWidth * 0.16 + 8;
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
  fanStyle?: "classic" | "overlap";
  seatPosition?: SeatPosition;
  seatAnchor?: { x: number; y: number };
  showCountBadge?: boolean;
  maxVisible?: number;
  fitAll?: boolean;
  animateDeal?: boolean;
  dealKey?: string | number;
  highlightRank?: Rank;
  className?: string;
  deckCount?: 1 | 2;
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
  fanStyle,
  seatPosition,
  seatAnchor,
  showCountBadge = false,
  maxVisible,
  fitAll = false,
  animateDeal = false,
  dealKey,
  highlightRank,
  className = "",
  deckCount = 1,
}: CardFanProps) {
  const total = count ?? cards.length;
  const displayTotal = maxVisible ? Math.min(total, maxVisible) : total;
  const [visibleCount, setVisibleCount] = useState(animateDeal ? 0 : displayTotal);
  const fanWrapRef = useRef<HTMLDivElement>(null);
  const [fanWidth, setFanWidth] = useState<number | null>(null);

  const useClassic =
    fanStyle === "classic" ||
    (fanStyle !== "overlap" &&
      ((tilt === "table" && displayTotal >= 2) || (tilt === "hand" && displayTotal >= 2)));

  const seatLayout = seatAnchor
    ? getSeatLayoutFromAnchor(seatAnchor.x, seatAnchor.y)
    : seatPosition
      ? getSeatCardLayout(seatPosition)
      : null;

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
  }, [fitAll, displayTotal, useClassic]);

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

  const cardWidth = CARD_DIMENSIONS[size].width;
  const cardHeight = CARD_DIMENSIONS[size].height;

  const classicSpread = useMemo(() => {
    const baseMax = seatLayout?.maxSpreadDeg ?? (tilt === "table" ? 36 : 52);
    let spreadDeg = computeClassicSpread(displayTotal, baseMax);
    if (fitAll && fanWidth) {
      const estimated = estimateClassicWidth(cardWidth, cardHeight, spreadDeg, displayTotal);
      if (estimated > fanWidth) {
        spreadDeg *= (fanWidth / estimated) * 0.94;
      }
    }
    return spreadDeg;
  }, [seatLayout, tilt, displayTotal, fitAll, fanWidth, cardWidth, cardHeight]);

  if (total === 0) return null;

  const baseOverlap =
    spread === "tight" ? (size === "xs" ? 18 : 24) : spread === "wide" ? 36 : size === "xl" ? 40 : 28;
  const overlap =
    fitAll && fanWidth
      ? computeFitOverlap(cardWidth, displayTotal, fanWidth, baseOverlap)
      : baseOverlap;
  const step = displayTotal <= 1 ? cardWidth : cardWidth - overlap;
  const estimatedWidth =
    displayTotal <= 1 ? cardWidth : cardWidth + (displayTotal - 1) * step;
  const fitScale =
    !useClassic && fitAll && fanWidth && estimatedWidth > fanWidth
      ? (fanWidth / estimatedWidth) * 0.96
      : 1;
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
            ? useClassic
              ? "5rem"
              : "4.5rem"
            : "7rem";

  const pivotX = seatLayout?.pivotX ?? "50%";
  const pivotY = seatLayout?.pivotY ?? "100%";
  const tiltX = tilt === "flat" ? 0 : seatLayout?.tiltX ?? (tilt === "table" ? 40 : 14);

  // Fit the spacing, never shrink individual cards as the hand grows.
  const availableWidth = fitAll && fanWidth ? fanWidth : Infinity;
  const fittedSpread = Math.min(classicSpread, 2 * Math.asin(Math.min(1, Math.max(0, availableWidth - cardWidth - 8) / (2 * cardHeight))) * 180 / Math.PI);
  const rotatedWidth = cardWidth + 2 * Math.sin(fittedSpread * Math.PI / 360) * cardHeight + 8;
  const fittedSpacing = displayTotal > 1 ? Math.min(0.16, Math.max(0, availableWidth - rotatedWidth) / ((displayTotal - 1) * cardWidth)) : 0;
  const fittedAngles = computePhotoFanAngles(displayTotal, fittedSpread);
  const classicContainerWidth = rotatedWidth + Math.max(0, displayTotal - 1) * cardWidth * fittedSpacing;

  return (
    <div ref={fanWrapRef} className={`relative flex w-full flex-col items-center ${className}`}>
      {showCountBadge && isBack ? (
        <div className="count-badge mb-1">{total}</div>
      ) : null}

      {useClassic ? (
        <div
          className="card-fan-classic-wrap flex items-end justify-center"
          style={{
            minHeight: `${cardHeight + 12}px`,
            transform: `rotate(${seatLayout?.containerRotate ?? 0}deg)`,
            transformOrigin: "center center",
          }}
        >
          <div
            className="card-fan-classic relative"
            style={{
              width: `${classicContainerWidth}px`,
              height: `${cardHeight + 12}px`,

            }}
          >
            {items.slice(0, renderCount).map((item, i) => {
              const cardObj = isBack ? undefined : (item as { card: CardType }).card;
              const backColor = resolveBackColor(i, deckCount, cardObj);

              return (
              <div
                key={isBack ? `wrap-${i}` : `wrap-${(item as { index: number }).index}`}
                className="absolute bottom-0 left-1/2"
                style={{
                  transform: `translateX(calc(-50% + ${computePhotoFanOffset(i, displayTotal, cardWidth, fittedSpacing)}px)) rotate(${fittedAngles[i] ?? 0}deg)`,
                  transformOrigin: `${pivotX} ${pivotY}`,
                  zIndex: i + 1,
                  animationDelay: animateDeal ? `${i * 0.07}s` : undefined,
                  ["--card-tilt-x" as string]: `${tiltX}deg`,
                }}
              >
                <PlayingCard
                  key={isBack ? `back-${i}` : `card-${(item as { index: number }).index}`}
                  card={cardObj}
                  hidden={hidden && !blind && !faceDown}
                  blind={blind}
                  faceDown={faceDown}
                  backColor={backColor}
                  size={size}
                  className={animateDeal ? "card-deal-in" : undefined}
                  tilt={tilt}
                  highlightRank={highlightRank}
                />
              </div>
            );
            })}
          </div>
        </div>
      ) : (
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
            const cardObj = isBack ? undefined : (item as { card: CardType }).card;
            const backColor = resolveBackColor(i, deckCount, cardObj);

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
                  card={cardObj}
                  hidden={hidden && !blind && !faceDown}
                  blind={blind}
                  faceDown={faceDown}
                  backColor={backColor}
                  size={size}
                  className={animateDeal ? "card-deal-in" : undefined}
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
      )}
    </div>
  );
}

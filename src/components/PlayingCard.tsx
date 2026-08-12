"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { cardMatchesBid } from "@/lib/gameLogic";
import { CARD_BACK_IMAGE, getCardFaceImage } from "@/lib/cardAssets";
import { Card, Rank, SUIT_SYMBOLS } from "@/lib/types";

export type CardSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<CardSize, string> = {
  xs: "h-[3.35rem] w-[2.35rem]",
  sm: "h-[4.1rem] w-[2.9rem]",
  md: "h-[5rem] w-[3.55rem]",
  lg: "h-[5.85rem] w-[4.15rem]",
  xl: "h-[6.5rem] w-[4.6rem] sm:h-[7.1rem] sm:w-[5rem]",
};

type PlayingCardProps = {
  card?: Card;
  hidden?: boolean;
  blind?: boolean;
  size?: CardSize;
  faceDown?: boolean;
  tilt?: "hand" | "table" | "flat";
  highlight?: boolean;
  highlightRank?: Rank;
  className?: string;
  style?: CSSProperties;
};

const TILT_CLASS = {
  hand: "card-tilt-hand",
  table: "card-tilt-table",
  flat: "card-tilt-flat",
};

function CardImage({
  src,
  alt,
  size,
  blindOverlay,
  suitBadge,
}: {
  src: string;
  alt: string;
  size: CardSize;
  blindOverlay?: boolean;
  suitBadge?: string;
}) {
  return (
    <div className={`card-body card-body-themed ${SIZE_CLASSES[size]}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width:640px) 80px, 120px"
        className="card-themed-img object-cover"
        draggable={false}
        unoptimized
      />
      {suitBadge ? (
        <span className="card-suit-badge absolute left-0.5 top-0.5 rounded bg-black/55 px-0.5 text-[8px] font-bold text-white">
          {suitBadge}
        </span>
      ) : null}
      {blindOverlay ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45">
          <span className="text-xl font-light text-white">?</span>
        </div>
      ) : null}
    </div>
  );
}

export function PlayingCard({
  card,
  hidden,
  blind,
  size = "md",
  faceDown,
  tilt = "hand",
  highlight = false,
  highlightRank,
  className = "",
  style,
}: PlayingCardProps) {
  const showBack = hidden || blind || faceDown || !card;
  const isHighlighted =
    highlight || Boolean(card && highlightRank && cardMatchesBid(card, highlightRank));

  const suitBadge =
    card && card.suit !== "S" ? SUIT_SYMBOLS[card.suit] : undefined;

  return (
    <div
      className={`card-scene ${isHighlighted ? "card-bid-highlight" : ""} ${className}`}
      style={style}
    >
      <div className={TILT_CLASS[tilt]}>
        {showBack ? (
          <CardImage
            src={CARD_BACK_IMAGE}
            alt="Card back"
            size={size}
            blindOverlay={blind}
          />
        ) : card ? (
          <CardImage
            src={getCardFaceImage(card.rank)}
            alt={`${card.rank} of spades`}
            size={size}
            suitBadge={suitBadge}
          />
        ) : null}
      </div>
    </div>
  );
}

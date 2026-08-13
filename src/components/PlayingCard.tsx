"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { cardMatchesBid } from "@/lib/gameLogic";
import { getCardBackImage, getCardFaceImage } from "@/lib/cardAssets";
import { Card, CardBackColor, Rank } from "@/lib/types";

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
  backColor?: CardBackColor;
  tilt?: "hand" | "table" | "flat";
  highlight?: boolean;
  highlightRank?: Rank;
  className?: string;
  style?: CSSProperties;
};

function CardImage({
  src,
  alt,
  size,
  blindOverlay,
}: {
  src: string;
  alt: string;
  size: CardSize;
  blindOverlay?: boolean;
}) {
  return (
    <div className={`card-body card-body-flat ${SIZE_CLASSES[size]}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width:640px) 80px, 120px"
        className="card-flat-img object-contain"
        draggable={false}
        unoptimized
      />
      {blindOverlay ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/35">
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
  backColor,
  highlight = false,
  highlightRank,
  className = "",
  style,
}: PlayingCardProps) {
  const showBack = hidden || blind || faceDown || !card;
  const resolvedBack = backColor ?? card?.backColor ?? "blue";
  const isHighlighted =
    highlight || Boolean(card && highlightRank && cardMatchesBid(card, highlightRank));

  return (
    <div
      className={`card-scene card-scene-flat ${isHighlighted ? "card-bid-highlight" : ""} ${className}`}
      style={style}
    >
      {showBack ? (
        <CardImage
          src={getCardBackImage(resolvedBack)}
          alt="Card back"
          size={size}
          blindOverlay={blind}
        />
      ) : card ? (
        <CardImage
          src={getCardFaceImage(card.rank, card.suit)}
          alt={`${card.rank} ${card.suit}`}
          size={size}
        />
      ) : null}
    </div>
  );
}

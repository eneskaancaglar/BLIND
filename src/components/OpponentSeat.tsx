"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getHandDisplayCount } from "@/lib/gameLogic";
import { getSeatOutwardVector, type OpponentSeatLayout } from "@/lib/seatLayout";
import { BlindMode, ChatMessage, Player, Rank } from "@/lib/types";
import type { SeatPosition } from "@/lib/seatLayout";
import { getRecentReaction } from "./EmojiChat";
import { CardFan } from "./CardFan";
import { PlayerAvatar } from "./PlayerAvatar";

type OpponentSeatProps = {
  player: Player;
  layout: OpponentSeatLayout;
  seatPosition: SeatPosition;
  isTurn: boolean;
  showCards: boolean;
  deckCount?: 1 | 2;
  blindMode?: BlindMode;
  highlightRank?: Rank;
  compact?: boolean;
  animateDeal?: boolean;
  dealKey?: string | number;
  messages?: ChatMessage[];
};

export function OpponentSeat({
  player,
  layout,
  seatPosition,
  isTurn,
  showCards,
  deckCount = 1,
  blindMode = "ORIGINAL_BLIND",
  highlightRank,
  compact = false,
  animateDeal,
  dealKey,
  messages = [],
}: OpponentSeatProps) {
  const { translate } = useLanguage();
  const [namePinned, setNamePinned] = useState(false);
  const showName = isTurn || namePinned;

  const displayCount =
    showCards && player.cards.length > 0
      ? player.cards.length
      : getHandDisplayCount(player, blindMode);
  const blindStatusText =
    blindMode === "HIDDEN_CARDS_BLIND"
      ? translate("blindHiddenCards")
      : translate("blindNoCards");
  const reaction = getRecentReaction(messages, player.id);

  const outward = getSeatOutwardVector(layout.avatar.x, layout.avatar.y);

  const fanProps = {
    size: compact ? ("xs" as const) : ("sm" as const),
    spread: "tight" as const,
    tilt: "flat" as const,
    fanStyle: "classic" as const,
    seatPosition,
    seatAnchor: layout.cards,
    fitAll: true,
    deckCount,
    animateDeal,
    dealKey,
  };

  if (player.isEliminated) {
    return (
      <div
        className="seat-avatar-on-table opponent-seat-eliminated opacity-40"
        style={{ left: `${layout.avatar.x}%`, top: `${layout.avatar.y}%` }}
      >
        <PlayerAvatar player={player} size="md" />
        {showName ? <p className="seat-name-tag seat-name-tag-static mt-1">{player.name}</p> : null}
        <span className="mt-0.5 block text-center text-[9px] text-slate-400">{translate("eliminated")}</span>
      </div>
    );
  }

  return (
    <>
      {reaction ? (
        <span
          key={reaction.id}
          className="seat-emoji-on-table text-base"
          style={{ left: `${layout.avatar.x}%`, top: `${layout.avatar.y}%` }}
          aria-hidden
        >
          {reaction.emoji}
        </span>
      ) : null}

      {showName ? (
        <p
          className="seat-name-on-table seat-name-tag"
          style={{
            left: `${layout.avatar.x}%`,
            top: `${layout.avatar.y}%`,
            transform: `translate(calc(-50% + ${outward.x * 10}px), calc(-50% + ${outward.y * 18}px))`,
          }}
          title={player.name}
        >
          {player.name}
        </p>
      ) : null}

      <div
        className={`seat-avatar-on-table ${isTurn ? "opponent-seat-turn" : ""}`}
        style={{ left: `${layout.avatar.x}%`, top: `${layout.avatar.y}%` }}
      >
        <PlayerAvatar
          player={player}
          size={compact ? "md" : "lg"}
          isTurn={isTurn}
          onClick={() => setNamePinned((prev) => !prev)}
          title={player.name}
        />
        {displayCount > 0 ? (
          <span className="seat-card-count" aria-label={`${displayCount} cards`}>
            {displayCount}
          </span>
        ) : null}
      </div>

      <div
        className={`seat-cards-on-table ${compact ? "seat-cards-on-table-compact" : ""}`}
        style={{ left: `${layout.cards.x}%`, top: `${layout.cards.y}%` }}
      >
        {showCards && player.cards.length > 0 ? (
          <CardFan cards={player.cards} highlightRank={highlightRank} {...fanProps} />
        ) : showCards && player.isBlind ? (
          <span className="block text-center text-[8px] text-slate-300">{blindStatusText}</span>
        ) : player.isBlind && displayCount > 0 ? (
          <CardFan count={displayCount} faceDown {...fanProps} />
        ) : player.isBlind ? (
          <span className="block text-center text-[8px] text-slate-300">{blindStatusText}</span>
        ) : displayCount > 0 ? (
          <CardFan count={displayCount} faceDown {...fanProps} />
        ) : null}

        {player.isBlind && !showCards ? (
          <span className="mt-0.5 block text-center text-[8px] font-semibold uppercase tracking-wide text-amber-100/70">
            {translate("blind")}
          </span>
        ) : null}
      </div>
    </>
  );
}

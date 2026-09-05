"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getHandDisplayCount } from "@/lib/gameLogic";
import { getOpponentVisualCardCount, type OpponentSeatLayout } from "@/lib/seatLayout";
import { BlindMode, ChatMessage, Player, Rank } from "@/lib/types";
import type { SeatPosition } from "@/lib/seatLayout";
import { getRecentReaction } from "./EmojiChat";
import { CardFan } from "./CardFan";
import { PlayerAvatar } from "./PlayerAvatar";

type OpponentSeatProps = {
  player: Player;
  layout: OpponentSeatLayout;
  seatPosition: SeatPosition;
  layer?: "all" | "avatar" | "cards";
  isTurn: boolean;
  revealCards: boolean;
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
  layer = "all",
  isTurn,
  revealCards,
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
    revealCards && player.cards.length > 0
      ? player.cards.length
      : getHandDisplayCount(player, blindMode);
  const visualCount = revealCards ? displayCount : getOpponentVisualCardCount(displayCount);
  const blindStatusText =
    blindMode === "HIDDEN_CARDS_BLIND"
      ? translate("blindHiddenCards")
      : translate("blindNoCards");
  const reaction = getRecentReaction(messages, player.id);

  const showAvatarLayer = layer === "all" || layer === "avatar";
  const showCardLayer = layer === "all" || layer === "cards";

  const fanProps = {
    size: compact ? ("xs" as const) : ("sm" as const),
    spread: "tight" as const,
    tilt: "flat" as const,
    fanStyle: "classic" as const,
    seatPosition,
    fitAll: true,
    deckCount,
    animateDeal,
    dealKey,
    maxVisible: undefined,
  };

  if (player.isEliminated) {
    if (!showAvatarLayer) return null;
    return (
      <div
        className="seat-avatar-on-table opponent-seat-eliminated opacity-40"
        style={{
          left: `${layout.avatar.x}%`,
          top: `${layout.avatar.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <PlayerAvatar player={player} size={compact ? "md" : "lg"} />
        {showName ? <p className="seat-name-tag seat-name-tag-static mt-1">{player.name}</p> : null}
        <span className="mt-0.5 block text-center text-[9px] text-slate-400">{translate("eliminated")}</span>
      </div>
    );
  }

  return (
    <>
      {showAvatarLayer && reaction ? (
        <span
          key={reaction.id}
          className="seat-emoji-on-table text-base"
          style={{ left: `${layout.avatar.x}%`, top: `${layout.avatar.y}%` }}
          aria-hidden
        >
          {reaction.emoji}
        </span>
      ) : null}

      {showAvatarLayer && showName ? (
        <p
          className="seat-name-on-table seat-name-tag"
          style={{
            left: `${layout.avatar.x}%`,
            top: `${layout.avatar.y}%`,
            transform: `translate(-50%, calc(-50% + 38px))`,
          }}
          title={player.name}
        >
          {player.name}
        </p>
      ) : null}

      {showAvatarLayer ? (
      <div
        className={`seat-avatar-on-table ${isTurn ? "opponent-seat-turn" : ""}`}
        style={{
          left: `${layout.avatar.x}%`,
          top: `${layout.avatar.y}%`,
          transform: "translate(-50%, -50%)",
        }}
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
      ) : null}

      {showCardLayer ? (
      <div
        className={`seat-cards-on-table ${compact ? "seat-cards-on-table-compact" : ""}`}
        style={{ left: `${layout.cards.x}%`, top: `${layout.cards.y}%` }}
      >
        {revealCards && player.cards.length > 0 ? (
          <CardFan cards={player.cards} highlightRank={highlightRank} {...fanProps} />
        ) : revealCards && player.isBlind ? (
          <span className="block text-center text-[8px] text-slate-300">{blindStatusText}</span>
        ) : player.isBlind && visualCount > 0 ? (
          <CardFan count={visualCount} faceDown {...fanProps} />
        ) : player.isBlind ? (
          <span className="block text-center text-[8px] text-slate-300">{blindStatusText}</span>
        ) : visualCount > 0 ? (
          <CardFan count={visualCount} faceDown {...fanProps} />
        ) : null}

        {player.isBlind && !revealCards ? (
          <span className="mt-0.5 block text-center text-[8px] font-semibold uppercase tracking-wide text-amber-100/70">
            {translate("blind")}
          </span>
        ) : null}
      </div>
      ) : null}
    </>
  );
}

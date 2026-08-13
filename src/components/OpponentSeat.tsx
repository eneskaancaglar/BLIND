"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getHandDisplayCount } from "@/lib/gameLogic";
import { BlindMode, ChatMessage, Player, Rank } from "@/lib/types";
import type { SeatPosition } from "@/lib/seatLayout";
import { getRecentReaction } from "./EmojiChat";
import { CardFan } from "./CardFan";
import { PlayerAvatar } from "./PlayerAvatar";

type OpponentSeatProps = {
  player: Player;
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
  };

  if (player.isEliminated) {
    return (
      <div className="opponent-seat opponent-seat-eliminated flex flex-col items-center opacity-40">
        <PlayerAvatar player={player} size="md" />
        {showName ? <p className="seat-name-tag seat-name-tag-static mt-1">{player.name}</p> : null}
        <span className="mt-0.5 text-[9px] text-slate-400">{translate("eliminated")}</span>
      </div>
    );
  }

  return (
    <div
      className={`opponent-seat relative flex w-full min-w-0 flex-col items-center ${
        compact ? "opponent-seat-compact" : ""
      } ${isTurn ? "opponent-seat-turn" : ""}`}
    >
      {reaction ? (
        <span key={reaction.id} className="seat-emoji-bubble absolute -top-2 z-40 text-base" aria-hidden>
          {reaction.emoji}
        </span>
      ) : null}

      {showName ? (
        <p className="seat-name-tag" title={player.name}>
          {player.name}
        </p>
      ) : null}

      <div className="seat-avatar-row relative z-20 shrink-0">
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

      {player.isBlind && !showCards ? (
        <span className="relative z-10 mt-0.5 text-center text-[8px] font-semibold uppercase tracking-wide text-emerald-100/70">
          {translate("blind")}
        </span>
      ) : null}

      <div className="opponent-seat-cards relative z-30 mt-2 w-full">
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
      </div>
    </div>
  );
}

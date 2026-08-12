"use client";

import { useLanguage } from "@/context/LanguageContext";
import { getHandDisplayCount } from "@/lib/gameLogic";
import { BlindMode, ChatMessage, Player, Rank } from "@/lib/types";
import type { SeatPosition } from "@/lib/seatLayout";
import { BotBadge } from "./BotBadge";
import { getRecentReaction } from "./EmojiChat";
import { CardFan } from "./CardFan";

type OpponentSeatProps = {
  player: Player;
  seatPosition: SeatPosition;
  isTurn: boolean;
  showCards: boolean;
  blindMode?: BlindMode;
  highlightRank?: Rank;
  compact?: boolean;
  animateDeal?: boolean;
  dealKey?: string | number;
  messages?: ChatMessage[];
};

function OpponentNameRow({ name, count }: { name: string; count: number; isBot?: boolean }) {
  return (
    <div className="opponent-name-row flex max-w-full items-center justify-center gap-0.5">
      <p className="opponent-name min-w-0">{name}</p>
      <span className="count-dot shrink-0" aria-label={`${count} cards`}>
        {count}
      </span>
    </div>
  );
}

export function OpponentSeat({
  player,
  seatPosition,
  isTurn,
  showCards,
  blindMode = "ORIGINAL_BLIND",
  highlightRank,
  compact = false,
  animateDeal,
  dealKey,
  messages = [],
}: OpponentSeatProps) {
  const { translate } = useLanguage();
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
    size: "xs" as const,
    spread: "tight" as const,
    tilt: "table" as const,
    fanStyle: "classic" as const,
    seatPosition,
    fitAll: true,
    animateDeal,
    dealKey,
  };

  if (player.isEliminated) {
    return (
      <div className="flex flex-col items-center opacity-40">
        <p className="opponent-name">{player.name}</p>
        <span className="mt-0.5 text-[9px] text-slate-400">{translate("eliminated")}</span>
      </div>
    );
  }

  return (
    <div
      className={`opponent-seat relative flex w-full min-w-0 flex-col items-center px-1 py-0.5 ${
        compact ? "opponent-seat-compact" : ""
      } ${isTurn ? "opponent-seat-turn" : ""}`}
    >
      {reaction ? (
        <span key={reaction.id} className="seat-emoji-bubble absolute -top-2.5 z-20 text-base" aria-hidden>
          {reaction.emoji}
        </span>
      ) : null}

      <div className="seat-avatar-wrap">
        <div className={`seat-avatar ${isTurn ? "seat-avatar-turn" : ""}`} aria-hidden>
          {player.name.charAt(0).toUpperCase()}
        </div>
        {player.isBot ? (
          <span className="seat-avatar-bot">
            <BotBadge size="sm" />
          </span>
        ) : null}
      </div>

      <div className="seat-info-pill mt-0.5 w-full max-w-full">
        <OpponentNameRow name={player.name} count={displayCount} isBot={player.isBot} />
      </div>

      {player.isBlind && !showCards ? (
        <span className="mt-0.5 text-center text-[7px] font-medium uppercase tracking-wide text-emerald-200/50">
          {translate("blind")}
        </span>
      ) : null}

      <div className="opponent-seat-cards mt-0.5 w-full">
        {showCards && player.cards.length > 0 ? (
          <CardFan cards={player.cards} highlightRank={highlightRank} {...fanProps} />
        ) : showCards && player.isBlind ? (
          <span className="block text-center text-[8px] text-slate-400">{blindStatusText}</span>
        ) : player.isBlind && displayCount > 0 ? (
          <CardFan count={displayCount} faceDown {...fanProps} />
        ) : player.isBlind ? (
          <span className="block text-center text-[8px] text-slate-400">{blindStatusText}</span>
        ) : displayCount > 0 ? (
          <CardFan count={displayCount} faceDown {...fanProps} />
        ) : null}
      </div>
    </div>
  );
}

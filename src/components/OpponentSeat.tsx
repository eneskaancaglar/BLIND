"use client";

import { useLanguage } from "@/context/LanguageContext";
import { getHandDisplayCount } from "@/lib/gameLogic";
import { BlindMode, ChatMessage, Player, Rank } from "@/lib/types";
import { getRecentReaction } from "./EmojiChat";
import { CardFan } from "./CardFan";

type OpponentSeatProps = {
  player: Player;
  isTurn: boolean;
  showCards: boolean;
  blindMode?: BlindMode;
  highlightRank?: Rank;
  compact?: boolean;
  animateDeal?: boolean;
  dealKey?: string | number;
  messages?: ChatMessage[];
};

function OpponentNameRow({
  name,
  count,
  showCount,
}: {
  name: string;
  count: number;
  showCount: boolean;
}) {
  return (
    <div className="opponent-name-row flex max-w-full items-center justify-center gap-1">
      <p className="opponent-name min-w-0">{name}</p>
      {showCount ? (
        <span className="count-dot" aria-label={`${count} cards`}>
          {count}
        </span>
      ) : null}
    </div>
  );
}

export function OpponentSeat({
  player,
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
  const displayCount = showCards && player.cards.length > 0
    ? player.cards.length
    : getHandDisplayCount(player, blindMode);
  const blindStatusText =
    blindMode === "HIDDEN_CARDS_BLIND"
      ? translate("blindHiddenCards")
      : translate("blindNoCards");
  const reaction = getRecentReaction(messages, player.id);
  const showCountBadge = !player.isEliminated && (displayCount > 0 || (player.isBlind && showCards));

  const fanProps = {
    size: "xs" as const,
    spread: "tight" as const,
    tilt: "table" as const,
    fitAll: true,
    animateDeal,
    dealKey,
  };

  if (player.isEliminated) {
    return (
      <div className="flex flex-col items-center opacity-40">
        <OpponentNameRow name={player.name} count={0} showCount={false} />
        <span className="mt-0.5 text-[9px] text-slate-400">{translate("eliminated")}</span>
      </div>
    );
  }

  return (
    <div
      className={`opponent-seat relative flex w-full min-w-0 flex-col items-center px-1 py-1 ${
        compact ? "py-0.5" : ""
      } ${isTurn ? "opponent-seat-turn" : ""}`}
    >
      {reaction ? (
        <span key={reaction.id} className="seat-emoji-bubble absolute -top-3 z-20 text-base" aria-hidden>
          {reaction.emoji}
        </span>
      ) : null}

      <OpponentNameRow name={player.name} count={displayCount} showCount={showCountBadge} />

      {player.isBlind && !showCards ? (
        <span className="mt-0.5 text-[8px] text-slate-400">{translate("blind")}</span>
      ) : null}

      {showCards && player.cards.length > 0 ? (
        <CardFan
          cards={player.cards}
          highlightRank={highlightRank}
          {...fanProps}
        />
      ) : showCards && player.isBlind ? (
        <span className="mt-0.5 text-[8px] text-slate-400">{blindStatusText}</span>
      ) : player.isBlind && displayCount > 0 ? (
        <CardFan count={displayCount} faceDown {...fanProps} />
      ) : player.isBlind ? (
        <span className="mt-0.5 text-[8px] text-slate-400">{blindStatusText}</span>
      ) : displayCount > 0 ? (
        <CardFan count={displayCount} faceDown {...fanProps} />
      ) : null}
    </div>
  );
}

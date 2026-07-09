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
  animateDeal?: boolean;
  dealKey?: string | number;
  messages?: ChatMessage[];
};

export function OpponentSeat({
  player,
  isTurn,
  showCards,
  blindMode = "ORIGINAL_BLIND",
  highlightRank,
  animateDeal,
  dealKey,
  messages = [],
}: OpponentSeatProps) {
  const { translate } = useLanguage();
  const displayCount = getHandDisplayCount(player, blindMode);
  const blindStatusText =
    blindMode === "HIDDEN_CARDS_BLIND"
      ? translate("blindHiddenCards")
      : translate("blindNoCards");
  const reaction = getRecentReaction(messages, player.id);

  if (player.isEliminated) {
    return (
      <div className="flex flex-col items-center opacity-40">
        <p className="mb-1 max-w-[9rem] truncate text-center text-[11px] font-medium text-slate-300">
          {player.name}
        </p>
        <span className="game-chip px-2 py-0.5 text-[10px]">
          {translate("eliminated")}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`opponent-seat relative flex w-full flex-col items-center px-1 py-2 transition sm:px-2 sm:py-3 ${
        isTurn ? "opponent-seat-turn" : ""
      }`}
    >
      {reaction ? (
        <span
          key={reaction.id}
          className="seat-emoji-bubble absolute -top-5 z-20 text-xl"
          aria-hidden
        >
          {reaction.emoji}
        </span>
      ) : null}

      <p className="mb-1.5 max-w-full truncate text-center text-[11px] font-semibold leading-tight text-slate-100 sm:text-xs">
        {player.name}
      </p>

      {player.isBlind && !showCards ? (
        <span className="game-chip mb-1.5 px-1.5 py-0.5 text-[9px] font-semibold">
          {translate("blind")}
        </span>
      ) : null}

      {showCards && player.cards.length > 0 ? (
        <CardFan
          cards={player.cards}
          size="sm"
          spread="tight"
          tilt="table"
          highlightRank={highlightRank}
        />
      ) : showCards && player.isBlind ? (
        <span className="text-[10px] font-medium text-slate-400">{blindStatusText}</span>
      ) : player.isBlind && displayCount > 0 ? (
        <CardFan
          count={displayCount}
          faceDown
          size="sm"
          spread="tight"
          tilt="table"
          showCountBadge
          animateDeal={animateDeal}
          dealKey={dealKey}
        />
      ) : player.isBlind ? (
        <span className="text-[10px] font-medium text-slate-400">{blindStatusText}</span>
      ) : (
        <CardFan
          count={displayCount}
          faceDown
          size="sm"
          spread="tight"
          tilt="table"
          showCountBadge
          animateDeal={animateDeal}
          dealKey={dealKey}
        />
      )}
    </div>
  );
}

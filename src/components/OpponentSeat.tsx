"use client";

import { useLanguage } from "@/context/LanguageContext";
import { getHandDisplayCount } from "@/lib/gameLogic";
import { ChatMessage, Player } from "@/lib/types";
import { getRecentReaction } from "./EmojiChat";
import { CardFan } from "./CardFan";

type OpponentSeatProps = {
  player: Player;
  isTurn: boolean;
  showCards: boolean;
  blindGetsCards?: boolean;
  animateDeal?: boolean;
  dealKey?: string | number;
  messages?: ChatMessage[];
};

export function OpponentSeat({
  player,
  isTurn,
  showCards,
  blindGetsCards = false,
  animateDeal,
  dealKey,
  messages = [],
}: OpponentSeatProps) {
  const { translate } = useLanguage();
  const displayCount = getHandDisplayCount(player, blindGetsCards);
  const reaction = getRecentReaction(messages, player.id);

  if (player.isEliminated) {
    return (
      <div className="flex flex-col items-center opacity-40">
        <p className="mb-1 max-w-[6rem] truncate text-xs font-medium text-slate-400">
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
      className={`opponent-seat relative flex min-w-[6.5rem] flex-col items-center px-3 py-3 transition ${
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

      <div className="mb-2 flex flex-wrap items-center justify-center gap-1">
        <span className="max-w-[5.5rem] truncate text-xs font-semibold text-slate-100">
          {player.name}
        </span>
        {player.isBlind && !showCards ? (
          <span className="game-chip px-1.5 py-0.5 text-[9px] font-semibold">
            {translate("blind")}
          </span>
        ) : null}
      </div>

      {showCards && player.cards.length > 0 ? (
        <CardFan cards={player.cards} size="sm" spread="tight" tilt="table" />
      ) : showCards && player.isBlind ? (
        <span className="text-[10px] font-medium text-slate-400">{translate("blindNoCards")}</span>
      ) : player.isBlind && displayCount > 0 ? (
        <CardFan
          count={displayCount}
          blind
          size="sm"
          spread="tight"
          tilt="table"
          showCountBadge
          animateDeal={animateDeal}
          dealKey={dealKey}
        />
      ) : player.isBlind ? (
        <span className="text-[10px] font-medium text-slate-400">{translate("blindNoCards")}</span>
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

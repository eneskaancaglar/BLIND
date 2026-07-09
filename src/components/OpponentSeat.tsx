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
        <p className="opponent-name">{player.name}</p>
        <span className="mt-0.5 text-[9px] text-slate-400">{translate("eliminated")}</span>
      </div>
    );
  }

  return (
    <div
      className={`opponent-seat relative flex w-full max-w-[5.5rem] flex-col items-center px-0.5 py-1 ${
        isTurn ? "opponent-seat-turn" : ""
      }`}
    >
      {reaction ? (
        <span key={reaction.id} className="seat-emoji-bubble absolute -top-4 z-20 text-lg" aria-hidden>
          {reaction.emoji}
        </span>
      ) : null}

      <p className="opponent-name">{player.name}</p>

      {player.isBlind && !showCards ? (
        <span className="mt-0.5 text-[9px] text-slate-400">{translate("blind")}</span>
      ) : null}

      {showCards && player.cards.length > 0 ? (
        <CardFan
          cards={player.cards}
          size="xs"
          spread="tight"
          tilt="table"
          highlightRank={highlightRank}
        />
      ) : showCards && player.isBlind ? (
        <span className="mt-0.5 text-[9px] text-slate-400">{blindStatusText}</span>
      ) : player.isBlind && displayCount > 0 ? (
        <CardFan
          count={displayCount}
          faceDown
          size="xs"
          spread="tight"
          tilt="table"
          animateDeal={animateDeal}
          dealKey={dealKey}
        />
      ) : player.isBlind ? (
        <span className="mt-0.5 text-[9px] text-slate-400">{blindStatusText}</span>
      ) : displayCount > 0 ? (
        <CardFan
          count={displayCount}
          faceDown
          size="xs"
          spread="tight"
          tilt="table"
          animateDeal={animateDeal}
          dealKey={dealKey}
        />
      ) : null}
    </div>
  );
}

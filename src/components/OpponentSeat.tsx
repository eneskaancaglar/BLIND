"use client";

import { useLanguage } from "@/context/LanguageContext";
import { getHandDisplayCount } from "@/lib/gameLogic";
import { Player } from "@/lib/types";
import { CardFan } from "./CardFan";

type OpponentSeatProps = {
  player: Player;
  isTurn: boolean;
  showCards: boolean;
  blindGetsCards?: boolean;
  animateDeal?: boolean;
  dealKey?: string | number;
};

export function OpponentSeat({
  player,
  isTurn,
  showCards,
  blindGetsCards = false,
  animateDeal,
  dealKey,
}: OpponentSeatProps) {
  const { translate } = useLanguage();
  const displayCount = getHandDisplayCount(player, blindGetsCards);

  if (player.isEliminated) {
    return (
      <div className="flex flex-col items-center opacity-40">
        <p className="mb-1 max-w-[6rem] truncate text-xs font-semibold text-white/60">
          {player.name}
        </p>
        <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-white/40">
          {translate("eliminated")}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex min-w-[6.5rem] flex-col items-center rounded-2xl px-3 py-3 transition ${
        isTurn
          ? "bg-amber-400/20 ring-2 ring-amber-300 shadow-lg shadow-amber-500/20"
          : "bg-black/25 backdrop-blur-sm"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-center gap-1">
        <span className="max-w-[5.5rem] truncate text-xs font-bold text-white">
          {player.name}
        </span>
        {player.isBlind && !showCards ? (
          <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-amber-950">
            {translate("blind")}
          </span>
        ) : null}
      </div>

      {showCards && player.cards.length > 0 ? (
        <CardFan cards={player.cards} size="sm" spread="tight" tilt="table" />
      ) : showCards && player.isBlind ? (
        <span className="text-[10px] font-semibold text-amber-200">{translate("blindNoCards")}</span>
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
        <span className="text-[10px] font-semibold text-amber-200">{translate("blindNoCards")}</span>
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

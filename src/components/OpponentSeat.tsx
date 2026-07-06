"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { SeatPosition } from "@/lib/seatLayout";
import { getHandOrientation } from "@/lib/seatLayout";
import { Player } from "@/lib/types";
import { HandHeldCards } from "./HandHeldCards";

type OpponentSeatProps = {
  player: Player;
  isTurn: boolean;
  showCards: boolean;
  seatPosition: SeatPosition;
  animateDeal?: boolean;
  dealKey?: string | number;
};

export function OpponentSeat({
  player,
  isTurn,
  showCards,
  seatPosition,
  animateDeal,
  dealKey,
}: OpponentSeatProps) {
  const { translate } = useLanguage();
  const orientation = getHandOrientation(seatPosition);

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
      className={`opponent-seat flex flex-col items-center rounded-2xl px-2 py-2 transition ${
        isTurn
          ? "bg-amber-400/20 ring-2 ring-amber-300 shadow-lg shadow-amber-500/20"
          : ""
      }`}
    >
      <div className="mb-1 flex flex-wrap items-center justify-center gap-1">
        <span className="max-w-[5.5rem] truncate text-xs font-bold text-white">
          {player.name}
        </span>
        {player.isBlind && !showCards ? (
          <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-amber-950">
            {translate("blind")}
          </span>
        ) : null}
      </div>

      <HandHeldCards
        cards={player.cards}
        count={player.cardCount}
        blind={player.isBlind && !showCards}
        faceDown={!showCards}
        showCards={showCards}
        size="sm"
        orientation={orientation}
        animateDeal={animateDeal}
        dealKey={dealKey}
      />
    </div>
  );
}

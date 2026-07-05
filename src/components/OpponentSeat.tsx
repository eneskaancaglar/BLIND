import { Player } from "@/lib/types";
import { CardFan } from "./CardFan";

type OpponentSeatProps = {
  player: Player;
  isTurn: boolean;
  showCards: boolean;
};

export function OpponentSeat({ player, isTurn, showCards }: OpponentSeatProps) {
  if (player.isEliminated) {
    return (
      <div className="flex flex-col items-center opacity-40">
        <p className="mb-1 text-xs font-medium text-neutral-400">{player.name}</p>
        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-500">
          Elendi
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex min-w-[5.5rem] flex-col items-center rounded-2xl px-2 py-3 transition ${
        isTurn
          ? "bg-amber-400/15 ring-2 ring-amber-400/60"
          : "bg-black/20"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-center gap-1">
        <span className="max-w-[5rem] truncate text-xs font-semibold text-white">
          {player.name}
        </span>
        {player.isBlind && !showCards ? (
          <span className="rounded bg-amber-500/30 px-1 text-[9px] font-bold text-amber-200">
            BLIND
          </span>
        ) : null}
      </div>

      {showCards ? (
        <CardFan cards={player.cards} size="sm" spread="tight" />
      ) : player.isBlind ? (
        <CardFan count={player.cardCount} blind size="sm" spread="tight" />
      ) : (
        <CardFan count={player.cardCount} hidden size="sm" spread="tight" />
      )}

      {!showCards ? (
        <p className="mt-1 text-[10px] text-emerald-200/50">{player.cardCount} kart</p>
      ) : null}
    </div>
  );
}

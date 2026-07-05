import { Player } from "@/lib/types";
import { PlayingCard } from "./PlayingCard";

type PlayerListProps = {
  players: Player[];
  currentPlayerId?: string;
  hostId?: string;
  turnPlayerId?: string;
};

export function PlayerList({
  players,
  currentPlayerId,
  hostId,
  turnPlayerId,
}: PlayerListProps) {
  return (
    <ul className="space-y-3">
      {players.map((player) => {
        const isMe = player.id === currentPlayerId;
        const isTurn = player.id === turnPlayerId;

        return (
          <li
            key={player.id}
            className={`rounded-2xl border px-4 py-3 ${
              isTurn
                ? "border-green-500 bg-green-500/10"
                : "border-neutral-700 bg-neutral-900"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {player.name}
                  {isMe ? " (Sen)" : ""}
                </p>
                <p className="text-sm text-neutral-400">
                  {player.isEliminated
                    ? "Elendi"
                    : player.isBlind
                      ? "BLIND"
                      : `${player.cardCount} kart`}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                {player.isHost || player.id === hostId ? (
                  <span className="rounded-full bg-neutral-700 px-2 py-1 text-xs">Kurucu</span>
                ) : null}
                {player.isBlind ? (
                  <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-300">
                    BLIND
                  </span>
                ) : null}
                {player.isEliminated ? (
                  <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300">
                    Elendi
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

type PlayerCardsProps = {
  player: Player;
  isMe: boolean;
  showAll?: boolean;
};

export function PlayerCardsRow({ player, isMe, showAll }: PlayerCardsProps) {
  return (
    <div className="rounded-2xl border border-neutral-700 bg-neutral-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">
          {player.name}
          {isMe ? " (Sen)" : ""}
        </p>
        {!showAll && !player.isEliminated && (!isMe || player.isBlind) ? (
          <span className="text-sm text-neutral-400">{player.cardCount} kart</span>
        ) : null}
      </div>

      {player.isEliminated ? (
        <p className="text-sm text-neutral-500">Elendi</p>
      ) : showAll ? (
        <div className="flex flex-wrap gap-2">
          {player.cards.map((card, index) => (
            <PlayingCard key={`${player.id}-${index}`} card={card} size="sm" />
          ))}
        </div>
      ) : isMe && !player.isBlind ? (
        <div className="flex flex-wrap gap-2">
          {player.cards.map((card, index) => (
            <PlayingCard key={`${player.id}-${index}`} card={card} size="sm" />
          ))}
        </div>
      ) : isMe && player.isBlind ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: player.cardCount }).map((_, index) => (
            <PlayingCard key={`${player.id}-blind-${index}`} blind size="sm" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: player.cardCount }).map((_, index) => (
            <PlayingCard key={`${player.id}-hidden-${index}`} hidden size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}

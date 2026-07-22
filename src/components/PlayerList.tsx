"use client";

import { useLanguage } from "@/context/LanguageContext";
import { BotBadge } from "./BotBadge";
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
  const { translate } = useLanguage();

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
                ? "border-white/20 bg-white/10"
                : "border-white/10 bg-black/22"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-slate-100">
                  {player.isBot ? <BotBadge size="sm" /> : null}
                  <span>
                    {player.name}
                    {isMe ? ` (${translate("you")})` : ""}
                  </span>
                </p>
                <p className="text-sm text-slate-400">
                  {player.isEliminated
                    ? translate("eliminated")
                    : player.isBlind
                      ? translate("blind")
                      : `${player.cardCount} ${translate("cards")}`}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                {player.isHost || player.id === hostId ? (
                  <span className="home-chip rounded-full px-2 py-1 text-xs">
                    {translate("host")}
                  </span>
                ) : null}
                {player.isBot ? (
                  <span className="home-chip rounded-full px-2 py-1 text-xs text-violet-200">
                    {translate("botBadge")}
                  </span>
                ) : null}
                {player.isBlind ? (
                  <span className="home-chip rounded-full px-2 py-1 text-xs text-slate-200">
                    {translate("blind")}
                  </span>
                ) : null}
                {player.isEliminated ? (
                  <span className="rounded-full border border-red-400/25 bg-red-950/30 px-2 py-1 text-xs text-red-200/90">
                    {translate("eliminated")}
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
  const { translate } = useLanguage();

  return (
    <div className="rounded-2xl border border-neutral-700 bg-neutral-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">
          {player.name}
          {isMe ? ` (${translate("you")})` : ""}
        </p>
        {!showAll && !player.isEliminated && (!isMe || player.isBlind) ? (
          <span className="text-sm text-neutral-400">
            {player.cardCount} {translate("cards")}
          </span>
        ) : null}
      </div>

      {player.isEliminated ? (
        <p className="text-sm text-neutral-500">{translate("eliminated")}</p>
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

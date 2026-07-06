"use client";

import { useLanguage } from "@/context/LanguageContext";
import { getOpponentSeatPosition } from "@/lib/seatLayout";
import { Player, Room } from "@/lib/types";
import { CardFan } from "./CardFan";
import { OpponentSeat } from "./OpponentSeat";
import { SoundToggle } from "./SoundToggle";

type GameTableProps = {
  room: Room;
  roomCode: string;
  me: Player | undefined;
  opponents: Player[];
  playerId: string;
  turnPlayerId?: string;
  showAllCards: boolean;
  animateDeal?: boolean;
  dealKey?: string | number;
  children?: React.ReactNode;
};

export function GameTable({
  room,
  roomCode,
  me,
  opponents,
  playerId,
  turnPlayerId,
  showAllCards,
  animateDeal,
  dealKey,
  children,
}: GameTableProps) {
  const { translate } = useLanguage();

  const turnName =
    opponents.find((p) => p.id === turnPlayerId)?.name ??
    (turnPlayerId === playerId ? me?.name : undefined);

  const phaseLabel =
    room.status === "finished"
      ? translate("statusFinished")
      : room.phase === "revealed"
        ? translate("statusRevealed")
        : translate("statusBidding");

  return (
    <div className="game-shell flex min-h-[100dvh] flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-[10px] font-bold uppercase tracking-[0.3em] text-transparent">
            BLIND
          </p>
          <p className="text-sm font-semibold text-white/90">
            {translate("lobbyRoom")} {roomCode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SoundToggle compact />
          <div className="rounded-full bg-white/10 px-3 py-1 text-right text-xs text-cyan-100">
            <p>
              {translate("round")} {room.roundNumber}
            </p>
            <p className="font-medium">{phaseLabel}</p>
          </div>
        </div>
      </header>

      <div className="relative mx-2 mb-2 flex flex-1 flex-col overflow-hidden rounded-[2rem] border-2 border-emerald-600/30 shadow-2xl">
        <div className="table-felt absolute inset-0" />
        <div className="table-rim pointer-events-none absolute inset-0 rounded-[2rem]" />
        <div className="table-glow pointer-events-none absolute inset-0" />

        <div className="relative z-10 flex flex-1 flex-col p-3">
          <div className="opponents-table relative min-h-[9rem] flex-1">
            {opponents.map((player, index) => {
              const seat = getOpponentSeatPosition(index, opponents.length);
              return (
                <div key={player.id} className={`opponent-slot opponent-slot-${seat}`}>
                  <OpponentSeat
                    player={player}
                    isTurn={player.id === turnPlayerId}
                    showCards={showAllCards}
                    animateDeal={animateDeal}
                    dealKey={dealKey}
                  />
                </div>
              );
            })}
          </div>

          <div className="mx-auto w-full max-w-xs px-2">
            <div className="center-pot rounded-3xl px-5 py-5 text-center">
              {room.currentBid && room.phase === "bidding" ? (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">
                    {translate("currentBid")}
                  </p>
                  <p className="mt-1 text-3xl font-black text-white drop-shadow">
                    {room.currentBid.count}× {room.currentBid.rank}
                  </p>
                  <p className="mt-1 text-sm text-cyan-100/80">{room.currentBid.playerName}</p>
                </>
              ) : room.phase === "revealed" ? (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-red-200/80">
                    {translate("cardsRevealed")}
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">{translate("counting")}</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-100/70">
                    {translate("turn")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-white">{turnName ?? "..."}</p>
                </>
              )}
            </div>
          </div>

          {children ? <div className="mt-3 space-y-3">{children}</div> : null}
        </div>
      </div>

      <div className="player-hand relative px-1 pb-5 pt-4">
        <div className="mb-3 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white">
              {me?.name ?? translate("you")}
              <span className="ml-2 text-xs font-normal text-cyan-200/60">
                {translate("yourHand")}
              </span>
            </p>
            {me?.isBlind && !showAllCards ? (
              <span className="rounded-lg bg-amber-400 px-2 py-0.5 text-[10px] font-black text-amber-950">
                {translate("blind")}
              </span>
            ) : null}
          </div>
          {me && !me.isEliminated ? (
            <span className="count-badge count-badge-lg">{me.cardCount}</span>
          ) : null}
        </div>

        {!me ? (
          <p className="text-center text-sm text-white/50">{translate("playerNotFound")}</p>
        ) : me.isEliminated ? (
          <p className="text-center text-sm text-white/50">{translate("eliminated")}</p>
        ) : showAllCards || (!me.isBlind && me.cards.length > 0) ? (
          <CardFan
            cards={me.cards}
            size="xl"
            spread="wide"
            tilt="hand"
            animateDeal={animateDeal}
            dealKey={dealKey}
          />
        ) : me.isBlind ? (
          <>
            <CardFan
              count={me.cardCount}
              blind
              size="xl"
              spread="wide"
              tilt="hand"
              animateDeal={animateDeal}
              dealKey={dealKey}
            />
            <p className="mt-2 text-center text-xs text-amber-200">{translate("cantSeeCards")}</p>
          </>
        ) : (
          <CardFan
            cards={me.cards}
            size="xl"
            spread="wide"
            tilt="hand"
            animateDeal={animateDeal}
            dealKey={dealKey}
          />
        )}
      </div>
    </div>
  );
}

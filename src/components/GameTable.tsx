"use client";

import { Bid, Player, Room } from "@/lib/types";
import { CardFan } from "./CardFan";
import { OpponentSeat } from "./OpponentSeat";
import { RANK_LABELS } from "@/lib/types";

type GameTableProps = {
  room: Room;
  roomCode: string;
  me: Player | undefined;
  opponents: Player[];
  playerId: string;
  turnPlayerId?: string;
  showAllCards: boolean;
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
  children,
}: GameTableProps) {
  const turnName = opponents.find((p) => p.id === turnPlayerId)?.name
    ?? (turnPlayerId === playerId ? me?.name : undefined);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#061208]">
      {/* Üst bilgi çubuğu */}
      <header className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-emerald-600">BLIND</p>
          <p className="text-sm font-medium text-emerald-100/80">Oda {roomCode}</p>
        </div>
        <div className="text-right text-xs text-emerald-200/60">
          <p>El {room.roundNumber}</p>
          <p>
            {room.status === "finished"
              ? "Bitti"
              : room.phase === "revealed"
                ? "Açık"
                : "İddia"}
          </p>
        </div>
      </header>

      {/* Masa */}
      <div className="relative mx-2 mb-2 flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-emerald-900/60 shadow-inner">
        <div className="table-felt absolute inset-0" />
        <div className="table-glow pointer-events-none absolute inset-0" />

        <div className="relative z-10 flex flex-1 flex-col p-3">
          {/* Rakipler */}
          <div className="mb-3 flex flex-wrap justify-center gap-2 sm:gap-4">
            {opponents.map((player) => (
              <OpponentSeat
                key={player.id}
                player={player}
                isTurn={player.id === turnPlayerId}
                showCards={showAllCards}
              />
            ))}
          </div>

          {/* Masa ortası — iddia / sıra */}
          <div className="mx-auto my-auto w-full max-w-xs">
            <div className="rounded-full border border-emerald-700/40 bg-black/30 px-5 py-4 text-center backdrop-blur-sm">
              {room.currentBid && room.phase === "bidding" ? (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-emerald-300/60">
                    Güncel iddia
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {room.currentBid.count}× {room.currentBid.rank}
                  </p>
                  <p className="text-xs text-emerald-200/70">{room.currentBid.playerName}</p>
                </>
              ) : room.phase === "revealed" ? (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-red-300/70">
                    Kartlar açıldı
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">Sayım yapılıyor</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-emerald-300/60">
                    Sıra
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">{turnName ?? "..."}</p>
                </>
              )}
            </div>
          </div>

          {/* Ek içerik (sonuç, kontroller) */}
          {children ? <div className="mt-3 space-y-3">{children}</div> : null}
        </div>
      </div>

      {/* Senin elin — büyük kartlar */}
      <div className="player-hand relative border-t border-emerald-900/50 px-2 pb-4 pt-5">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-sm font-semibold text-emerald-100">
            {me?.name ?? "Sen"}
            <span className="ml-2 text-xs font-normal text-emerald-400/70">Senin elin</span>
          </p>
          {me?.isBlind && !showAllCards ? (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
              BLIND
            </span>
          ) : null}
        </div>

        {!me ? (
          <p className="text-center text-sm text-neutral-500">Oyuncu bulunamadı</p>
        ) : me.isEliminated ? (
          <p className="text-center text-sm text-neutral-500">Elendin</p>
        ) : showAllCards || (!me.isBlind && me.cards.length > 0) ? (
          <CardFan cards={me.cards} size="xl" spread="wide" />
        ) : me.isBlind ? (
          <>
            <CardFan count={me.cardCount} blind size="xl" spread="wide" />
            <p className="mt-2 text-center text-xs text-amber-300/80">
              Kartlarını göremezsin
            </p>
          </>
        ) : (
          <CardFan cards={me.cards} size="xl" spread="wide" />
        )}
      </div>
    </div>
  );
}

export function BidBanner({ bid }: { bid: Bid }) {
  return (
    <span className="font-bold text-emerald-300">
      {bid.count}× {RANK_LABELS[bid.rank]}
    </span>
  );
}

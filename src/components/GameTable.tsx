"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getOpponentSeatPosition } from "@/lib/seatLayout";
import { getHandDisplayCount, getBlindMode } from "@/lib/gameLogic";
import { ChatMessage, Player, Room } from "@/lib/types";
import { CardFan } from "./CardFan";
import { EmojiChat } from "./EmojiChat";
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
  onHomeClick?: () => void;
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
  onHomeClick,
}: GameTableProps) {
  const { translate } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const blindMode = getBlindMode(room);
  const handCount = me ? getHandDisplayCount(me, blindMode) : 0;
  const seesOwnCards = Boolean(me && !me.isBlind && me.cards.length > 0);

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
      <header className="relative z-20 flex items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="game-header-brand">BLIND</p>
          <p className="truncate text-sm font-medium text-slate-200">
            {translate("lobbyRoom")} {roomCode}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onHomeClick ? (
            <button
              type="button"
              onClick={onHomeClick}
              className="home-footer-btn !min-h-8 px-3 py-2 text-xs"
            >
              {translate("home")}
            </button>
          ) : null}
          <EmojiChat
            roomCode={roomCode}
            playerId={playerId}
            playerName={me?.name ?? ""}
            onMessagesChange={setMessages}
          />
          <SoundToggle compact />
          <div className="game-chip px-3 py-1.5 text-right text-xs">
            <p className="text-slate-400">
              {translate("round")} {room.roundNumber}
            </p>
            <p className="font-medium text-slate-200">{phaseLabel}</p>
          </div>
        </div>
      </header>

      <div className="relative mx-2 mb-2 flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <div className="table-felt absolute inset-0" />
        <div className="table-rim pointer-events-none absolute inset-0 rounded-2xl" />
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
                    blindMode={blindMode}
                    animateDeal={animateDeal}
                    dealKey={dealKey}
                    messages={messages}
                  />
                </div>
              );
            })}
          </div>

          <div className="mx-auto w-full max-w-xs px-2">
            <div className="center-pot rounded-2xl px-5 py-5 text-center">
              {room.currentBid && room.phase === "bidding" ? (
                <>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    {translate("currentBid")}
                  </p>
                  <p className="mt-1 text-3xl font-light tracking-wide text-white">
                    {room.currentBid.count}× {room.currentBid.rank}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{room.currentBid.playerName}</p>
                </>
              ) : room.phase === "revealed" ? (
                <>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    {translate("cardsRevealed")}
                  </p>
                  <p className="mt-1 text-xl font-medium text-white">{translate("counting")}</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    {translate("turn")}
                  </p>
                  <p className="mt-1 text-2xl font-light text-white">{turnName ?? "..."}</p>
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
            <p className="text-sm font-semibold text-slate-100">
              {me?.name ?? translate("you")}
              <span className="ml-2 text-xs font-normal text-slate-400">
                {translate("yourHand")}
              </span>
            </p>
            {me?.isBlind && !showAllCards ? (
              <span className="game-chip px-2 py-0.5 text-[10px] font-semibold">
                {translate("blind")}
              </span>
            ) : null}
          </div>
          {me && !me.isEliminated && handCount > 0 ? (
            <span className="count-badge count-badge-lg">{handCount}</span>
          ) : null}
        </div>

        {!me ? (
          <p className="text-center text-sm text-slate-500">{translate("playerNotFound")}</p>
        ) : me.isEliminated ? (
          <p className="text-center text-sm text-slate-500">{translate("eliminated")}</p>
        ) : seesOwnCards || (showAllCards && !me.isBlind) ? (
          <div className="flex w-full justify-center">
            <CardFan
              cards={me.cards}
              size="xl"
              spread="wide"
              tilt="hand"
              animateDeal={animateDeal}
              dealKey={dealKey}
            />
          </div>
        ) : me.isBlind && handCount > 0 ? (
          <div className="flex w-full flex-col items-center">
            <CardFan
              count={handCount}
              blind
              size="xl"
              spread="wide"
              tilt="hand"
              animateDeal={animateDeal}
              dealKey={dealKey}
            />
            <p className="mt-2 text-center text-xs text-slate-400">{translate("cantSeeCards")}</p>
          </div>
        ) : me.isBlind ? (
          <p className="text-center text-sm text-slate-400">
            {blindMode === "HIDDEN_CARDS_BLIND"
              ? translate("blindHiddenCards")
              : translate("blindNoCards")}
          </p>
        ) : (
          <div className="flex w-full justify-center">
            <CardFan
              cards={me.cards}
              size="xl"
              spread="wide"
              tilt="hand"
              animateDeal={animateDeal}
              dealKey={dealKey}
            />
          </div>
        )}
      </div>
    </div>
  );
}

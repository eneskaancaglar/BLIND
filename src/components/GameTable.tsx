"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getOpponentSeatPosition } from "@/lib/seatLayout";
import { getHandDisplayCount, getBlindMode } from "@/lib/gameLogic";
import { ChatMessage, Player, Rank, Room } from "@/lib/types";
import { CardFan } from "./CardFan";
import { CurrentBidDisplay } from "./CurrentBidDisplay";
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
  highlightRank?: Rank | null;
  compactDock?: boolean;
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
  highlightRank,
  compactDock = false,
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
  const handSize = compactDock ? "md" : "lg";
  const handSpread = compactDock ? "normal" : "wide";

  const turnName =
    opponents.find((p) => p.id === turnPlayerId)?.name ??
    (turnPlayerId === playerId ? me?.name : undefined);

  const phaseLabel =
    room.status === "finished"
      ? translate("statusFinished")
      : room.phase === "revealed"
        ? translate("statusRevealed")
        : translate("statusBidding");

  function renderHand() {
    if (!me) {
      return <p className="text-center text-sm text-slate-500">{translate("playerNotFound")}</p>;
    }
    if (me.isEliminated) {
      return <p className="text-center text-sm text-slate-500">{translate("eliminated")}</p>;
    }
    if (seesOwnCards || (showAllCards && me.cards.length > 0)) {
      return (
        <CardFan
          cards={me.cards}
          size={handSize}
          spread={handSpread}
          tilt="hand"
          animateDeal={animateDeal}
          dealKey={dealKey}
          highlightRank={highlightRank ?? undefined}
        />
      );
    }
    if (me.isBlind && handCount > 0 && !showAllCards) {
      return (
        <>
          <CardFan
            count={handCount}
            blind
            size={handSize}
            spread={handSpread}
            tilt="hand"
            animateDeal={animateDeal}
            dealKey={dealKey}
          />
          <p className="mt-1 text-center text-[10px] text-slate-400">{translate("cantSeeCards")}</p>
        </>
      );
    }
    if (me.isBlind && showAllCards && me.cards.length > 0) {
      return (
        <CardFan
          cards={me.cards}
          size={handSize}
          spread={handSpread}
          tilt="hand"
          highlightRank={highlightRank ?? undefined}
        />
      );
    }
    if (me.isBlind) {
      return (
        <p className="text-center text-xs text-slate-400">
          {blindMode === "HIDDEN_CARDS_BLIND"
            ? translate("blindHiddenCards")
            : translate("blindNoCards")}
        </p>
      );
    }
    return (
      <CardFan
        cards={me.cards}
        size={handSize}
        spread={handSpread}
        tilt="hand"
        animateDeal={animateDeal}
        dealKey={dealKey}
        highlightRank={highlightRank ?? undefined}
      />
    );
  }

  return (
    <div className="game-shell flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden">
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
        <div className="min-w-0 flex-1">
          <p className="game-header-brand">BLIND</p>
          <p className="truncate text-sm font-medium text-slate-200">
            {translate("lobbyRoom")} {roomCode}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {onHomeClick ? (
            <button
              type="button"
              onClick={onHomeClick}
              className="home-footer-btn !min-h-8 px-2 py-1.5 text-[10px] sm:px-3 sm:text-xs"
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
          <div className="game-chip px-2 py-1 text-right text-[10px] sm:px-3 sm:text-xs">
            <p className="text-slate-400">
              {translate("round")} {room.roundNumber}
            </p>
            <p className="font-medium text-slate-200">{phaseLabel}</p>
          </div>
        </div>
      </header>

      <div className="relative mx-2 mb-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <div className="table-felt absolute inset-0" />
        <div className="table-rim pointer-events-none absolute inset-0 rounded-2xl" />
        <div className="table-glow pointer-events-none absolute inset-0" />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col p-2 sm:p-3">
          <div className="opponents-table relative min-h-[5.5rem] flex-1 overflow-visible sm:min-h-[6.5rem]">
            {opponents.map((player, index) => {
              const seat = getOpponentSeatPosition(index, opponents.length);
              return (
                <div key={player.id} className={`opponent-slot opponent-slot-${seat}`}>
                  <OpponentSeat
                    player={player}
                    isTurn={player.id === turnPlayerId}
                    showCards={showAllCards}
                    blindMode={blindMode}
                    highlightRank={highlightRank ?? undefined}
                    animateDeal={animateDeal}
                    dealKey={dealKey}
                    messages={messages}
                  />
                </div>
              );
            })}
          </div>

          <div className="mx-auto w-full max-w-xs shrink-0 px-1">
            <div className="center-pot rounded-2xl px-3 py-3 text-center sm:px-5 sm:py-4">
              {room.currentBid && room.phase === "bidding" ? (
                <>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    {translate("currentBid")}
                  </p>
                  <div className="mt-2">
                    <CurrentBidDisplay
                      bid={room.currentBid}
                      playerName={room.currentBid.playerName}
                      compact={compactDock}
                    />
                  </div>
                </>
              ) : room.phase === "revealed" ? (
                <>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    {translate("cardsRevealed")}
                  </p>
                  {room.currentBid ? (
                    <div className="mt-2">
                      <CurrentBidDisplay bid={room.currentBid} compact />
                    </div>
                  ) : null}
                  <p className="mt-1 text-sm font-medium text-white">{translate("counting")}</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    {translate("turn")}
                  </p>
                  <p className="mt-1 text-xl font-light text-white sm:text-2xl">{turnName ?? "..."}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`game-dock ${compactDock ? "game-dock-compact" : ""} px-1 pb-3 pt-2 sm:pb-4`}>
        <div className="mb-1 flex items-center justify-between px-2 sm:px-3">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-xs font-semibold text-slate-100 sm:text-sm">
              {me?.name ?? translate("you")}
              <span className="ml-1.5 text-[10px] font-normal text-slate-400 sm:text-xs">
                {translate("yourHand")}
              </span>
            </p>
            {me?.isBlind && !showAllCards ? (
              <span className="game-chip shrink-0 px-1.5 py-0.5 text-[9px] font-semibold">
                {translate("blind")}
              </span>
            ) : null}
          </div>
          {me && !me.isEliminated && handCount > 0 ? (
            <span className="count-badge count-badge-lg shrink-0">{handCount}</span>
          ) : null}
        </div>

        <div className="flex w-full justify-center px-1">{renderHand()}</div>

        {children ? <div className="mt-2 px-1">{children}</div> : null}
      </div>
    </div>
  );
}
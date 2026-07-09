"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getOpponentSeatPosition } from "@/lib/seatLayout";
import { getHandDisplayCount, getBlindMode } from "@/lib/gameLogic";
import { ChatMessage, Player, Rank, RevealResult, Room } from "@/lib/types";
import { CardFan } from "./CardFan";
import { CurrentBidDisplay } from "./CurrentBidDisplay";
import { EmojiChat } from "./EmojiChat";
import { OpponentSeat } from "./OpponentSeat";
import { RevealPotSummary } from "./RevealPotSummary";
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
  revealResult?: RevealResult | null;
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
  revealResult,
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
  const handSize = compactDock ? "sm" : "md";
  const handSpread = compactDock ? "tight" : "normal";

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
      return <p className="text-center text-xs text-slate-500">{translate("playerNotFound")}</p>;
    }
    if (me.isEliminated) {
      return <p className="text-center text-xs text-slate-500">{translate("eliminated")}</p>;
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
        <CardFan
          count={handCount}
          blind
          size={handSize}
          spread={handSpread}
          tilt="hand"
          animateDeal={animateDeal}
          dealKey={dealKey}
        />
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
        <p className="text-center text-[11px] text-slate-400">
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
    <div className="game-shell game-layout flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden">
      <header className="game-header relative z-20 flex shrink-0 items-center justify-between gap-1.5 px-2 py-1.5 sm:px-4 sm:py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-200 sm:text-sm">
            {roomCode}
            <span className="ml-2 text-slate-500">
              {translate("round")} {room.roundNumber}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onHomeClick ? (
            <button type="button" onClick={onHomeClick} className="home-footer-btn !min-h-7 px-2 py-1 text-[10px]">
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
        </div>
      </header>

      <div className="game-table-area relative mx-1.5 mb-1 flex min-h-0 shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 sm:mx-2 sm:rounded-2xl">
        <div className="table-felt absolute inset-0" />
        <div className="table-rim pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl" />
        <div className="table-glow pointer-events-none absolute inset-0" />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col p-1.5 sm:p-2">
          <div className="opponents-table relative min-h-[4.5rem] flex-1 overflow-visible sm:min-h-[5.5rem]">
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

          <div className="mx-auto w-full max-w-[16rem] shrink-0 px-0.5">
            <div className="center-pot center-pot-compact rounded-xl px-2 py-2 text-center sm:rounded-2xl sm:px-4 sm:py-3">
              {room.phase === "revealed" && revealResult ? (
                <RevealPotSummary
                  result={revealResult}
                  bidCount={room.currentBid?.count ?? 0}
                />
              ) : room.currentBid && room.phase === "bidding" ? (
                <>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400 sm:text-[10px]">
                    {translate("currentBid")}
                  </p>
                  <div className="mt-1">
                    <CurrentBidDisplay
                      bid={room.currentBid}
                      playerName={room.currentBid.playerName}
                      compact
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                    {phaseLabel}
                  </p>
                  <p className="mt-0.5 truncate text-base font-medium text-white sm:text-lg">
                    {turnName ?? "..."}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`game-dock game-dock-area ${compactDock ? "game-dock-compact" : ""} min-h-0 shrink px-1 pb-2 pt-1.5 sm:pb-3`}>
        {!compactDock ? (
          <div className="mb-1 flex items-center justify-between px-1.5">
            <p className="truncate text-[11px] font-semibold text-slate-100">
              {me?.name ?? translate("you")}
            </p>
            {me && !me.isEliminated && handCount > 0 ? (
              <span className="count-badge shrink-0">{handCount}</span>
            ) : null}
          </div>
        ) : null}

        <div className="flex w-full justify-center">{renderHand()}</div>

        {children ? <div className="mt-1.5 shrink-0 px-0.5">{children}</div> : null}
      </div>
    </div>
  );
}

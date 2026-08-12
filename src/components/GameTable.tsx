"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getOpponentSeatPosition } from "@/lib/seatLayout";
import { getHandDisplayCount, getBlindMode } from "@/lib/gameLogic";
import { ChatMessage, Player, Rank, RevealResult, Room } from "@/lib/types";
import { BidHistoryButton, BidHistoryPanel } from "./BidHistoryPanel";
import { CardFan } from "./CardFan";
import { CurrentBidDisplay } from "./CurrentBidDisplay";
import { EmojiChat } from "./EmojiChat";
import { OpponentSeat } from "./OpponentSeat";
import { RevealPotSummary } from "./RevealPotSummary";
import { SoundToggle } from "./SoundToggle";
import { GameRoomAmbience } from "./GameRoomAmbience";
import { PlayerAvatar } from "./PlayerAvatar";

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
  const [showBidHistory, setShowBidHistory] = useState(false);
  const blindMode = getBlindMode(room);
  const bidHistory = room.bidHistory ?? [];

  useEffect(() => {
    setShowBidHistory(false);
  }, [room.roundNumber, room.phase]);
  const handCount = me ? getHandDisplayCount(me, blindMode) : 0;
  const seesOwnCards = Boolean(me && !me.isBlind && me.cards.length > 0);
  const isBiddingPhase = room.phase === "bidding";
  const handSize = isBiddingPhase ? "md" : compactDock ? "sm" : "md";
  const handSpread = "tight";
  const handMaxVisible = isBiddingPhase ? 7 : undefined;
  const isMyTurn = turnPlayerId === playerId;
  const deckCount = room.deckCount ?? 1;

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
          fanStyle="classic"
          seatPosition="bottom"
          deckCount={deckCount}
          maxVisible={handMaxVisible}
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
          fanStyle="classic"
          seatPosition="bottom"
          deckCount={deckCount}
          maxVisible={handMaxVisible}
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
          fanStyle="classic"
          seatPosition="bottom"
          deckCount={deckCount}
          maxVisible={handMaxVisible}
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
        fanStyle="classic"
        seatPosition="bottom"
        maxVisible={handMaxVisible}
        animateDeal={animateDeal}
        dealKey={dealKey}
        highlightRank={highlightRank ?? undefined}
      />
    );
  }

  function renderCenterPot() {
    if (room.phase === "revealed" && revealResult) {
      return (
        <RevealPotSummary
          result={revealResult}
          bidCount={room.currentBid?.count ?? 0}
        />
      );
    }

    if (isBiddingPhase && room.currentBid) {
      return (
        <div className="center-bid-display flex flex-col items-center gap-1">
          <p className="text-[8px] font-semibold uppercase tracking-wider text-amber-200/80">
            {translate("currentBid")}
          </p>
          <CurrentBidDisplay
            bid={room.currentBid}
            playerName={room.currentBid.playerName}
            compact
          />
          <p className="mt-0.5 text-[8px] text-slate-400">
            {translate("turn")}:{" "}
            <span className="font-medium text-slate-200">{turnName ?? "..."}</span>
          </p>
        </div>
      );
    }

    if (isBiddingPhase) {
      return (
        <>
          <p className="text-[8px] font-medium uppercase tracking-wider text-slate-400">
            {translate("turn")}
          </p>
          <p className="mt-0.5 truncate text-sm font-medium text-white">{turnName ?? "..."}</p>
        </>
      );
    }

    return (
      <>
        <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">{phaseLabel}</p>
        <p className="mt-0.5 truncate text-base font-medium text-white sm:text-lg">
          {turnName ?? "..."}
        </p>
      </>
    );
  }

  return (
    <div
      className={`game-shell game-layout flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden ${
        isBiddingPhase ? "game-bidding" : ""
      }`}
    >
      <GameRoomAmbience />

      <header className="game-header relative z-20 flex shrink-0 items-center justify-between gap-1.5 px-2 py-1 sm:px-4 sm:py-1.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-slate-200 sm:text-sm">
            {roomCode}
            <span className="ml-1.5 text-slate-500">
              {translate("round")} {room.roundNumber}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {room.status === "playing" ? (
            <BidHistoryButton
              bidCount={bidHistory.length}
              active={showBidHistory}
              onClick={() => setShowBidHistory(true)}
            />
          ) : null}
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
          <div className="game-header-self ml-0.5 flex items-center gap-1.5 border-l border-white/10 pl-1.5">
            <p className="game-header-self-name hidden max-w-[5.5rem] truncate text-[10px] font-semibold text-amber-100 sm:block">
              {me?.name ?? translate("you")}
            </p>
            <PlayerAvatar player={me} size="sm" isTurn={isMyTurn} title={me?.name} />
          </div>
        </div>
      </header>

      <div className="game-table-stage">
        <div className="game-table-perspective">
          <div className="game-table-area">
            <div className="table-felt absolute inset-0" />
            <div className="table-felt-grain pointer-events-none absolute inset-0" />
            <div className="table-spotlight pointer-events-none absolute inset-0" />
            <div className="table-rail pointer-events-none absolute inset-0" />
            <div className="table-rim pointer-events-none absolute inset-0" />
            <div className="table-glow pointer-events-none absolute inset-0" />
            <div className="table-edge-shine pointer-events-none absolute inset-0" />
            <p className="table-brand pointer-events-none absolute z-[2]">BLIND</p>

          <div className="relative z-10 flex h-full min-h-0 flex-col p-1 sm:p-2">
            <div className="opponents-table relative min-h-0 flex-1 overflow-hidden">
            {opponents.map((player, index) => {
              const seat = getOpponentSeatPosition(index, opponents.length);
              return (
                <div key={player.id} className={`opponent-slot opponent-slot-${seat}`}>
                  <OpponentSeat
                    player={player}
                    seatPosition={seat}
                    deckCount={deckCount}
                    isTurn={player.id === turnPlayerId}
                    showCards={showAllCards}
                    blindMode={blindMode}
                    highlightRank={highlightRank ?? undefined}
                    compact={isBiddingPhase}
                    animateDeal={animateDeal}
                    dealKey={dealKey}
                    messages={messages}
                  />
                </div>
              );
            })}
          </div>

          <div className="mx-auto w-full max-w-[16rem] shrink-0 px-0.5">
            <div className="center-pot center-pot-compact rounded-lg px-2 py-1.5 text-center sm:rounded-2xl sm:px-4 sm:py-3">
              {renderCenterPot()}
            </div>
          </div>
          </div>
          </div>
        </div>
      </div>

      <BidHistoryPanel
        open={showBidHistory}
        onClose={() => setShowBidHistory(false)}
        bids={bidHistory}
        roundNumber={room.roundNumber}
      />

      <div
        className={`game-dock game-dock-area ${isBiddingPhase ? "game-dock-compact" : compactDock ? "game-dock-compact" : ""} min-h-0 shrink-0 px-1 pb-1.5 pt-1 sm:pb-3`}
      >
        <div className="game-dock-hand flex w-full shrink-0 justify-center">{renderHand()}</div>

        {children ? <div className="game-dock-controls mt-1 shrink-0 px-0.5">{children}</div> : null}
      </div>
    </div>
  );
}

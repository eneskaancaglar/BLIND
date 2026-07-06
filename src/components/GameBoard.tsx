"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BidControls } from "@/components/BidControls";
import { GameTable } from "@/components/GameTable";
import { RoundResultOverlay } from "@/components/RoundResultOverlay";
import { RoundTransitionOverlay } from "@/components/RoundTransitionOverlay";
import { WinnerOverlay } from "@/components/WinnerOverlay";
import { useLanguage } from "@/context/LanguageContext";
import { useSound } from "@/context/SoundContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getActivePlayers, nextTurnIndex } from "@/lib/gameLogic";
import { Bid, Player, Room } from "@/lib/types";
import {
  attachRoomSync,
  continueAfterReveal,
  getPlayerId,
  leaveGame,
  maskPlayersForViewer,
  openChallenge,
  placeBid,
} from "@/lib/roomService";

type GameBoardProps = {
  roomCode: string;
  onLeave: () => void;
};

const TRANSITION_MS = 2200;

export function GameBoard({ roomCode, onLeave }: GameBoardProps) {
  const { translate } = useLanguage();
  const { play } = useSound();
  const [playerId, setPlayerId] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTransition, setShowTransition] = useState(false);
  const [animateDeal, setAnimateDeal] = useState(false);

  const prevPhaseRef = useRef<Room["phase"] | null>(null);
  const skipPhaseTransitionRef = useRef(false);
  const prevRoundRef = useRef(0);
  const transitionTimerRef = useRef<number | null>(null);
  const revealSoundRef = useRef<string | null>(null);
  const transitionSoundRef = useRef(false);
  const winSoundRef = useRef(false);
  const dealSoundRef = useRef<string | null>(null);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  const endTransition = useCallback(() => {
    clearTransitionTimer();
    setShowTransition(false);
  }, [clearTransitionTimer]);

  const startTransition = useCallback(
    (ms = TRANSITION_MS) => {
      clearTransitionTimer();
      setShowTransition(true);
      transitionTimerRef.current = window.setTimeout(() => {
        endTransition();
      }, ms);
    },
    [clearTransitionTimer, endTransition]
  );

  const roomPhase = room?.phase;
  const roomRoundNumber = room?.roundNumber ?? 0;

  useEffect(() => {
    setPlayerId(getPlayerId());
    return () => clearTransitionTimer();
  }, [clearTransitionTimer]);

  useEffect(() => {
    if (!roomCode || !isFirebaseConfigured()) return;

    return attachRoomSync(roomCode, {
      onRoom: setRoom,
      onPlayers: setPlayers,
      onError: (err) => setError(err.message),
    });
  }, [roomCode]);

  useEffect(() => {
    if (!roomPhase) return;

    const prev = prevPhaseRef.current;
    if (prev === "revealed" && roomPhase === "bidding" && !skipPhaseTransitionRef.current) {
      startTransition();
    }

    if (skipPhaseTransitionRef.current && roomPhase === "bidding") {
      skipPhaseTransitionRef.current = false;
    }

    prevPhaseRef.current = roomPhase;
  }, [roomPhase, startTransition]);

  useEffect(() => {
    if (roomRoundNumber <= 0 || roomPhase !== "bidding") return;
    if (prevRoundRef.current === roomRoundNumber) return;

    prevRoundRef.current = roomRoundNumber;
    setAnimateDeal(true);
    const timer = window.setTimeout(() => setAnimateDeal(false), 1400);
    return () => window.clearTimeout(timer);
  }, [roomRoundNumber, roomPhase]);

  useEffect(() => {
    if (!animateDeal || roomRoundNumber <= 0) return;

    const me = players.find((p) => p.id === playerId);
    if (!me || me.isEliminated || me.cardCount === 0) return;

    const key = `${roomRoundNumber}-${me.cardCount}`;
    if (dealSoundRef.current === key) return;
    dealSoundRef.current = key;

    const timers: number[] = [];
    for (let i = 0; i < me.cardCount; i += 1) {
      timers.push(
        window.setTimeout(() => {
          play("card");
        }, 100 + i * 70)
      );
    }

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [animateDeal, roomRoundNumber, players, playerId, play]);

  useEffect(() => {
    if (room?.phase === "revealed" && room.revealResult) {
      const key = room.revealResult.loserId;
      if (revealSoundRef.current !== key) {
        revealSoundRef.current = key;
        play("open");
      }
    }
  }, [room?.phase, room?.revealResult, play]);

  useEffect(() => {
    if (showTransition && !transitionSoundRef.current) {
      transitionSoundRef.current = true;
      play("transition");
    }
    if (!showTransition) {
      transitionSoundRef.current = false;
    }
  }, [showTransition, play]);

  useEffect(() => {
    if (room?.status === "finished" && room.winnerName && !winSoundRef.current) {
      winSoundRef.current = true;
      const iWon = room.winnerId === playerId;
      play(iWon ? "win" : "lose");
    }
  }, [room?.status, room?.winnerId, room?.winnerName, playerId, play]);

  const me = players.find((player) => player.id === playerId);
  const blindGetsCards = room?.blindGetsCards ?? false;
  const visiblePlayers = useMemo(() => {
    if (!room) return players;
    return maskPlayersForViewer(players, playerId, room.phase, room.status, blindGetsCards);
  }, [players, playerId, room, blindGetsCards]);

  const opponents = visiblePlayers.filter((p) => p.id !== playerId);
  const activePlayers = getActivePlayers(players);
  const turnPlayerId = room?.turnOrder[room.currentTurnIndex] ?? undefined;
  const isMyTurn = turnPlayerId === playerId;
  const canContinue = Boolean(me && !me.isEliminated && room?.status !== "finished");
  const showAllCards = room?.phase === "revealed";
  const deckCount = room?.deckCount ?? 1;

  const starterName =
    room?.phase === "bidding"
      ? players.find((p) => p.id === room.turnOrder[0])?.name ?? "..."
      : room?.revealResult?.loserName ?? "...";

  const transitionRound = room?.roundNumber ?? 1;

  const showResultOverlay = Boolean(
    room?.revealResult && room.phase === "revealed" && !showTransition && room.status !== "finished"
  );

  async function handleBid(count: number, rank: Parameters<typeof placeBid>[4]) {
    if (!me || !room) return;

    const bid: Bid = {
      count,
      rank,
      playerId,
      playerName: me.name,
    };

    setRoom({
      ...room,
      currentBid: bid,
      currentTurnIndex: nextTurnIndex(room.turnOrder, room.currentTurnIndex),
    });

    try {
      await placeBid(roomCode, playerId, me.name, count, rank);
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("bidFail"));
    }
  }

  async function handleOpen() {
    if (!me) return;
    try {
      await openChallenge(roomCode, playerId, me.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("bidOpenFail"));
    }
  }

  async function handleContinue() {
    if (!room?.revealResult) return;

    setLoading(true);
    setError("");
    skipPhaseTransitionRef.current = true;
    startTransition(TRANSITION_MS);

    try {
      await continueAfterReveal(roomCode, playerId);
    } catch (err) {
      endTransition();
      setError(err instanceof Error ? err.message : translate("errContinue"));
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    try {
      await leaveGame(roomCode, playerId);
    } catch {
      // Still navigate home if leave fails.
    }
    onLeave();
  }

  if (!room) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#061208]">
        <p className="text-emerald-200/50">{translate("settingUp")}</p>
      </main>
    );
  }

  return (
    <>
      {room.status === "finished" && room.winnerName ? (
        <WinnerOverlay
          winnerName={room.winnerName}
          isMe={room.winnerId === playerId}
          onHome={handleLeave}
        />
      ) : null}

      {showResultOverlay && room.revealResult ? (
        <RoundResultOverlay
          result={room.revealResult}
          bidCount={room.currentBid?.count ?? 0}
          canContinue={canContinue}
          loading={loading}
          onContinue={handleContinue}
        />
      ) : null}

      {showTransition ? (
        <RoundTransitionOverlay roundNumber={transitionRound} starterName={starterName} />
      ) : null}

      <GameTable
        room={room}
        roomCode={roomCode}
        me={me}
        opponents={opponents}
        playerId={playerId}
        turnPlayerId={turnPlayerId}
        showAllCards={showAllCards}
        animateDeal={animateDeal}
        dealKey={`${room.roundNumber}-${room.phase}`}
      >
        {room.phase === "bidding" && isMyTurn && me && !me.isEliminated ? (
          <BidControls
            currentBid={room.currentBid}
            activePlayerCount={activePlayers.length}
            deckCount={deckCount}
            onBid={handleBid}
            onOpen={handleOpen}
            canOpen={Boolean(room.currentBid)}
          />
        ) : null}

        {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}

        <button
          type="button"
          onClick={handleLeave}
          className="w-full py-2 text-center text-xs text-neutral-500 underline"
        >
          {translate("home")}
        </button>
      </GameTable>
    </>
  );
}

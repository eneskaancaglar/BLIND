"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BidControls } from "@/components/BidControls";
import { GameTable } from "@/components/GameTable";
import { DrawOverlay } from "@/components/DrawOverlay";
import { RoundResultOverlay } from "@/components/RoundResultOverlay";
import { RoundTransitionOverlay } from "@/components/RoundTransitionOverlay";
import { WinnerOverlay } from "@/components/WinnerOverlay";
import { useLanguage } from "@/context/LanguageContext";
import { useSound } from "@/context/SoundContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getActivePlayers, getBlindMode, getHandDisplayCount, predictGameEndsAfterReveal, predictWinnerAfterReveal } from "@/lib/gameLogic";
import { clearBotContinueSuppression, resetBotRunnerForPhaseChange, runBotOrchestrator, suppressBotContinueForRound } from "@/lib/botRunner";
import { roomHasBots } from "@/lib/botAI";
import { Player, Room } from "@/lib/types";
import {
  attachRoomSync,
  continueAfterReveal,
  getPlayerId,
  leaveGame,
  maskPlayersForViewer,
  mergeRoomSyncState,
  openChallenge,
  placeBid,
  refreshRoomState,
  takeRoomBootstrap,
} from "@/lib/roomService";

type GameBoardProps = {
  roomCode: string;
  onLeave: () => void;
};

const TRANSITION_MS = 2200;
const GAME_END_CARD_VIEW_MS = 2500;

type GameEndDisplay = {
  winnerId: string | null;
  winnerName: string | null;
  isDraw: boolean;
};

export function GameBoard({ roomCode, onLeave }: GameBoardProps) {
  const { translate } = useLanguage();
  const { play } = useSound();
  const [playerId, setPlayerId] = useState("");
  const [syncState, setSyncState] = useState<{ room: Room | null; players: Player[] }>(() => {
    return takeRoomBootstrap(roomCode) ?? { room: null, players: [] };
  });
  const room = syncState.room;
  const players = syncState.players;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTransition, setShowTransition] = useState(false);
  const [animateDeal, setAnimateDeal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [gameEndDisplay, setGameEndDisplay] = useState<GameEndDisplay | null>(null);
  const [dismissedRevealKey, setDismissedRevealKey] = useState<string | null>(null);

  const prevPhaseRef = useRef<Room["phase"] | null>(null);
  const skipPhaseTransitionRef = useRef(false);
  const prevRoundRef = useRef(0);
  const gameEndFinalizedRef = useRef(false);
  const gameEndRevealKeyRef = useRef<string | null>(null);
  const gameEndOverlayTimerRef = useRef<number | null>(null);
  const gameEndFinalizeTimerRef = useRef<number | null>(null);
  const playersRef = useRef(players);
  const roomRef = useRef(room);
  playersRef.current = players;
  roomRef.current = room;
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
  const blindMode = room ? getBlindMode(room) : "ORIGINAL_BLIND";

  useEffect(() => {
    setPlayerId(getPlayerId());
    return () => clearTransitionTimer();
  }, [clearTransitionTimer]);

  useEffect(() => {
    if (!roomCode || !isFirebaseConfigured()) return;

    return attachRoomSync(roomCode, {
      onSync: (state) => {
        setSyncState((prev) => ({
          room: mergeRoomSyncState(prev.room, state.room),
          players: state.players.map((player) => ({ ...player })),
        }));
      },
      onError: (err) => setError(err.message),
    });
  }, [roomCode]);

  useEffect(() => {
    if (!room || !playerId || room.hostId !== playerId) return;
    void runBotOrchestrator({ roomCode, room, players, driverPlayerId: playerId });
  }, [
    roomCode,
    playerId,
    room,
    players,
    room?.syncVersion,
    room?.currentTurnIndex,
    room?.phase,
    room?.status,
    room?.roundNumber,
    room?.resolvedRoundNumber,
  ]);

  useEffect(() => {
    resetBotRunnerForPhaseChange();
  }, [room?.phase, room?.roundNumber]);

  useEffect(() => {
    if (!room || !playerId || room.hostId !== playerId || !roomHasBots(players)) return;
    if (room.status !== "playing") return;

    const timer = window.setInterval(() => {
      const currentRoom = roomRef.current;
      const currentPlayers = playersRef.current;
      if (!currentRoom || currentRoom.hostId !== playerId || currentRoom.status !== "playing") {
        return;
      }
      void runBotOrchestrator({
        roomCode,
        room: currentRoom,
        players: currentPlayers,
        driverPlayerId: playerId,
      });
    }, 2000);

    return () => window.clearInterval(timer);
  }, [roomCode, playerId, room?.status, room?.hostId, players.length]);

  const applyFreshState = useCallback(async (preferCache = true) => {
    const fresh = await refreshRoomState(roomCode, { preferCache });
    setSyncState({
      room: fresh.room,
      players: fresh.players.map((player) => ({ ...player })),
    });
    return fresh;
  }, [roomCode]);

  useEffect(() => {
    if (!room?.revealResult || room.hostId !== playerId) return;
    void applyFreshState(false);
  }, [room?.revealResult?.loserId, room?.roundNumber, room?.hostId, playerId, applyFreshState]);

  useEffect(() => {
    if (room?.phase === "bidding") {
      setDismissedRevealKey(null);
      clearBotContinueSuppression();
    }
  }, [room?.phase, room?.roundNumber]);

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
    if (!me || me.isEliminated) return;

    const handCount = getHandDisplayCount(me, blindMode);
    if (handCount === 0) return;

    const key = `${roomRoundNumber}-${handCount}`;
    if (dealSoundRef.current === key) return;
    dealSoundRef.current = key;

    const timers: number[] = [];
    for (let i = 0; i < handCount; i += 1) {
      timers.push(
        window.setTimeout(() => {
          play("card");
        }, 100 + i * 70)
      );
    }

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [animateDeal, roomRoundNumber, players, playerId, play, blindMode]);

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
    if (!gameEndDisplay?.winnerName && !gameEndDisplay?.isDraw) return;
    if (winSoundRef.current) return;
    winSoundRef.current = true;
    const iWon = gameEndDisplay.winnerId === playerId;
    play(gameEndDisplay.isDraw ? "transition" : iWon ? "win" : "lose");
  }, [gameEndDisplay, playerId, play]);

  useEffect(() => {
    return () => {
      if (gameEndOverlayTimerRef.current !== null) {
        window.clearTimeout(gameEndOverlayTimerRef.current);
      }
      if (gameEndFinalizeTimerRef.current !== null) {
        window.clearTimeout(gameEndFinalizeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (room?.status === "finished") {
      setGameEndDisplay((current) =>
        current ?? {
          winnerId: room.winnerId,
          winnerName: room.winnerName,
          isDraw: !room.winnerName,
        }
      );
    }
  }, [room?.status, room?.winnerId, room?.winnerName]);

  const isGameEndingReveal = useMemo(() => {
    if (!room?.revealResult || room.phase !== "revealed") return false;
    return predictGameEndsAfterReveal(players, room.revealResult, room);
  }, [room, players]);

  const me = players.find((player) => player.id === playerId);

  useEffect(() => {
    if (!isGameEndingReveal || !room?.revealResult) {
      return;
    }

    const revealKey = `${room.roundNumber}-${room.revealResult.loserId}`;
    if (gameEndRevealKeyRef.current === revealKey) {
      return;
    }

    gameEndRevealKeyRef.current = revealKey;
    gameEndFinalizedRef.current = false;

    if (gameEndOverlayTimerRef.current !== null) {
      window.clearTimeout(gameEndOverlayTimerRef.current);
    }
    if (gameEndFinalizeTimerRef.current !== null) {
      window.clearTimeout(gameEndFinalizeTimerRef.current);
    }

    gameEndOverlayTimerRef.current = window.setTimeout(() => {
      gameEndOverlayTimerRef.current = null;
      const currentRoom = roomRef.current;
      const currentPlayers = playersRef.current;
      const revealResult = currentRoom?.revealResult;
      if (!currentRoom || !revealResult) return;

      const winner = predictWinnerAfterReveal(currentPlayers, revealResult, currentRoom);
      setGameEndDisplay((current) =>
        current ?? {
          winnerId: winner?.id ?? null,
          winnerName: winner?.name ?? null,
          isDraw: !winner,
        }
      );
    }, GAME_END_CARD_VIEW_MS);

    if (!me?.isEliminated) {
      gameEndFinalizeTimerRef.current = window.setTimeout(() => {
        gameEndFinalizeTimerRef.current = null;
        if (gameEndFinalizedRef.current) return;
        gameEndFinalizedRef.current = true;
        void continueAfterReveal(roomCode, playerId)
          .then(() => applyFreshState(false))
          .catch(() => {
            gameEndFinalizedRef.current = false;
          });
      }, GAME_END_CARD_VIEW_MS);
    }
  }, [
    isGameEndingReveal,
    room?.roundNumber,
    room?.revealResult?.loserId,
    room?.revealResult,
    roomCode,
    playerId,
    me?.isEliminated,
    applyFreshState,
    translate,
  ]);

  const visiblePlayers = useMemo(() => {
    if (!room) return players;
    return maskPlayersForViewer(players, playerId, room.phase, room.status);
  }, [players, playerId, room]);

  const opponents = visiblePlayers.filter((p) => p.id !== playerId);
  const activePlayers = getActivePlayers(players);
  const turnPlayerId = room?.turnOrder[room.currentTurnIndex] ?? undefined;
  const isMyTurn = turnPlayerId === playerId;
  const isHost = room?.hostId === playerId;
  const showAllCards = Boolean(
    room?.revealResult &&
      room.status !== "finished" &&
      !gameEndDisplay
  );
  const deckCount = room?.deckCount ?? 1;
  const highlightRank = showAllCards && room?.currentBid ? room.currentBid.rank : null;
  const showBidDock = Boolean(
    room?.phase === "bidding" && isMyTurn && me && !me.isEliminated
  );

  const starterName =
    room?.phase === "bidding"
      ? players.find((p) => p.id === room.turnOrder[0])?.name ?? "..."
      : room?.revealResult?.loserName ?? "...";

  const transitionRound = room?.roundNumber ?? 1;

  const currentRevealKey = room?.revealResult
    ? `${room.roundNumber}-${room.revealResult.loserId}`
    : null;

  const showResultOverlay = Boolean(
    currentRevealKey &&
      room?.phase === "revealed" &&
      !showTransition &&
      room.status !== "finished" &&
      !isGameEndingReveal &&
      dismissedRevealKey !== currentRevealKey &&
      room.resolvedRoundNumber !== room.roundNumber
  );

  async function handleBid(count: number, rank: Parameters<typeof placeBid>[4]) {
    if (!me || !room) return;

    setError("");

    try {
      await placeBid(roomCode, playerId, me.name, count, rank);
      await applyFreshState();
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("bidFail"));
    }
  }

  async function handleOpen() {
    if (!me) return;
    try {
      await openChallenge(roomCode, playerId, me.name);
      await applyFreshState();
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("bidOpenFail"));
    }
  }

  async function handleContinue() {
    if (!room?.revealResult) return;

    const revealKey = `${room.roundNumber}-${room.revealResult.loserId}`;

    setLoading(true);
    setError("");
    setDismissedRevealKey(revealKey);
    suppressBotContinueForRound(room.roundNumber);
    skipPhaseTransitionRef.current = true;

    try {
      await continueAfterReveal(roomCode, playerId);

      let fresh = await applyFreshState(false);
      if (fresh.room?.phase === "revealed" && fresh.room.revealResult) {
        await new Promise((resolve) => window.setTimeout(resolve, 350));
        fresh = await applyFreshState(false);
      }

      if (fresh.room?.phase === "bidding") {
        clearBotContinueSuppression();
        startTransition(TRANSITION_MS);
        return;
      }

      if (fresh.room?.resolvedRoundNumber === room.roundNumber) {
        startTransition(TRANSITION_MS);
        return;
      }

      setDismissedRevealKey(null);
      setError(translate("errContinue"));
    } catch (err) {
      setDismissedRevealKey(null);
      clearBotContinueSuppression();
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
      {showLeaveConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowLeaveConfirm(false)}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/15 bg-neutral-900/95 p-6 text-center shadow-2xl">
            <p className="text-lg font-semibold text-white">{translate("leaveGameConfirm")}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 rounded-2xl border border-white/15 bg-white/10 py-3 text-sm font-semibold text-white"
              >
                {translate("leaveGameNo")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  void handleLeave();
                }}
                className="flex-1 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 py-3 text-sm font-bold text-white"
              >
                {translate("leaveGameYes")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {gameEndDisplay && !gameEndDisplay.isDraw && gameEndDisplay.winnerName ? (
        <WinnerOverlay
          winnerName={gameEndDisplay.winnerName}
          isMe={gameEndDisplay.winnerId === playerId}
          onHome={handleLeave}
        />
      ) : null}

      {gameEndDisplay?.isDraw ? <DrawOverlay onHome={handleLeave} /> : null}

      {showResultOverlay && room.revealResult ? (
        <RoundResultOverlay
          result={room.revealResult}
          bidCount={room.currentBid?.count ?? 0}
          isHost={isHost}
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
        players={players}
        playerId={playerId}
        turnPlayerId={turnPlayerId}
        showAllCards={showAllCards}
        highlightRank={highlightRank}
        revealResult={room.revealResult}
        compactDock={showBidDock}
        animateDeal={animateDeal}
        dealKey={`${room.roundNumber}-${room.phase}`}
        onHomeClick={() => setShowLeaveConfirm(true)}
      >
        {showBidDock ? (
          <BidControls
            currentBid={room.currentBid}
            activePlayerCount={activePlayers.length}
            deckCount={deckCount}
            compact
            onBid={handleBid}
            onOpen={handleOpen}
            canOpen={Boolean(room.currentBid)}
          />
        ) : null}

        {error ? <p className="text-center text-xs text-red-300/90">{error}</p> : null}
      </GameTable>
    </>
  );
}

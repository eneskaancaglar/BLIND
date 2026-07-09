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
import { getActivePlayers, getBlindMode, getHandDisplayCount } from "@/lib/gameLogic";
import { Player, Room } from "@/lib/types";
import {
  attachRoomSync,
  continueAfterReveal,
  getPlayerId,
  leaveGame,
  maskPlayersForViewer,
  openChallenge,
  placeBid,
  refreshRoomState,
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
  const [syncState, setSyncState] = useState<{ room: Room | null; players: Player[] }>({
    room: null,
    players: [],
  });
  const room = syncState.room;
  const players = syncState.players;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTransition, setShowTransition] = useState(false);
  const [animateDeal, setAnimateDeal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [revealHighlightDone, setRevealHighlightDone] = useState(false);

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
  const blindMode = room ? getBlindMode(room) : "ORIGINAL_BLIND";

  useEffect(() => {
    setPlayerId(getPlayerId());
    return () => clearTransitionTimer();
  }, [clearTransitionTimer]);

  useEffect(() => {
    if (!roomCode || !isFirebaseConfigured()) return;

    return attachRoomSync(roomCode, {
      onSync: (state) => {
        setSyncState({
          room: state.room,
          players: state.players.map((player) => ({ ...player })),
        });
      },
      onError: (err) => setError(err.message),
    });
  }, [roomCode]);

  const applyFreshState = useCallback(async () => {
    const fresh = await refreshRoomState(roomCode);
    setSyncState({
      room: fresh.room,
      players: fresh.players.map((player) => ({ ...player })),
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
    if (room?.status === "finished" && room.winnerName && !winSoundRef.current) {
      winSoundRef.current = true;
      const iWon = room.winnerId === playerId;
      play(iWon ? "win" : "lose");
    }
  }, [room?.status, room?.winnerId, room?.winnerName, playerId, play]);

  useEffect(() => {
    if (room?.phase === "revealed" && room.revealResult) {
      setRevealHighlightDone(false);
      const timer = window.setTimeout(() => setRevealHighlightDone(true), 2600);
      return () => window.clearTimeout(timer);
    }
    setRevealHighlightDone(false);
  }, [room?.phase, room?.revealResult, room?.roundNumber]);

  const me = players.find((player) => player.id === playerId);
  const visiblePlayers = useMemo(() => {
    if (!room) return players;
    return maskPlayersForViewer(players, playerId, room.phase, room.status);
  }, [players, playerId, room]);

  const opponents = visiblePlayers.filter((p) => p.id !== playerId);
  const activePlayers = getActivePlayers(players);
  const turnPlayerId = room?.turnOrder[room.currentTurnIndex] ?? undefined;
  const isMyTurn = turnPlayerId === playerId;
  const isHost = room?.hostId === playerId;
  const showAllCards = room?.phase === "revealed";
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

  const showResultOverlay = Boolean(
    room?.revealResult &&
      room.phase === "revealed" &&
      revealHighlightDone &&
      !showTransition &&
      room.status !== "finished"
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

    setLoading(true);
    setError("");
    skipPhaseTransitionRef.current = true;
    startTransition(TRANSITION_MS);

    try {
      await continueAfterReveal(roomCode, playerId);
      await applyFreshState();
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
        playerId={playerId}
        turnPlayerId={turnPlayerId}
        showAllCards={showAllCards}
        highlightRank={highlightRank}
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BidControls } from "@/components/BidControls";
import { GameTable } from "@/components/GameTable";
import { RoundResultOverlay } from "@/components/RoundResultOverlay";
import { RoundTransitionOverlay } from "@/components/RoundTransitionOverlay";
import { useLanguage } from "@/context/LanguageContext";
import { useSound } from "@/context/SoundContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getActivePlayers, nextTurnIndex } from "@/lib/gameLogic";
import { Bid, Player, Room } from "@/lib/types";
import {
  attachRoomSync,
  continueAfterReveal,
  getPlayerId,
  maskPlayersForViewer,
  openChallenge,
  placeBid,
} from "@/lib/roomService";

type GameBoardProps = {
  roomCode: string;
  onLeave: () => void;
};

const TRANSITION_MS = 2400;

export function GameBoard({ roomCode, onLeave }: GameBoardProps) {
  const { translate } = useLanguage();
  const { play } = useSound();
  const [playerId, setPlayerId] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTransition, setShowTransition] = useState(false);
  const [manualTransition, setManualTransition] = useState(false);
  const prevPhaseRef = useRef<Room["phase"] | null>(null);
  const skipPhaseTransitionRef = useRef(false);
  const prevRoundRef = useRef(0);
  const [animateDeal, setAnimateDeal] = useState(false);

  useEffect(() => {
    setPlayerId(getPlayerId());
  }, []);

  useEffect(() => {
    if (!roomCode || !isFirebaseConfigured()) return;

    return attachRoomSync(roomCode, {
      onRoom: setRoom,
      onPlayers: setPlayers,
      onError: (err) => setError(err.message),
    });
  }, [roomCode]);

  useEffect(() => {
    if (!room) return;

    const prev = prevPhaseRef.current;
    if (prev === "revealed" && room.phase === "bidding") {
      if (skipPhaseTransitionRef.current) {
        skipPhaseTransitionRef.current = false;
        prevPhaseRef.current = room.phase;
        return;
      }
      setShowTransition(true);
      const timer = window.setTimeout(() => setShowTransition(false), TRANSITION_MS);
      prevPhaseRef.current = room.phase;
      return () => window.clearTimeout(timer);
    }

    prevPhaseRef.current = room.phase;
  }, [room]);

  useEffect(() => {
    if (!room || room.roundNumber <= 0) return;
    if (room.phase !== "bidding") return;
    if (prevRoundRef.current === room.roundNumber) return;

    prevRoundRef.current = room.roundNumber;
    setAnimateDeal(true);
    const timer = window.setTimeout(() => setAnimateDeal(false), 1200);
    return () => window.clearTimeout(timer);
  }, [room?.roundNumber, room?.phase]);

  const revealSoundRef = useRef<string | null>(null);
  const transitionSoundRef = useRef(false);
  const winSoundRef = useRef(false);

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
    const active = showTransition || manualTransition;
    if (active && !transitionSoundRef.current) {
      transitionSoundRef.current = true;
      play("transition");
    }
    if (!active) {
      transitionSoundRef.current = false;
    }
  }, [showTransition, manualTransition, play]);

  useEffect(() => {
    if (room?.status === "finished" && room.winnerName && !winSoundRef.current) {
      winSoundRef.current = true;
      const iWon = room.winnerId === playerId;
      play(iWon ? "win" : "lose");
    }
  }, [room?.status, room?.winnerId, room?.winnerName, playerId, play]);

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

  const starterName =
    room?.revealResult?.loserName ??
    (room?.turnOrder[0]
      ? players.find((p) => p.id === room.turnOrder[0])?.name ?? "..."
      : "...");

  const transitionRound =
    manualTransition && room
      ? room.roundNumber + 1
      : room?.roundNumber ?? 1;

  const showResultOverlay =
    Boolean(room?.revealResult && room.phase === "revealed" && !manualTransition && !showTransition);

  const showTransitionOverlay = manualTransition || showTransition;

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
    setManualTransition(true);
    skipPhaseTransitionRef.current = true;

    try {
      await new Promise((resolve) => window.setTimeout(resolve, TRANSITION_MS));
      await continueAfterReveal(roomCode, playerId);
      setManualTransition(false);
    } catch (err) {
      setManualTransition(false);
      setError(err instanceof Error ? err.message : translate("errContinue"));
    } finally {
      setLoading(false);
    }
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
      {showResultOverlay && room.revealResult ? (
        <RoundResultOverlay
          result={room.revealResult}
          bidCount={room.currentBid?.count ?? 0}
          isHost={isHost}
          loading={loading}
          onContinue={handleContinue}
        />
      ) : null}

      {showTransitionOverlay ? (
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
        {room.status === "finished" && room.winnerName ? (
          <section className="rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-4 text-center">
            <h2 className="text-xl font-bold text-emerald-300">
              {translate("winner", { name: room.winnerName })}
            </h2>
          </section>
        ) : null}

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
          onClick={onLeave}
          className="w-full py-2 text-center text-xs text-neutral-500 underline"
        >
          {translate("home")}
        </button>
      </GameTable>
    </>
  );
}

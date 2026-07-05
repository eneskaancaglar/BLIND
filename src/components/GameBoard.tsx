"use client";

import { useEffect, useMemo, useState } from "react";
import { BidControls } from "@/components/BidControls";
import { GameTable } from "@/components/GameTable";
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

export function GameBoard({ roomCode, onLeave }: GameBoardProps) {
  const [playerId, setPlayerId] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError(err instanceof Error ? err.message : "İddia verilemedi.");
    }
  }

  async function handleOpen() {
    if (!me) return;
    await openChallenge(roomCode, playerId, me.name);
  }

  async function handleContinue() {
    setLoading(true);
    setError("");
    try {
      await continueAfterReveal(roomCode, playerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Devam edilemedi.");
    } finally {
      setLoading(false);
    }
  }

  if (!room) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#061208]">
        <p className="text-emerald-200/50">Masa kuruluyor...</p>
      </main>
    );
  }

  return (
    <GameTable
      room={room}
      roomCode={roomCode}
      me={me}
      opponents={opponents}
      playerId={playerId}
      turnPlayerId={turnPlayerId}
      showAllCards={showAllCards}
    >
      {room.status === "finished" && room.winnerName ? (
        <section className="rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-4 text-center">
          <h2 className="text-xl font-bold text-emerald-300">Kazanan: {room.winnerName}</h2>
        </section>
      ) : null}

      {room.revealResult && room.phase === "revealed" ? (
        <section className="rounded-2xl border border-red-500/30 bg-red-950/50 p-4 text-center text-sm">
          <p className="text-neutral-200">{room.revealResult.reason}</p>
          <p className="mt-2 text-lg font-bold text-white">
            Sayım: {room.revealResult.actualCount}
          </p>
          <p className="mt-1 text-red-300">Kaybeden: {room.revealResult.loserName}</p>
          {room.revealResult.blindRevivalName ? (
            <p className="mt-3 rounded-xl bg-violet-500/20 px-3 py-2 text-violet-100">
              {room.revealResult.blindRevivalName} 5 kartla oyuna dönüyor!
              <br />
              {room.revealResult.openerName} +1 kart cezası aldı.
            </p>
          ) : null}
          {isHost ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleContinue}
              className="mt-3 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white"
            >
              Sonraki El
            </button>
          ) : (
            <p className="mt-2 text-xs text-neutral-400">Kurucu devam ettirecek...</p>
          )}
        </section>
      ) : null}

      {room.phase === "bidding" && isMyTurn && me && !me.isEliminated ? (
        <BidControls
          currentBid={room.currentBid}
          activePlayerCount={activePlayers.length}
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
        Ana sayfa
      </button>
    </GameTable>
  );
}

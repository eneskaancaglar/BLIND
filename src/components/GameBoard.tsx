"use client";

import { useEffect, useMemo, useState } from "react";
import { BidControls } from "@/components/BidControls";
import { PlayerCardsRow, PlayerList } from "@/components/PlayerList";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getActivePlayers } from "@/lib/gameLogic";
import { Player, Room } from "@/lib/types";
import {
  continueAfterReveal,
  getPlayerId,
  maskPlayersForViewer,
  openChallenge,
  placeBid,
  subscribeToPlayers,
  subscribeToRoom,
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

    const unsubRoom = subscribeToRoom(roomCode, setRoom);
    const unsubPlayers = subscribeToPlayers(roomCode, setPlayers);

    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [roomCode]);

  const me = players.find((player) => player.id === playerId);
  const visiblePlayers = useMemo(() => {
    if (!room) return players;
    return maskPlayersForViewer(players, playerId, room.phase, room.status);
  }, [players, playerId, room]);

  const activePlayers = getActivePlayers(players);
  const turnPlayerId = room?.turnOrder[room.currentTurnIndex] ?? undefined;
  const isMyTurn = turnPlayerId === playerId;
  const isHost = room?.hostId === playerId;
  const showAllCards = room?.phase === "revealed";

  async function handleBid(count: number, rank: Parameters<typeof placeBid>[4]) {
    if (!me) return;
    await placeBid(roomCode, playerId, me.name, count, rank);
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
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
        <p className="text-neutral-400">Oyun yükleniyor...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Oda {roomCode}</p>
            <h1 className="text-2xl font-bold">BLIND</h1>
          </div>
          <div className="text-right text-sm text-neutral-400">
            <p>El {room.roundNumber}</p>
            <p>
              {room.status === "finished"
                ? "Bitti"
                : room.phase === "revealed"
                  ? "Açıldı"
                  : "İddia"}
            </p>
          </div>
        </div>
      </header>

      {room.status === "finished" && room.winnerName ? (
        <section className="mb-6 rounded-3xl border border-green-500/40 bg-green-500/10 p-5 text-center">
          <h2 className="text-2xl font-bold text-green-300">Oyun Bitti!</h2>
          <p className="mt-2 text-lg">Kazanan: {room.winnerName}</p>
        </section>
      ) : null}

      {room.revealResult && room.phase === "revealed" ? (
        <section className="mb-6 space-y-3 rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
          <h2 className="text-lg font-semibold">Sonuç</h2>
          <p className="text-sm text-neutral-200">{room.revealResult.reason}</p>
          <p className="text-sm">
            Gerçek sayım:{" "}
            <span className="font-semibold text-white">{room.revealResult.actualCount}</span>
          </p>
          <p className="text-sm">
            Kaybeden:{" "}
            <span className="font-semibold text-red-300">{room.revealResult.loserName}</span>
          </p>
          {isHost ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleContinue}
              className="mt-2 w-full rounded-2xl bg-green-600 px-4 py-4 text-lg font-semibold text-white hover:bg-green-500"
            >
              Sonraki El
            </button>
          ) : (
            <p className="text-sm text-neutral-400">Kurucu sonraki eli başlatacak...</p>
          )}
        </section>
      ) : null}

      {room.currentBid && room.phase === "bidding" ? (
        <section className="mb-4 rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3">
          <p className="text-sm text-neutral-400">Güncel iddia</p>
          <p className="text-lg font-semibold">
            {room.currentBid.count} tane {room.currentBid.rank} — {room.currentBid.playerName}
          </p>
        </section>
      ) : null}

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Kartların</h2>
        {me ? (
          <PlayerCardsRow player={me} isMe showAll={showAllCards} />
        ) : (
          <p className="text-neutral-400">Oyuncu bilgisi bulunamadı.</p>
        )}
        {me?.isBlind && !showAllCards ? (
          <p className="mt-2 text-sm text-amber-300">BLIND modundasın — kartlarını göremezsin.</p>
        ) : null}
      </section>

      {room.phase === "bidding" && isMyTurn && me && !me.isEliminated ? (
        <section className="mb-6">
          <BidControls
            currentBid={room.currentBid}
            activePlayerCount={activePlayers.length}
            onBid={handleBid}
            onOpen={handleOpen}
            canOpen={Boolean(room.currentBid)}
          />
        </section>
      ) : room.phase === "bidding" ? (
        <section className="mb-6 rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-4 text-center text-neutral-400">
          Sıra: {players.find((p) => p.id === turnPlayerId)?.name ?? "..."}
        </section>
      ) : null}

      <section className="mb-6 space-y-3">
        <h2 className="text-lg font-semibold">
          {showAllCards ? "Herkesin Kartları" : "Masadakiler"}
        </h2>
        {visiblePlayers
          .filter((player) => player.id !== playerId)
          .map((player) => (
            <PlayerCardsRow
              key={player.id}
              player={player}
              isMe={false}
              showAll={showAllCards}
            />
          ))}
      </section>

      <section className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-5">
        <h2 className="mb-3 text-lg font-semibold">Oyuncular</h2>
        <PlayerList
          players={players}
          currentPlayerId={playerId}
          hostId={room.hostId}
          turnPlayerId={turnPlayerId}
        />
      </section>

      {error ? <p className="mt-4 text-center text-sm text-red-400">{error}</p> : null}

      <button
        type="button"
        onClick={onLeave}
        className="mt-8 block w-full text-center text-sm text-neutral-500 underline"
      >
        Ana sayfa
      </button>
    </main>
  );
}

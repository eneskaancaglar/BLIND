"use client";

import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PlayerList } from "@/components/PlayerList";
import { useLanguage } from "@/context/LanguageContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { t } from "@/lib/i18n";
import { Player, Room } from "@/lib/types";
import {
  buildJoinLink,
  getPlayerId,
  startGame,
  attachRoomSync,
} from "@/lib/roomService";

type RoomLobbyProps = {
  roomCode: string;
  onGameStarted: () => void;
  onLeave: () => void;
};

export function RoomLobby({ roomCode, onGameStarted, onLeave }: RoomLobbyProps) {
  const { translate, language } = useLanguage();
  const [playerId, setPlayerId] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [syncState, setSyncState] = useState<{ room: Room | null; players: Player[] }>({
    room: null,
    players: [],
  });
  const room = syncState.room;
  const players = syncState.players;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPlayerId(getPlayerId());
    setShareLink(buildJoinLink(roomCode));
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode || !isFirebaseConfigured()) return;

    const detach = attachRoomSync(roomCode, {
      onSync: ({ room: nextRoom, players: nextPlayers }) => {
        if (!nextRoom) {
          setError(t(language, "lobbyNotFound"));
          return;
        }
        setSyncState({ room: nextRoom, players: nextPlayers });
        if (nextRoom.status === "playing" || nextRoom.status === "finished") {
          onGameStarted();
        }
      },
      onError: (err) => setError(err.message),
    });

    return detach;
  }, [roomCode, onGameStarted, language]);

  async function copyShareLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(translate("lobbyCopyFail"));
    }
  }

  async function handleStart() {
    setLoading(true);
    setError("");
    try {
      await startGame(roomCode, playerId);
      onGameStarted();
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("lobbyStarting"));
    } finally {
      setLoading(false);
    }
  }

  const isHost = room?.hostId === playerId;
  const deckCount = room?.deckCount ?? 1;
  const blindThreshold = room?.blindThreshold ?? 6;
  const blindGetsCards = room?.blindGetsCards ?? false;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-8">
      <div className="mb-4 flex justify-end">
        <LanguageSwitcher />
      </div>

      <div className="mb-8 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
          {translate("lobbyRoom")}
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[0.2em]">{roomCode}</h1>
        <p className="mt-2 text-neutral-400">{translate("lobbyShare")}</p>
      </div>

      <section className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="mb-2 text-sm font-semibold text-amber-200">{translate("lobbySettings")}</p>
        <div className="flex flex-wrap gap-2 text-sm text-amber-100/90">
          <span className="rounded-full bg-black/30 px-3 py-1">
            {translate("lobbyDeck", { count: deckCount })}
          </span>
          <span className="rounded-full bg-black/30 px-3 py-1">
            {translate("lobbyBlindAt", { count: blindThreshold })}
          </span>
          <span className="rounded-full bg-black/30 px-3 py-1">
            {translate("lobbyBlindCards", {
              value: blindGetsCards ? translate("blindGetsCardsYes") : translate("blindGetsCardsNo"),
            })}
          </span>
        </div>
      </section>

      <section className="mb-6 rounded-3xl border border-green-500/30 bg-green-500/10 p-4">
        <p className="mb-2 text-sm font-semibold text-green-200">{translate("lobbyLink")}</p>
        <p className="mb-3 break-all text-xs text-green-100/80">{shareLink}</p>
        <button
          type="button"
          onClick={copyShareLink}
          className="w-full rounded-2xl bg-green-600 px-4 py-3 text-base font-semibold text-white"
        >
          {copied ? translate("lobbyCopied") : translate("lobbyCopy")}
        </button>
      </section>

      <section className="mb-6 rounded-3xl border border-neutral-800 bg-neutral-900/80 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{translate("lobbyPlayers")}</h2>
          <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm">
            {translate("lobbyPlayerCount", { count: players.length })}
          </span>
        </div>
        <PlayerList players={players} currentPlayerId={playerId} hostId={room?.hostId} />
      </section>

      {isHost ? (
        <button
          type="button"
          disabled={loading || players.length < 2 || room?.status !== "waiting"}
          onClick={handleStart}
          className="w-full rounded-2xl bg-green-600 px-4 py-4 text-lg font-semibold text-white transition hover:bg-green-500 disabled:opacity-50"
        >
          {loading ? translate("lobbyStarting") : translate("lobbyStart")}
        </button>
      ) : (
        <div className="rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-4 text-center text-neutral-400">
          {translate("lobbyWaitHost")}
        </div>
      )}

      {players.length < 2 ? (
        <p className="mt-3 text-center text-sm text-amber-300">{translate("lobbyMinPlayers")}</p>
      ) : null}

      {error ? <p className="mt-3 text-center text-sm text-red-400">{error}</p> : null}

      <button
        type="button"
        onClick={onLeave}
        className="mt-8 block w-full text-center text-sm text-neutral-500 underline"
      >
        {translate("home")}
      </button>
    </main>
  );
}

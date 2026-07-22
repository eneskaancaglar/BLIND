"use client";

import { useEffect, useRef, useState } from "react";
import { HomeFloatingCards } from "@/components/HomeFloatingCards";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PlayerList } from "@/components/PlayerList";
import { SoundToggle } from "@/components/SoundToggle";
import { useLanguage } from "@/context/LanguageContext";
import { getBlindMode } from "@/lib/gameLogic";
import { isFirebaseConfigured } from "@/lib/firebase";
import { t } from "@/lib/i18n";
import { Player, Room } from "@/lib/types";
import {
  buildJoinLink,
  getPlayerId,
  startGame,
  attachRoomSync,
  refreshRoomState,
  stashRoomBootstrap,
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
  const onGameStartedRef = useRef(onGameStarted);

  useEffect(() => {
    onGameStartedRef.current = onGameStarted;
  }, [onGameStarted]);

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
        setSyncState({
          room: nextRoom,
          players: nextPlayers.map((player) => ({ ...player })),
        });
        if (nextRoom.status === "playing" || nextRoom.status === "finished") {
          stashRoomBootstrap(roomCode, { room: nextRoom, players: nextPlayers });
          onGameStartedRef.current();
        }
      },
      onError: (err) => setError(err.message),
    });

    return detach;
  }, [roomCode, language]);

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
      const fresh = await refreshRoomState(roomCode, { preferCache: true });
      if (fresh.room) {
        stashRoomBootstrap(roomCode, fresh);
        setSyncState({
          room: fresh.room,
          players: fresh.players.map((player) => ({ ...player })),
        });
      }
      onGameStartedRef.current();
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("lobbyStarting"));
    } finally {
      setLoading(false);
    }
  }

  const isHost = room?.hostId === playerId;
  const deckCount = room?.deckCount ?? 1;
  const blindThreshold = room?.blindThreshold ?? 6;
  const blindMode = room ? getBlindMode(room) : "ORIGINAL_BLIND";

  return (
    <main className="home-shell relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-0 pt-10">
      <HomeFloatingCards />

      <div className="relative z-10 flex flex-1 flex-col gap-5">
        <header className="home-brand-wrap">
          <span className="home-brand-line" aria-hidden />
          <h1 className="home-brand-title">BLIND</h1>
          <p className="home-brand-tagline">{translate("homeTagline")}</p>
          <span className="home-brand-line" aria-hidden />
        </header>

        <div className="home-panel space-y-3 rounded-3xl p-5 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            {translate("lobbyRoom")}
          </p>
          <p className="text-3xl font-light tracking-[0.35em] text-white">{roomCode}</p>
          <p className="text-sm text-slate-400">{translate("lobbyShare")}</p>
        </div>

        <section className="home-panel-light space-y-3 rounded-2xl p-4">
          <p className="text-sm font-medium text-slate-200/90">{translate("lobbySettings")}</p>
          <div className="flex flex-wrap gap-2">
            <span className="home-chip rounded-full px-3 py-1.5 text-xs font-semibold">
              {translate("lobbyDeck", { count: deckCount })}
            </span>
            <span className="home-chip rounded-full px-3 py-1.5 text-xs font-semibold">
              {translate("lobbyBlindAt", { count: blindThreshold })}
            </span>
            <span className="home-chip rounded-full px-3 py-1.5 text-xs font-semibold">
              {blindMode === "HIDDEN_CARDS_BLIND"
                ? translate("blindModeHidden")
                : translate("blindModeOriginal")}
            </span>
          </div>
        </section>

        <section className="home-panel space-y-3 rounded-3xl p-5">
          <p className="text-sm font-medium text-slate-300">{translate("lobbyLink")}</p>
          <p className="break-all text-xs text-slate-400">{shareLink}</p>
          <button
            type="button"
            onClick={copyShareLink}
            className="home-btn-join w-full rounded-xl py-3 text-base font-semibold"
          >
            {copied ? translate("lobbyCopied") : translate("lobbyCopy")}
          </button>
        </section>

        <section className="home-panel space-y-4 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300">{translate("lobbyPlayers")}</h2>
            <span className="home-chip rounded-full px-3 py-1 text-xs font-semibold">
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
            className="home-btn-start w-full rounded-2xl py-3.5 text-base font-semibold disabled:opacity-50"
          >
            {loading ? translate("lobbyStarting") : translate("lobbyStart")}
          </button>
        ) : (
          <div className="home-panel-light rounded-2xl px-4 py-4 text-center text-sm text-slate-400">
            {translate("lobbyWaitHost")}
          </div>
        )}

        {players.length < 2 ? (
          <p className="text-center text-sm text-slate-400">{translate("lobbyMinPlayers")}</p>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-400/25 bg-red-950/30 p-3 text-center text-sm text-red-200/90">
            {error}
          </div>
        ) : null}

        <footer className="home-footer-bar">
          <button type="button" onClick={onLeave} className="home-footer-btn">
            {translate("home")}
          </button>
          <LanguageSwitcher footer />
          <SoundToggle footer />
        </footer>
      </div>
    </main>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GameBoard } from "@/components/GameBoard";
import { HomeFloatingCards } from "@/components/HomeFloatingCards";
import { HowToPlayModal } from "@/components/HowToPlayModal";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SoundToggle } from "@/components/SoundToggle";
import { RoomLobby } from "@/components/RoomLobby";
import { useLanguage } from "@/context/LanguageContext";
import { useSound } from "@/context/SoundContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { DEFAULT_ROOM_SETTINGS, type RoomSettings } from "@/lib/i18n";
import { resumeAudio } from "@/lib/sounds";
import {
  clearStoredRoomCode,
  createRoom,
  getRoomTargetPath,
  getStoredPlayerName,
  joinRoom,
  restoreSession,
  setStoredPlayerName,
} from "@/lib/roomService";

type Screen = "home" | "lobby" | "game";

function RoomSettingsPanel({
  roomSettings,
  setRoomSettings,
  play,
}: {
  roomSettings: RoomSettings;
  setRoomSettings: React.Dispatch<React.SetStateAction<RoomSettings>>;
  play: (sound: "click") => void;
}) {
  const { translate } = useLanguage();

  return (
    <div className="home-panel-light space-y-4 rounded-2xl p-4">
      <p className="text-sm font-semibold text-violet-100">{translate("lobbySettings")}</p>

      <div>
        <p className="mb-2 text-xs text-violet-200/70">{translate("deckCount")}</p>
        <div className="grid grid-cols-2 gap-2">
          {([1, 2] as const).map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => {
                play("click");
                setRoomSettings((s) => ({ ...s, deckCount: count }));
              }}
              className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                roomSettings.deckCount === count
                  ? "bg-fuchsia-600 text-white"
                  : "bg-black/30 text-violet-200/80 hover:bg-black/50"
              }`}
            >
              {count === 1 ? translate("deckSingle") : translate("deckDouble")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-violet-200/70">{translate("blindThreshold")}</p>
        <div className="grid grid-cols-3 gap-2">
          {([5, 6, 7] as const).map((threshold) => (
            <button
              key={threshold}
              type="button"
              onClick={() => {
                play("click");
                setRoomSettings((s) => ({ ...s, blindThreshold: threshold }));
              }}
              className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                roomSettings.blindThreshold === threshold
                  ? "bg-amber-500 text-amber-950"
                  : "bg-black/30 text-violet-200/80 hover:bg-black/50"
              }`}
            >
              {translate("blindThresholdCards", { count: threshold })}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-violet-200/70">{translate("blindGetsCards")}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              play("click");
              setRoomSettings((s) => ({ ...s, blindGetsCards: false }));
            }}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${
              !roomSettings.blindGetsCards
                ? "bg-violet-600 text-white"
                : "bg-black/30 text-violet-200/80 hover:bg-black/50"
            }`}
          >
            {translate("blindGetsCardsNo")}
          </button>
          <button
            type="button"
            onClick={() => {
              play("click");
              setRoomSettings((s) => ({ ...s, blindGetsCards: true }));
            }}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${
              roomSettings.blindGetsCards
                ? "bg-violet-600 text-white"
                : "bg-black/30 text-violet-200/80 hover:bg-black/50"
            }`}
          >
            {translate("blindGetsCardsYes")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomeClient() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("room")?.toUpperCase() ?? "";
  const { translate } = useLanguage();
  const { play } = useSound();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState<Screen>("home");
  const [activeRoomCode, setActiveRoomCode] = useState("");
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showCreateSetup, setShowCreateSetup] = useState(false);
  const [roomSettings, setRoomSettings] = useState<RoomSettings>(DEFAULT_ROOM_SETTINGS);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    setMounted(true);
    setFirebaseReady(isFirebaseConfigured());
    setName(getStoredPlayerName());
    if (inviteCode) {
      setRoomCode(inviteCode);
    }
  }, [inviteCode]);

  useEffect(() => {
    if (!mounted || !firebaseReady || inviteCode) {
      if (!inviteCode) setRestoring(false);
      return;
    }

    void (async () => {
      try {
        const session = await restoreSession();
        if (session) {
          setActiveRoomCode(session.code);
          setScreen(session.screen);
        }
      } finally {
        setRestoring(false);
      }
    })();
  }, [mounted, firebaseReady, inviteCode]);

  const goHome = useCallback(() => {
    clearStoredRoomCode();
    setScreen("home");
    setActiveRoomCode("");
    setShowCreateSetup(false);
    setError("");
  }, []);

  const goGame = useCallback(() => {
    setScreen("game");
  }, []);

  function clickButton(action: () => void) {
    resumeAudio();
    play("click");
    action();
  }

  async function enterRoom(code: string, startScreen: Screen) {
    setActiveRoomCode(code);
    setScreen(startScreen);
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError(translate("errNameRequired"));
      return;
    }
    if (!firebaseReady) {
      setError(translate("errFirebase"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const code = await createRoom(name.trim(), roomSettings);
      await enterRoom(code, "lobby");
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("errCreateRoom"));
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(event?: FormEvent) {
    event?.preventDefault();

    if (!name.trim()) {
      setError(translate("errNameRequired"));
      return;
    }
    if (!roomCode.trim()) {
      setError(translate("errCodeRequired"));
      return;
    }
    if (!firebaseReady) {
      setError(translate("errFirebase"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      setStoredPlayerName(name.trim());
      const code = roomCode.trim().toUpperCase();
      await joinRoom(code, name.trim());
      const target = await getRoomTargetPath(code);
      const startScreen: Screen = target?.includes("/game/") ? "game" : "lobby";
      await enterRoom(code, startScreen);
    } catch (err) {
      setError(err instanceof Error ? err.message : translate("errJoinRoom"));
    } finally {
      setLoading(false);
    }
  }

  if (screen === "lobby" && activeRoomCode) {
    return (
      <RoomLobby
        roomCode={activeRoomCode}
        onGameStarted={goGame}
        onLeave={goHome}
      />
    );
  }

  if (screen === "game" && activeRoomCode) {
    return <GameBoard roomCode={activeRoomCode} onLeave={goHome} />;
  }

  if (!mounted || restoring) {
    return (
      <main className="home-shell relative flex min-h-[100dvh] items-center justify-center px-4">
        <HomeFloatingCards />
        <p className="relative z-10 text-violet-200/60">{translate("loading")}</p>
      </main>
    );
  }

  return (
    <>
      <HowToPlayModal open={showRules} onClose={() => setShowRules(false)} />

      <main className="home-shell relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-4 px-4 py-6">
        <HomeFloatingCards />

        <div className="relative z-10 text-center">
          <h1 className="bg-gradient-to-r from-white via-fuchsia-100 to-cyan-200 bg-clip-text text-6xl font-black tracking-tight text-transparent drop-shadow-sm">
            BLIND
          </h1>
        </div>

        <label className="home-panel-light relative z-10 block space-y-2 rounded-2xl p-4">
          <span className="text-sm font-medium text-violet-100">{translate("playerName")}</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder={translate("playerNamePlaceholder")}
            className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3.5 text-lg text-white outline-none focus:border-fuchsia-400/60"
          />
        </label>

        {inviteCode ? (
          <div className="relative z-10 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-4 text-center text-sm text-emerald-100">
            <p className="font-semibold">{translate("invitedToRoom", { code: inviteCode })}</p>
          </div>
        ) : null}

        {!firebaseReady ? (
          <div className="relative z-10 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3 text-center text-sm text-amber-100">
            {translate("firebaseMissing")}
          </div>
        ) : null}

        {error ? (
          <div className="relative z-10 rounded-2xl border border-red-400/40 bg-red-500/15 p-3 text-center text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="home-panel relative z-10 space-y-4 rounded-3xl p-5 shadow-xl">
          <form onSubmit={handleJoin} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-violet-100">{translate("roomCode")}</span>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder={translate("roomCodePlaceholder")}
                maxLength={6}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3.5 text-center text-xl tracking-[0.35em] text-white outline-none placeholder:tracking-[0.35em] focus:border-cyan-400/60"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !firebaseReady}
              onClick={() => {
                resumeAudio();
                play("click");
              }}
              className="w-full rounded-xl border border-cyan-400/40 bg-cyan-500/15 py-3.5 text-lg font-bold text-cyan-50 disabled:opacity-50"
            >
              {loading
                ? translate("wait")
                : inviteCode
                  ? translate("joinRoomInvite", { code: inviteCode })
                  : translate("joinRoom")}
            </button>
          </form>
        </div>

        <div className="relative z-10 space-y-3">
          {!showCreateSetup ? (
            <button
              type="button"
              disabled={loading || !firebaseReady}
              onClick={() => clickButton(() => setShowCreateSetup(true))}
              className="home-panel w-full rounded-2xl bg-gradient-to-r from-fuchsia-500/90 to-violet-600/90 py-3.5 text-lg font-bold text-white shadow-lg shadow-fuchsia-900/25 disabled:opacity-50"
            >
              {translate("createRoom")}
            </button>
          ) : (
            <div className="space-y-3">
              <RoomSettingsPanel
                roomSettings={roomSettings}
                setRoomSettings={setRoomSettings}
                play={play}
              />
              <button
                type="button"
                disabled={loading || !firebaseReady}
                onClick={() => clickButton(() => void handleCreate())}
                className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 py-3.5 text-lg font-bold text-white shadow-lg shadow-fuchsia-900/30 disabled:opacity-50"
              >
                {loading ? translate("wait") : translate("startRoom")}
              </button>
              <button
                type="button"
                onClick={() => clickButton(() => setShowCreateSetup(false))}
                className="w-full py-2 text-center text-sm text-violet-200/70 underline"
              >
                {translate("close")}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => clickButton(() => setShowRules(true))}
          className="relative z-10 w-full rounded-2xl border border-cyan-400/25 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
        >
          {translate("howToPlay")}
        </button>

        <div className="relative z-10 mt-auto flex items-center justify-center gap-2 pb-1">
          <LanguageSwitcher compact />
          <SoundToggle compact />
        </div>
      </main>
    </>
  );
}

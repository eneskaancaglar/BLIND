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
      <p className="text-sm font-medium text-slate-200/90">{translate("lobbySettings")}</p>

      <div>
        <p className="mb-2 text-xs text-slate-400">{translate("deckCount")}</p>
        <div className="grid grid-cols-2 gap-2">
          {([1, 2] as const).map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => {
                play("click");
                setRoomSettings((s) => ({ ...s, deckCount: count }));
              }}
              className={`home-chip rounded-xl py-2.5 text-sm font-semibold ${
                roomSettings.deckCount === count ? "home-chip-active" : ""
              }`}
            >
              {count === 1 ? translate("deckSingle") : translate("deckDouble")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-slate-400">{translate("blindThreshold")}</p>
        <div className="grid grid-cols-3 gap-2">
          {([5, 6, 7] as const).map((threshold) => (
            <button
              key={threshold}
              type="button"
              onClick={() => {
                play("click");
                setRoomSettings((s) => ({ ...s, blindThreshold: threshold }));
              }}
              className={`home-chip rounded-xl py-2.5 text-sm font-semibold ${
                roomSettings.blindThreshold === threshold ? "home-chip-active" : ""
              }`}
            >
              {translate("blindThresholdCards", { count: threshold })}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-slate-400">{translate("blindGetsCards")}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              play("click");
              setRoomSettings((s) => ({ ...s, blindMode: "ORIGINAL_BLIND" }));
            }}
            className={`home-chip rounded-xl py-2.5 text-sm font-semibold ${
              roomSettings.blindMode === "ORIGINAL_BLIND" ? "home-chip-active" : ""
            }`}
          >
            {translate("blindModeOriginal")}
          </button>
          <button
            type="button"
            onClick={() => {
              play("click");
              setRoomSettings((s) => ({ ...s, blindMode: "HIDDEN_CARDS_BLIND" }));
            }}
            className={`home-chip rounded-xl py-2.5 text-sm font-semibold ${
              roomSettings.blindMode === "HIDDEN_CARDS_BLIND" ? "home-chip-active" : ""
            }`}
          >
            {translate("blindModeHidden")}
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
    if (!mounted) return;

    if (inviteCode || !firebaseReady) {
      setRestoring(false);
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

      <main className="home-shell relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-0 pt-10">
        <HomeFloatingCards />

        <div className="relative z-10 flex flex-1 flex-col gap-5">
          <header className="home-brand-wrap">
            <span className="home-brand-line" aria-hidden />
            <h1 className="home-brand-title">BLIND</h1>
            <p className="home-brand-tagline">{translate("homeTagline")}</p>
            <span className="home-brand-line" aria-hidden />
          </header>

          <div className="mt-2 space-y-5">
        <label className="home-panel-light block space-y-2 rounded-2xl p-4">
          <span className="text-sm font-medium text-slate-300">{translate("playerName")}</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder={translate("playerNamePlaceholder")}
            className="home-input w-full rounded-xl px-4 py-3.5 text-lg text-white outline-none"
          />
        </label>

        {inviteCode ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-slate-200">
            <p className="font-semibold">{translate("invitedToRoom", { code: inviteCode })}</p>
          </div>
        ) : null}

        {!firebaseReady ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-sm text-slate-300">
            {translate("firebaseMissing")}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-400/25 bg-red-950/30 p-3 text-center text-sm text-red-200/90">
            {error}
          </div>
        ) : null}

        <div className="home-panel space-y-4 rounded-3xl p-5">
          <form onSubmit={handleJoin} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">{translate("roomCode")}</span>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder={translate("roomCodePlaceholder")}
                maxLength={6}
                className="home-input w-full rounded-xl px-4 py-3.5 text-center text-xl tracking-[0.35em] text-white outline-none placeholder:tracking-[0.35em]"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !firebaseReady}
              onClick={() => {
                resumeAudio();
                play("click");
              }}
              className="home-btn-join w-full rounded-xl py-3.5 text-base font-semibold disabled:opacity-50"
            >
              {loading
                ? translate("wait")
                : inviteCode
                  ? translate("joinRoomInvite", { code: inviteCode })
                  : translate("joinRoom")}
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {!showCreateSetup ? (
            <button
              type="button"
              disabled={loading || !firebaseReady}
              onClick={() => clickButton(() => setShowCreateSetup(true))}
              className="home-btn-create w-full rounded-2xl py-3.5 text-base font-semibold disabled:opacity-50"
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
                className="home-btn-start w-full rounded-xl py-3.5 text-base font-semibold disabled:opacity-50"
              >
                {loading ? translate("wait") : translate("startRoom")}
              </button>
              <button
                type="button"
                onClick={() => clickButton(() => setShowCreateSetup(false))}
                className="w-full py-2 text-center text-sm text-slate-400 underline"
              >
                {translate("close")}
              </button>
            </div>
          )}
        </div>
          </div>
        </div>

        <footer className="home-footer-bar relative z-10">
          <button
            type="button"
            onClick={() => clickButton(() => setShowRules(true))}
            className="home-footer-btn"
          >
            {translate("howToPlay")}
          </button>
          <LanguageSwitcher footer />
          <SoundToggle footer />
        </footer>
      </main>
    </>
  );
}

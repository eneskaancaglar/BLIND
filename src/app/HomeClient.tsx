"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GameBoard } from "@/components/GameBoard";
import { HowToPlayModal } from "@/components/HowToPlayModal";
import { PlayingCard } from "@/components/PlayingCard";
import { RoomLobby } from "@/components/RoomLobby";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  createRoom,
  getRoomTargetPath,
  getStoredPlayerName,
  joinRoom,
  setStoredPlayerName,
} from "@/lib/roomService";

type Screen = "home" | "lobby" | "game";

export default function HomeClient() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("room")?.toUpperCase() ?? "";

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState<Screen>("home");
  const [activeRoomCode, setActiveRoomCode] = useState("");
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFirebaseReady(isFirebaseConfigured());
    setName(getStoredPlayerName());
    if (inviteCode) {
      setRoomCode(inviteCode);
    }
  }, [inviteCode]);

  const goHome = useCallback(() => {
    setScreen("home");
    setActiveRoomCode("");
    setError("");
  }, []);

  const goGame = useCallback(() => {
    setScreen("game");
  }, []);

  async function enterRoom(code: string, startScreen: Screen) {
    setActiveRoomCode(code);
    setScreen(startScreen);
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError("Önce oyuncu adını yazman lazım.");
      return;
    }
    if (!firebaseReady) {
      setError("Firebase ayarları yüklenemedi.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const code = await createRoom(name.trim());
      await enterRoom(code, "lobby");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Oda kurulamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(event?: FormEvent) {
    event?.preventDefault();

    if (!name.trim()) {
      setError("Önce oyuncu adını yazman lazım.");
      return;
    }
    if (!roomCode.trim()) {
      setError("Oda kodunu yazman lazım.");
      return;
    }
    if (!firebaseReady) {
      setError("Firebase ayarları yüklenemedi.");
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
      setError(err instanceof Error ? err.message : "Odaya katılınamadı.");
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

  if (!mounted) {
    return (
      <main className="home-shell flex min-h-[100dvh] items-center justify-center px-4">
        <p className="text-violet-200/60">Yükleniyor...</p>
      </main>
    );
  }

  return (
    <>
      <HowToPlayModal open={showRules} onClose={() => setShowRules(false)} />

      <main className="home-shell mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 py-8">
        {/* Dekoratif kartlar */}
        <div className="home-card-deco pointer-events-none relative mx-auto mb-6 h-24 w-full max-w-xs">
          <PlayingCard
            card={{ rank: "A", suit: "H" }}
            size="md"
            tilt="hand"
            className="absolute left-4 top-2"
            style={{ transform: "rotate(-18deg)", zIndex: 1 }}
          />
          <PlayingCard
            card={{ rank: "K", suit: "S" }}
            size="md"
            tilt="hand"
            className="absolute left-1/2 top-0 -translate-x-1/2"
            style={{ zIndex: 3 }}
          />
          <PlayingCard
            card={{ rank: "7", suit: "D" }}
            size="md"
            tilt="hand"
            className="absolute right-4 top-2"
            style={{ transform: "rotate(18deg)", zIndex: 2 }}
          />
        </div>

        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-fuchsia-300/80">
            Kart Oyunu
          </p>
          <h1 className="bg-gradient-to-r from-white via-fuchsia-100 to-cyan-200 bg-clip-text text-5xl font-black tracking-tight text-transparent">
            BLIND
          </h1>
          <p className="mt-3 text-sm text-violet-200/70">
            Oda kur, kodu paylaş, telefondan oyna.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRules(true)}
          className="mb-5 w-full rounded-2xl border border-cyan-400/40 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
        >
          Nasıl Oynanır?
        </button>

        {inviteCode ? (
          <div className="mb-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-4 text-center text-sm text-emerald-100">
            <p className="font-semibold">{inviteCode} odasına davet edildin</p>
          </div>
        ) : null}

        {!firebaseReady ? (
          <div className="mb-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3 text-center text-sm text-amber-100">
            Firebase bağlantısı yok — .env.local kontrol et
          </div>
        ) : (
          <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-2 text-center text-xs text-emerald-200">
            Bağlantı hazır
          </div>
        )}

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-400/40 bg-red-500/15 p-3 text-center text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="home-panel space-y-5 rounded-3xl p-6 shadow-xl">
          <label className="block space-y-2">
            <span className="text-sm text-violet-200/80">Oyuncu Adı</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="Adınız"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-lg text-white outline-none focus:border-fuchsia-400/60"
            />
          </label>

          <button
            type="button"
            disabled={loading || !firebaseReady}
            onClick={handleCreate}
            className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 py-4 text-lg font-bold text-white shadow-lg shadow-fuchsia-900/30 disabled:opacity-50"
          >
            {loading ? "Bekle..." : "Oda Kur"}
          </button>

          <div className="relative py-1 text-center">
            <span className="relative z-10 bg-transparent px-3 text-xs text-violet-300/50">
              veya
            </span>
            <div className="absolute inset-x-0 top-1/2 border-t border-white/10" />
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-violet-200/80">Oda Kodu</span>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="AB3K9"
                maxLength={6}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-center text-xl tracking-[0.3em] text-white outline-none focus:border-cyan-400/60"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !firebaseReady}
              className="w-full rounded-2xl border border-cyan-400/40 bg-cyan-500/15 py-4 text-lg font-bold text-cyan-50 disabled:opacity-50"
            >
              {loading ? "Bekle..." : inviteCode ? `${inviteCode} Odasına Katıl` : "Odaya Katıl"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

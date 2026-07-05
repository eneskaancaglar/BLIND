"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GameBoard } from "@/components/GameBoard";
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
      setError("Firebase ayarları yüklenemedi. Sunucuyu yeniden başlat.");
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
      setError("Firebase ayarları yüklenemedi. Sunucuyu yeniden başlat.");
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
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
        <p className="text-neutral-400">Yükleniyor...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-10 text-center">
        <p className="mb-2 text-sm uppercase tracking-[0.3em] text-neutral-500">Kart Oyunu</p>
        <h1 className="text-5xl font-black tracking-tight">BLIND</h1>
        <p className="mt-3 text-neutral-400">
          Oda kur, kodu paylaş, telefondan aynı masaya otur.
        </p>
      </div>

      {inviteCode ? (
        <div className="mb-4 rounded-2xl border border-green-500/40 bg-green-500/10 p-4 text-center text-sm text-green-200">
          <p className="font-semibold">{inviteCode} odasına davet edildin</p>
          <p className="mt-1 text-green-300/80">Adını yaz → Odaya Katıl</p>
        </div>
      ) : null}

      {!firebaseReady ? (
        <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          Firebase bağlantısı yok. Sunucuyu durdur (Ctrl+C), tekrar{" "}
          <strong>npm.cmd run dev</strong> yaz ve sayfayı yenile.
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-3 text-center text-sm text-green-300">
          Bağlantı hazır
        </div>
      )}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-center text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="space-y-6 rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-2xl">
        <label className="block space-y-2">
          <span className="text-sm text-neutral-400">Oyuncu Adı (zorunlu)</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder="Adınız"
            className="w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-4 text-lg outline-none focus:border-green-500"
          />
        </label>

        <button
          type="button"
          disabled={loading || !firebaseReady}
          onClick={handleCreate}
          className="w-full rounded-2xl bg-green-600 px-4 py-4 text-lg font-semibold text-white transition hover:bg-green-500 disabled:opacity-50"
        >
          {loading ? "Bekle..." : "Oda Kur"}
        </button>

        <div className="relative py-2 text-center">
          <span className="bg-neutral-900 px-3 text-sm text-neutral-500">veya</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-neutral-800" />
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-neutral-400">Oda Kodu</span>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Örn: AB3K9"
              maxLength={6}
              className="w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-4 text-center text-xl tracking-[0.3em] outline-none focus:border-green-500"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !firebaseReady}
            className="w-full rounded-2xl border border-neutral-600 bg-neutral-800 px-4 py-4 text-lg font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
          >
            {loading ? "Bekle..." : inviteCode ? `${inviteCode} Odasına Katıl` : "Odaya Katıl"}
          </button>
        </form>
      </div>
    </main>
  );
}

"use client";

import { useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RoomLobby } from "@/components/RoomLobby";
import { clearStoredRoomCode, verifyRoomMembership } from "@/lib/roomService";

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const roomCode = params.code?.toUpperCase() ?? "";

  useEffect(() => {
    if (!roomCode) return;
    router.prefetch(`/game/${roomCode}`);
  }, [roomCode, router]);

  useEffect(() => {
    if (!roomCode) return;

    localStorage.setItem("blind_room_code", roomCode);

    void (async () => {
      const { room } = await verifyRoomMembership(roomCode);
      if (!room) {
        clearStoredRoomCode();
        router.replace("/");
      }
    })();
  }, [roomCode, router]);

  const handleLeave = useCallback(() => {
    clearStoredRoomCode();
    router.replace("/");
  }, [router]);

  const handleGameStarted = useCallback(() => {
    router.replace(`/game/${roomCode}`);
  }, [router, roomCode]);

  return (
    <RoomLobby
      roomCode={roomCode}
      onGameStarted={handleGameStarted}
      onLeave={handleLeave}
    />
  );
}

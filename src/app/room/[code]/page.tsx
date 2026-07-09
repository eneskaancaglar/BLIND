"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RoomLobby } from "@/components/RoomLobby";
import { clearStoredRoomCode, verifyRoomMembership } from "@/lib/roomService";

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const roomCode = params.code?.toUpperCase() ?? "";

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

  function handleLeave() {
    clearStoredRoomCode();
    router.replace("/");
  }

  return (
    <RoomLobby
      roomCode={roomCode}
      onGameStarted={() => router.replace(`/game/${roomCode}`)}
      onLeave={handleLeave}
    />
  );
}

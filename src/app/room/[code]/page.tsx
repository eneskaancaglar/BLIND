"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RoomLobby } from "@/components/RoomLobby";
import { clearStoredRoomCode } from "@/lib/roomService";

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const roomCode = params.code?.toUpperCase() ?? "";

  useEffect(() => {
    if (roomCode) {
      localStorage.setItem("blind_room_code", roomCode);
    }
  }, [roomCode]);

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

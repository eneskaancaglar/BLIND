"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { GameBoard } from "@/components/GameBoard";
import { clearStoredRoomCode } from "@/lib/roomService";

export default function GamePage() {
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

  return <GameBoard roomCode={roomCode} onLeave={handleLeave} />;
}

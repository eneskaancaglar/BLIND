"use client";

import { useParams, useRouter } from "next/navigation";
import { RoomLobby } from "@/components/RoomLobby";

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const roomCode = params.code?.toUpperCase() ?? "";

  return (
    <RoomLobby
      roomCode={roomCode}
      onGameStarted={() => router.replace(`/game/${roomCode}`)}
      onLeave={() => router.replace("/")}
    />
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { GameBoard } from "@/components/GameBoard";

export default function GamePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const roomCode = params.code?.toUpperCase() ?? "";

  return <GameBoard roomCode={roomCode} onLeave={() => router.replace("/")} />;
}

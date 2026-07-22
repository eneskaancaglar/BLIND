import { decideBotMove, roomHasBots } from "./botAI";
import {
  predictGameEndsAfterReveal,
} from "./gameLogic";
import type { Player, Room } from "./types";
import {
  continueAfterReveal,
  openChallenge,
  placeBid,
  refreshRoomState,
} from "./roomService";

let suppressedContinueRound: number | null = null;

export function suppressBotContinueForRound(roundNumber: number): void {
  suppressedContinueRound = roundNumber;
}

export function clearBotContinueSuppression(): void {
  suppressedContinueRound = null;
}

const BOT_TURN_DELAY_MS = 3000;
const BOT_CONTINUE_MS = 3000;

let botActing = false;
let lastBotTurnKey = "";
let lastBotContinueKey = "";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function randomThinkDelay(): number {
  return BOT_TURN_DELAY_MS;
}

function currentTurnPlayer(room: Room, players: Player[]): Player | undefined {
  const turnId = room.turnOrder[room.currentTurnIndex];
  return players.find((player) => player.id === turnId);
}

export async function runBotOrchestrator(params: {
  roomCode: string;
  room: Room;
  players: Player[];
  driverPlayerId: string;
}): Promise<void> {
  const { roomCode, room, players, driverPlayerId } = params;

  if (!roomHasBots(players)) return;
  if (room.hostId !== driverPlayerId) return;

  if (room.status === "playing" && room.phase === "bidding") {
    await runBotBiddingTurn({ roomCode, room, players });
    return;
  }

  if (room.status === "playing" && room.phase === "revealed" && room.revealResult) {
    await runBotContinueRound({ roomCode, room, players, driverPlayerId });
  }
}

async function runBotBiddingTurn(params: {
  roomCode: string;
  room: Room;
  players: Player[];
}): Promise<void> {
  const { roomCode, room, players } = params;
  const turnPlayer = currentTurnPlayer(room, players);

  if (!turnPlayer?.isBot || turnPlayer.isEliminated) return;

  const turnKey = `${room.syncVersion ?? 0}-${room.roundNumber}-${room.currentTurnIndex}-bid`;
  if (lastBotTurnKey === turnKey || botActing) return;

  botActing = true;
  lastBotTurnKey = turnKey;

  try {
    await delay(randomThinkDelay());

    const fresh = await refreshRoomState(roomCode, { preferCache: false });
    const freshRoom = fresh.room;
    if (!freshRoom || freshRoom.status !== "playing" || freshRoom.phase !== "bidding") {
      lastBotTurnKey = "";
      return;
    }

    const freshTurn = currentTurnPlayer(freshRoom, fresh.players);
    if (!freshTurn?.isBot || freshTurn.isEliminated) {
      lastBotTurnKey = "";
      return;
    }

    const decision = decideBotMove(freshTurn, freshRoom, fresh.players);

    if (decision.action === "bid") {
      await placeBid(
        roomCode,
        freshTurn.id,
        freshTurn.name,
        decision.count,
        decision.rank
      );
    } else {
      await openChallenge(roomCode, freshTurn.id, freshTurn.name);
    }
  } catch {
    lastBotTurnKey = "";
  } finally {
    botActing = false;
  }
}

async function runBotContinueRound(params: {
  roomCode: string;
  room: Room;
  players: Player[];
  driverPlayerId: string;
}): Promise<void> {
  const { roomCode, room, players, driverPlayerId } = params;

  if (!room.revealResult) return;
  if (predictGameEndsAfterReveal(players, room.revealResult, room)) return;
  if (room.resolvedRoundNumber === room.roundNumber) return;
  if (suppressedContinueRound === room.roundNumber) return;

  const continueKey = `${room.roundNumber}-continue-${room.syncVersion ?? 0}`;
  if (lastBotContinueKey === continueKey || botActing) return;

  botActing = true;
  lastBotContinueKey = continueKey;

  try {
    await delay(BOT_CONTINUE_MS);

    const fresh = await refreshRoomState(roomCode, { preferCache: false });
    if (
      !fresh.room ||
      fresh.room.phase !== "revealed" ||
      !fresh.room.revealResult ||
      fresh.room.resolvedRoundNumber === fresh.room.roundNumber
    ) {
      lastBotContinueKey = "";
      return;
    }

    if (predictGameEndsAfterReveal(fresh.players, fresh.room.revealResult, fresh.room)) {
      return;
    }

    await continueAfterReveal(roomCode, driverPlayerId);
  } catch {
    lastBotContinueKey = "";
  } finally {
    botActing = false;
  }
}

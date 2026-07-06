"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  applyRoundLoss,
  applyBlindRevival,
  buildTurnOrder,
  createDeck,
  dealCards,
  generateRoomCode,
  getWinner,
  nextTurnIndex,
  resolveChallenge,
} from "./gameLogic";
import { Bid, Player, Rank, Room } from "./types";
import { DEFAULT_ROOM_SETTINGS, type RoomSettings } from "./i18n";

const ROOMS = "rooms";
const PLAYERS = "players";

function playerIdKey(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem("blind_player_id");
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `player-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  localStorage.setItem("blind_player_id", id);
  return id;
}

function toFriendlyError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("permission") || msg.includes("insufficient")) {
      return "Firebase izin hatası. Firestore test modunda mı kontrol edin.";
    }
    if (msg.includes("network") || msg.includes("offline")) {
      return "İnternet bağlantısı yok gibi görünüyor.";
    }
    return error.message;
  }
  return fallback;
}

export function getStoredPlayerName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("blind_player_name") ?? "";
}

export function setStoredPlayerName(name: string): void {
  localStorage.setItem("blind_player_name", name.trim());
}

export function getPlayerId(): string {
  return playerIdKey();
}

export function clearStoredRoomCode(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("blind_room_code");
}

export type RestoredSession = {
  code: string;
  screen: "lobby" | "game";
};

export async function restoreSession(): Promise<RestoredSession | null> {
  const code = getStoredRoomCode().trim().toUpperCase();
  if (!code) return null;

  const playerId = getPlayerId();
  const room = await fetchRoomSnapshot(code);
  if (!room) {
    clearStoredRoomCode();
    return null;
  }

  const players = await fetchPlayers(code);
  const me = players.find((player) => player.id === playerId);
  if (!me) {
    clearStoredRoomCode();
    return null;
  }

  const screen: RestoredSession["screen"] =
    room.status === "waiting" ? "lobby" : "game";

  return { code, screen };
}

export function getStoredRoomCode(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("blind_room_code") ?? "";
}

export async function getRoomTargetPath(roomCode: string): Promise<string | null> {
  const normalizedCode = roomCode.trim().toUpperCase();
  const roomSnap = await getDoc(doc(db, ROOMS, normalizedCode));
  if (!roomSnap.exists()) return null;

  const room = roomSnap.data() as Room;
  if (room.status === "playing" || room.status === "finished") {
    return `/game/${normalizedCode}`;
  }
  return `/room/${normalizedCode}`;
}

export function buildJoinLink(roomCode: string): string {
  if (typeof window === "undefined") return `/?room=${roomCode}`;
  return `${window.location.origin}/?room=${roomCode.toUpperCase()}`;
}

async function fetchPlayers(roomCode: string): Promise<Player[]> {
  const snapshot = await getDocs(
    query(collection(db, ROOMS, roomCode, PLAYERS), orderBy("joinedAt", "asc"))
  );
  return snapshot.docs.map((d) => d.data() as Player);
}

export async function fetchRoomSnapshot(roomCode: string): Promise<Room | null> {
  const snapshot = await getDoc(doc(db, ROOMS, roomCode));
  if (!snapshot.exists()) return null;
  return snapshot.data() as Room;
}

export function attachRoomSync(
  roomCode: string,
  handlers: {
    onRoom: (room: Room | null) => void;
    onPlayers: (players: Player[]) => void;
    onError?: (error: Error) => void;
  }
): () => void {
  const unsubs = [
    subscribeToRoom(roomCode, handlers.onRoom, handlers.onError),
    subscribeToPlayers(roomCode, handlers.onPlayers, handlers.onError),
  ];

  const pullLatest = async () => {
    try {
      const [room, players] = await Promise.all([
        fetchRoomSnapshot(roomCode),
        fetchPlayers(roomCode),
      ]);
      handlers.onRoom(room);
      handlers.onPlayers(players);
    } catch (error) {
      handlers.onError?.(new Error(toFriendlyError(error, "Senkron hatası")));
    }
  };

  const interval = window.setInterval(() => {
    void pullLatest();
  }, 2000);

  const onVisible = () => {
    if (document.visibilityState === "visible") {
      void pullLatest();
    }
  };

  document.addEventListener("visibilitychange", onVisible);

  return () => {
    unsubs.forEach((unsub) => unsub());
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export async function createRoom(
  playerName: string,
  settings: RoomSettings = DEFAULT_ROOM_SETTINGS
): Promise<string> {
  const playerId = playerIdKey();
  setStoredPlayerName(playerName);

  let roomCode = generateRoomCode();
  let attempts = 0;

  while (attempts < 10) {
    const roomRef = doc(db, ROOMS, roomCode);
    const existing = await getDoc(roomRef);
    if (!existing.exists()) break;
    roomCode = generateRoomCode();
    attempts += 1;
  }

  const room: Room = {
    code: roomCode,
    hostId: playerId,
    status: "waiting",
    phase: "bidding",
    currentTurnIndex: 0,
    turnOrder: [playerId],
    currentBid: null,
    roundNumber: 0,
    deck: [],
    deckCount: settings.deckCount,
    blindThreshold: settings.blindThreshold,
    winnerId: null,
    winnerName: null,
    lastLoserId: null,
    lastLoserName: null,
    revealResult: null,
    createdAt: Date.now(),
  };

  const player: Player = {
    id: playerId,
    name: playerName.trim(),
    isHost: true,
    cards: [],
    cardCount: 1,
    isBlind: false,
    isEliminated: false,
    joinedAt: Date.now(),
  };

  try {
    await setDoc(doc(db, ROOMS, roomCode), room);
    await setDoc(doc(db, ROOMS, roomCode, PLAYERS, playerId), player);
  } catch (error) {
    throw new Error(toFriendlyError(error, "Oda kurulamadı."));
  }

  localStorage.setItem("blind_room_code", roomCode);
  return roomCode;
}

export async function joinRoom(roomCode: string, playerName: string): Promise<void> {
  const normalizedCode = roomCode.trim().toUpperCase();
  const playerId = playerIdKey();
  setStoredPlayerName(playerName);

  const roomRef = doc(db, ROOMS, normalizedCode);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("Oda bulunamadı.");
  }

  const room = roomSnap.data() as Room;
  const playerRef = doc(db, ROOMS, normalizedCode, PLAYERS, playerId);
  const playerSnap = await getDoc(playerRef);

  if (playerSnap.exists()) {
    await updateDoc(playerRef, { name: playerName.trim() });
    localStorage.setItem("blind_room_code", normalizedCode);
    return;
  }

  if (room.status !== "waiting") {
    throw new Error("Game already started — you cannot join.");
  }

  const player: Player = {
    id: playerId,
    name: playerName.trim(),
    isHost: false,
    cards: [],
    cardCount: 1,
    isBlind: false,
    isEliminated: false,
    joinedAt: Date.now(),
  };

  await setDoc(playerRef, player);
  await updateDoc(roomRef, {
    turnOrder: [...room.turnOrder, playerId],
  });

  localStorage.setItem("blind_room_code", normalizedCode);
}

export async function startGame(roomCode: string, hostId: string): Promise<void> {
  const roomRef = doc(db, ROOMS, roomCode);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) throw new Error("Oda bulunamadı.");

  const room = roomSnap.data() as Room;
  if (room.hostId !== hostId) throw new Error("Sadece oda kurucusu başlatabilir.");
  if (room.status !== "waiting") throw new Error("Oyun zaten başlamış.");

  const players = await fetchPlayers(roomCode);
  if (players.length < 2) {
    throw new Error("En az 2 oyuncu gerekli.");
  }

  let deck = createDeck(room.deckCount ?? 1);
  const preparedPlayers = players.map((player) => ({
    ...player,
    cardCount: player.isEliminated ? 0 : Math.max(player.cardCount, 1),
    cards: [] as Player["cards"],
  }));

  const dealt = dealCards(deck, preparedPlayers);
  deck = dealt.deck;
  const turnOrder = buildTurnOrder(dealt.players);

  await updateDoc(roomRef, {
    status: "playing",
    phase: "bidding",
    roundNumber: 1,
    deck,
    currentBid: null,
    currentTurnIndex: 0,
    turnOrder,
    revealResult: null,
    lastLoserId: null,
    lastLoserName: null,
    winnerId: null,
    winnerName: null,
  });

  await Promise.all(
    dealt.players.map((player) =>
      updateDoc(doc(db, ROOMS, roomCode, PLAYERS, player.id), {
        cards: player.cards,
        cardCount: player.cardCount,
      })
    )
  );
}

export async function placeBid(
  roomCode: string,
  playerId: string,
  playerName: string,
  count: number,
  rank: Rank
): Promise<void> {
  const roomRef = doc(db, ROOMS, roomCode);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error("Oda bulunamadı.");

  const room = roomSnap.data() as Room;
  if (room.status !== "playing" || room.phase !== "bidding") {
    throw new Error("Şu an iddia veremezsiniz.");
  }

  const currentPlayerId = room.turnOrder[room.currentTurnIndex];
  if (currentPlayerId !== playerId) throw new Error("Sıra sizde değil.");

  const bid: Bid = { count, rank, playerId, playerName };
  await updateDoc(roomRef, {
    currentBid: bid,
    currentTurnIndex: nextTurnIndex(room.turnOrder, room.currentTurnIndex),
  });
}

export async function openChallenge(
  roomCode: string,
  playerId: string,
  playerName: string
): Promise<void> {
  const roomRef = doc(db, ROOMS, roomCode);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error("Oda bulunamadı.");

  const room = roomSnap.data() as Room;
  if (room.status !== "playing" || room.phase !== "bidding") {
    throw new Error("Şu an açamazsınız.");
  }

  const currentPlayerId = room.turnOrder[room.currentTurnIndex];
  if (currentPlayerId !== playerId) throw new Error("Sıra sizde değil.");
  if (!room.currentBid) throw new Error("Açmak için önce bir iddia olmalı.");

  const players = await fetchPlayers(roomCode);
  const revealResult = resolveChallenge(
    players,
    room.currentBid,
    playerId,
    playerName,
    room.turnOrder
  );

  await updateDoc(roomRef, {
    phase: "revealed",
    revealResult,
    lastLoserId: revealResult.loserId,
    lastLoserName: revealResult.loserName,
  });
}

export async function continueAfterReveal(roomCode: string, hostId: string): Promise<void> {
  const roomRef = doc(db, ROOMS, roomCode);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) throw new Error("Oda bulunamadı.");

  const room = roomSnap.data() as Room;
  if (room.hostId !== hostId) throw new Error("Sadece oda kurucusu devam ettirebilir.");
  if (room.phase !== "revealed" || !room.revealResult) {
    throw new Error("Gösterim aşaması tamamlanmadı.");
  }

  const blindThreshold = room.blindThreshold ?? 6;

  const players = await fetchPlayers(roomCode);
  const updatedPlayers = players.map((player) => {
    const result = room.revealResult!;

    if (result.blindRevivalId && player.id === result.blindRevivalId) {
      return applyBlindRevival(player);
    }

    if (player.id === result.loserId) {
      return applyRoundLoss(player, blindThreshold);
    }

    return player;
  });

  const winner = getWinner(updatedPlayers);
  if (winner) {
    await updateDoc(roomRef, {
      status: "finished",
      phase: "round_end",
      winnerId: winner.id,
      winnerName: winner.name,
    });

    await Promise.all(
      updatedPlayers.map((player) =>
        updateDoc(doc(db, ROOMS, roomCode, PLAYERS, player.id), {
          cards: player.cards,
          cardCount: player.cardCount,
          isBlind: player.isBlind,
          isEliminated: player.isEliminated,
        })
      )
    );
    return;
  }

  let deck = room.deck.length > 0 ? [...room.deck] : createDeck(room.deckCount ?? 1);
  const dealt = dealCards(deck, updatedPlayers);
  deck = dealt.deck;
  const turnOrder = buildTurnOrder(dealt.players, room.revealResult.loserId);

  await updateDoc(roomRef, {
    status: "playing",
    phase: "bidding",
    roundNumber: room.roundNumber + 1,
    deck,
    currentBid: null,
    turnOrder,
    currentTurnIndex: 0,
    revealResult: null,
  });

  await Promise.all(
    dealt.players.map((player) =>
      updateDoc(doc(db, ROOMS, roomCode, PLAYERS, player.id), {
        cards: player.cards,
        cardCount: player.cardCount,
        isBlind: player.isBlind,
        isEliminated: player.isEliminated,
      })
    )
  );
}

export function subscribeToRoom(
  roomCode: string,
  onRoom: (room: Room | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, ROOMS, roomCode),
    (snapshot) => {
      if (!snapshot.exists()) {
        onRoom(null);
        return;
      }
      onRoom(snapshot.data() as Room);
    },
    (error) => onError?.(error)
  );
}

export function subscribeToPlayers(
  roomCode: string,
  onPlayers: (players: Player[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, ROOMS, roomCode, PLAYERS), orderBy("joinedAt", "asc")),
    (snapshot) => {
      onPlayers(snapshot.docs.map((d) => d.data() as Player));
    },
    (error) => onError?.(error)
  );
}

export function maskPlayersForViewer(
  players: Player[],
  viewerId: string,
  phase: Room["phase"],
  status: Room["status"]
): Player[] {
  const showAllCards = phase === "revealed" || (status === "finished" && phase === "round_end");

  return players.map((player) => {
    if (showAllCards) return player;
    if (player.id === viewerId) {
      if (player.isBlind) {
        return {
          ...player,
          cards: [],
        };
      }
      return player;
    }

    return {
      ...player,
      cards: [],
    };
  });
}

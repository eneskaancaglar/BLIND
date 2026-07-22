"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import {
  blindModeToLegacyGetsCards,
  buildTurnOrder,
  createDeck,
  dealCards,
  generateRoomCode,
  getActivePlayers,
  getBlindMode,
  getWinner,
  nextTurnIndex,
  resolveChallenge,
  resolveRoundAfterReveal,
  predictGameEndsAfterReveal,
} from "./gameLogic";
import { Bid, ChatMessage, Player, Rank, Room } from "./types";
import { DEFAULT_ROOM_SETTINGS, type RoomSettings } from "./i18n";

const ROOMS = "rooms";
const PLAYERS = "players";
const MESSAGES = "messages";
const MOBILE_POLL_MS = 50;
const DESKTOP_POLL_MS = 300;
const BOOTSTRAP_PREFIX = "blind_bootstrap_";

function isMobileBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function touchRoom<T extends Record<string, unknown>>(patch: T): T & { syncVersion: number } {
  return { ...patch, syncVersion: Date.now() };
}

export type RoomSyncState = {
  room: Room | null;
  players: Player[];
};

export function mergeRoomSyncState(prev: Room | null, next: Room | null): Room | null {
  if (!next) return null;
  if (
    next.phase === "revealed" &&
    !next.revealResult &&
    prev?.phase === "revealed" &&
    prev.revealResult &&
    prev.roundNumber === next.roundNumber
  ) {
    return { ...next, revealResult: prev.revealResult };
  }
  return next;
}

async function fetchRoom(roomCode: string, preferCache = false): Promise<Room | null> {
  const roomRef = doc(getDb(), ROOMS, roomCode);
  const snapshot = preferCache ? await getDoc(roomRef) : await getDocFromServer(roomRef);
  if (!snapshot.exists()) return null;
  return snapshot.data() as Room;
}

async function fetchPlayers(roomCode: string, preferCache = false): Promise<Player[]> {
  const playersQuery = query(collection(getDb(), ROOMS, roomCode, PLAYERS), orderBy("joinedAt", "asc"));
  const snapshot = preferCache ? await getDocs(playersQuery) : await getDocsFromServer(playersQuery);
  return snapshot.docs.map((d) => d.data() as Player);
}

export function stashRoomBootstrap(roomCode: string, state: RoomSyncState): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${BOOTSTRAP_PREFIX}${roomCode}`, JSON.stringify(state));
}

export function takeRoomBootstrap(roomCode: string): RoomSyncState | null {
  if (typeof window === "undefined") return null;
  const key = `${BOOTSTRAP_PREFIX}${roomCode}`;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  sessionStorage.removeItem(key);
  try {
    return JSON.parse(raw) as RoomSyncState;
  } catch {
    return null;
  }
}

export async function refreshRoomState(
  roomCode: string,
  options: { preferCache?: boolean } = {}
): Promise<RoomSyncState> {
  const preferCache = options.preferCache ?? false;
  const [room, players] = await Promise.all([
    fetchRoom(roomCode, preferCache),
    fetchPlayers(roomCode, preferCache),
  ]);
  return { room, players };
}

async function batchWritePlayersAndRoom(
  roomCode: string,
  roomRef: ReturnType<typeof doc>,
  roomUpdate: Record<string, unknown>,
  players: Player[]
): Promise<void> {
  const batch = writeBatch(getDb());

  for (const player of players) {
    batch.update(doc(getDb(), ROOMS, roomCode, PLAYERS, player.id), {
      cards: player.cards,
      cardCount: player.cardCount,
      isBlind: player.isBlind,
      isEliminated: player.isEliminated,
    });
  }

  batch.update(roomRef, touchRoom(roomUpdate));
  await batch.commit();
}

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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchPlayerDoc(roomCode: string, playerId: string): Promise<Player | null> {
  const ref = doc(getDb(), ROOMS, roomCode, PLAYERS, playerId);
  try {
    const snap = await getDocFromServer(ref);
    if (snap.exists()) return snap.data() as Player;
  } catch {
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as Player;
  }
  return null;
}

async function fetchRoomWithRetry(roomCode: string, attempts = 3): Promise<Room | null> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const room = await fetchRoom(roomCode);
      if (room) return room;
    } catch {
      const room = await fetchRoomSnapshot(roomCode);
      if (room) return room;
    }
    if (attempt < attempts - 1) await delay(300);
  }
  return null;
}

export async function verifyRoomMembership(roomCode: string): Promise<{
  room: Room | null;
  player: Player | null;
}> {
  const code = roomCode.trim().toUpperCase();
  const playerId = getPlayerId();
  if (!code || !playerId) return { room: null, player: null };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const room = await fetchRoomWithRetry(code, 2);
    if (!room) {
      if (attempt < 2) await delay(300);
      continue;
    }

    const player = await fetchPlayerDoc(code, playerId);
    if (player) {
      localStorage.setItem("blind_room_code", code);
      return { room, player };
    }

    if (attempt < 2) await delay(300);
  }

  const room = await fetchRoomWithRetry(code, 1);
  return { room, player: null };
}

export async function restoreSession(): Promise<RestoredSession | null> {
  const code = getStoredRoomCode().trim().toUpperCase();
  if (!code) return null;

  const { room, player } = await verifyRoomMembership(code);
  if (!room) {
    clearStoredRoomCode();
    return null;
  }
  if (!player) return null;

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
  const roomSnap = await getDoc(doc(getDb(), ROOMS, normalizedCode));
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

export async function fetchRoomSnapshot(roomCode: string): Promise<Room | null> {
  const snapshot = await getDoc(doc(getDb(), ROOMS, roomCode));
  if (!snapshot.exists()) return null;
  return snapshot.data() as Room;
}

export function attachRoomSync(
  roomCode: string,
  handlers: {
    onSync: (state: RoomSyncState) => void;
    onError?: (error: Error) => void;
  }
): () => void {
  let stopped = false;
  let pulling = false;
  let pullQueued = false;
  let pollTimer: number | null = null;
  const mobile = isMobileBrowser();
  const pollMs = mobile ? MOBILE_POLL_MS : DESKTOP_POLL_MS;

  const pullLatest = async (preferCache = false) => {
    if (stopped) return;
    if (pulling) {
      pullQueued = true;
      return;
    }

    pulling = true;
    try {
      const state = await refreshRoomState(roomCode, { preferCache });
      if (!stopped) {
        handlers.onSync(state);
      }
    } catch (error) {
      handlers.onError?.(new Error(toFriendlyError(error, "Senkron hatası")));
    } finally {
      pulling = false;
      if (pullQueued) {
        pullQueued = false;
        void pullLatest(true);
      }
    }
  };

  const schedulePoll = () => {
    if (stopped) return;
    if (pollTimer !== null) {
      window.clearTimeout(pollTimer);
    }
    pollTimer = window.setTimeout(() => {
      pollTimer = null;
      void pullLatest(false).finally(schedulePoll);
    }, pollMs);
  };

  const kick = (preferCache = true) => {
    void pullLatest(preferCache);
  };

  const kickFromServer = () => kick(false);

  void pullLatest(false);
  schedulePoll();

  const unsubs = [
    subscribeToRoom(roomCode, () => kick(true), handlers.onError),
    subscribeToPlayers(roomCode, () => kick(true), handlers.onError),
  ];

  const onVisible = () => {
    if (document.visibilityState === "visible") kickFromServer();
  };

  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) kickFromServer();
  };

  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", kickFromServer);
  window.addEventListener("focus", kickFromServer);
  window.addEventListener("pageshow", onPageShow);

  return () => {
    stopped = true;
    unsubs.forEach((unsub) => unsub());
    if (pollTimer !== null) window.clearTimeout(pollTimer);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", kickFromServer);
    window.removeEventListener("focus", kickFromServer);
    window.removeEventListener("pageshow", onPageShow);
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
    const roomRef = doc(getDb(), ROOMS, roomCode);
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
    blindMode: settings.blindMode,
    blindGetsCards: blindModeToLegacyGetsCards(settings.blindMode),
    winnerId: null,
    winnerName: null,
    lastLoserId: null,
    lastLoserName: null,
    revealResult: null,
    createdAt: Date.now(),
    syncVersion: Date.now(),
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
    await setDoc(doc(getDb(), ROOMS, roomCode), room);
    await setDoc(doc(getDb(), ROOMS, roomCode, PLAYERS, playerId), player);
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

  const roomRef = doc(getDb(), ROOMS, normalizedCode);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("Oda bulunamadı.");
  }

  const room = roomSnap.data() as Room;
  const playerRef = doc(getDb(), ROOMS, normalizedCode, PLAYERS, playerId);
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
  await updateDoc(roomRef, touchRoom({
    turnOrder: [...room.turnOrder, playerId],
  }));

  localStorage.setItem("blind_room_code", normalizedCode);
}

export async function startGame(roomCode: string, hostId: string): Promise<void> {
  const roomRef = doc(getDb(), ROOMS, roomCode);
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
  const blindMode = getBlindMode(room);
  const blindThreshold = room.blindThreshold ?? 6;
  const preparedPlayers = players.map((player) => ({
    ...player,
    cardCount: player.isEliminated ? 0 : Math.max(player.cardCount, 1),
    cards: [] as Player["cards"],
  }));

  const dealt = dealCards(deck, preparedPlayers, blindMode, blindThreshold);
  deck = dealt.deck;
  const turnOrder = buildTurnOrder(dealt.players);

  await batchWritePlayersAndRoom(
    roomCode,
    roomRef,
    {
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
    },
    dealt.players
  );
}

export async function placeBid(
  roomCode: string,
  playerId: string,
  playerName: string,
  count: number,
  rank: Rank
): Promise<void> {
  const roomRef = doc(getDb(), ROOMS, roomCode);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error("Oda bulunamadı.");

  const room = roomSnap.data() as Room;
  if (room.status !== "playing" || room.phase !== "bidding") {
    throw new Error("Şu an iddia veremezsiniz.");
  }

  const currentPlayerId = room.turnOrder[room.currentTurnIndex];
  if (currentPlayerId !== playerId) throw new Error("Sıra sizde değil.");

  const bid: Bid = { count, rank, playerId, playerName };
  await updateDoc(roomRef, touchRoom({
    currentBid: bid,
    currentTurnIndex: nextTurnIndex(room.turnOrder, room.currentTurnIndex),
  }));
}

export async function openChallenge(
  roomCode: string,
  playerId: string,
  playerName: string
): Promise<void> {
  const roomRef = doc(getDb(), ROOMS, roomCode);
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
  const blindThreshold = room.blindThreshold ?? 6;
  const revealResult = resolveChallenge(
    players,
    room.currentBid,
    playerId,
    playerName,
    room.turnOrder,
    blindThreshold
  );

  await updateDoc(roomRef, touchRoom({
    phase: "revealed",
    revealResult,
    lastLoserId: revealResult.loserId,
    lastLoserName: revealResult.loserName,
    resolvedRoundNumber: null,
  }));
}

export async function continueAfterReveal(roomCode: string, actorId: string): Promise<void> {
  const roomRef = doc(getDb(), ROOMS, roomCode);
  const playersSnap = await getDocs(
    query(collection(getDb(), ROOMS, roomCode, PLAYERS), orderBy("joinedAt", "asc"))
  );

  await runTransaction(getDb(), async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) throw new Error("Oda bulunamadı.");

    const room = roomSnap.data() as Room;
    if (room.phase !== "revealed" || !room.revealResult) {
      throw new Error("Bu el zaten tamamlandı.");
    }
    if (room.resolvedRoundNumber === room.roundNumber) {
      throw new Error("Bu el zaten tamamlandı.");
    }

    const actorSnap = await transaction.get(doc(getDb(), ROOMS, roomCode, PLAYERS, actorId));
    const actor = actorSnap.data() as Player | undefined;
    if (!actor || actor.isEliminated) {
      throw new Error("Devam etmek için oyunda olmalısınız.");
    }

    const players: Player[] = [];
    for (const playerDoc of playersSnap.docs) {
      const playerSnap = await transaction.get(playerDoc.ref);
      if (playerSnap.exists()) {
        players.push(playerSnap.data() as Player);
      }
    }

    if (room.hostId !== actorId) {
      const wouldEndGame = predictGameEndsAfterReveal(players, room.revealResult, room);
      if (!wouldEndGame) {
        throw new Error("Sadece oda kurucusu devam ettirebilir.");
      }
    }

    const resolved = resolveRoundAfterReveal(players, room.revealResult, room);

    transaction.update(roomRef, touchRoom({
      status: resolved.status,
      phase: resolved.phase,
      roundNumber: resolved.roundNumber,
      deck: resolved.deck,
      currentBid: resolved.currentBid,
      turnOrder: resolved.turnOrder,
      currentTurnIndex: resolved.currentTurnIndex,
      revealResult: resolved.revealResult,
      winnerId: resolved.winnerId,
      winnerName: resolved.winnerName,
      lastLoserId: room.revealResult.loserId,
      lastLoserName: room.revealResult.loserName,
      resolvedRoundNumber: room.roundNumber,
    }));

    for (const player of resolved.players) {
      transaction.update(doc(getDb(), ROOMS, roomCode, PLAYERS, player.id), {
        cards: player.cards,
        cardCount: player.cardCount,
        isBlind: player.isBlind,
        isEliminated: player.isEliminated,
      });
    }
  });
}

export async function leaveGame(roomCode: string, playerId: string): Promise<void> {
  const roomRef = doc(getDb(), ROOMS, roomCode);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) {
    clearStoredRoomCode();
    return;
  }

  const room = roomSnap.data() as Room;
  if (room.status === "finished") {
    clearStoredRoomCode();
    return;
  }

  const players = await fetchPlayers(roomCode);
  const me = players.find((player) => player.id === playerId);
  if (!me) {
    clearStoredRoomCode();
    return;
  }

  await updateDoc(doc(getDb(), ROOMS, roomCode, PLAYERS, playerId), {
    isEliminated: true,
    cardCount: 0,
    cards: [],
    isBlind: false,
    isHost: false,
  });
  await updateDoc(roomRef, touchRoom({}));

  const updatedPlayers = players.map((player) =>
    player.id === playerId
      ? { ...player, isEliminated: true, cardCount: 0, cards: [], isBlind: false, isHost: false }
      : player
  );

  const active = getActivePlayers(updatedPlayers);
  const winner = getWinner(updatedPlayers);

  if (winner || active.length <= 1) {
    const w = winner ?? active[0];
    if (w) {
      await updateDoc(roomRef, touchRoom({
        status: "finished",
        phase: "round_end",
        winnerId: w.id,
        winnerName: w.name,
        revealResult: null,
        ...(room.hostId === playerId ? { hostId: w.id } : {}),
      }));
      await updateDoc(doc(getDb(), ROOMS, roomCode, PLAYERS, w.id), { isHost: true });
    }
    clearStoredRoomCode();
    return;
  }

  const roomUpdates: Partial<Room> = {};

  if (room.hostId === playerId) {
    const newHost = active[0];
    if (newHost) {
      roomUpdates.hostId = newHost.id;
      await updateDoc(doc(getDb(), ROOMS, roomCode, PLAYERS, newHost.id), { isHost: true });
    }
  }

  if (room.status === "playing" && room.phase === "bidding") {
    const newTurnOrder = buildTurnOrder(updatedPlayers);
    const oldCurrentId = room.turnOrder[room.currentTurnIndex];
    let newTurnIndex = 0;

    if (oldCurrentId && oldCurrentId !== playerId) {
      const idx = newTurnOrder.indexOf(oldCurrentId);
      newTurnIndex = idx >= 0 ? idx : 0;
    }

    roomUpdates.turnOrder = newTurnOrder;
    roomUpdates.currentTurnIndex = newTurnIndex;
  }

  if (Object.keys(roomUpdates).length > 0) {
    await updateDoc(roomRef, touchRoom(roomUpdates));
  }

  if (room.phase === "revealed" && room.revealResult && active[0]) {
    try {
      await continueAfterReveal(roomCode, active[0].id);
    } catch {
      // Remaining players can continue manually.
    }
  }

  clearStoredRoomCode();
}

export function subscribeToRoom(
  roomCode: string,
  onChange: () => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(getDb(), ROOMS, roomCode),
    () => onChange(),
    (error) => onError?.(error)
  );
}

export function subscribeToPlayers(
  roomCode: string,
  onChange: () => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(getDb(), ROOMS, roomCode, PLAYERS), orderBy("joinedAt", "asc")),
    () => onChange(),
    (error) => onError?.(error)
  );
}

export function maskPlayersForViewer(
  players: Player[],
  viewerId: string,
  phase: Room["phase"],
  status: Room["status"]
): Player[] {
  const showAllCards = phase === "revealed" || status === "finished";

  return players.map((player) => {
    if (showAllCards) {
      return player;
    }

    if (player.id === viewerId) {
      if (player.isBlind) {
        return { ...player, cards: [] };
      }
      return player;
    }

    return { ...player, cards: [] };
  });
}

export function attachMessageSync(
  roomCode: string,
  handlers: {
    onMessages: (messages: ChatMessage[]) => void;
    onError?: (error: Error) => void;
  }
): () => void {
  const q = query(
    collection(getDb(), ROOMS, roomCode, MESSAGES),
    orderBy("createdAt", "desc"),
    limit(40)
  );

  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ChatMessage, "id">),
        }))
        .reverse();
      handlers.onMessages(messages);
    },
    (error) => handlers.onError?.(new Error(toFriendlyError(error, "Mesaj senkron hatası")))
  );

  return unsub;
}

export async function sendEmojiMessage(
  roomCode: string,
  playerId: string,
  playerName: string,
  emoji: string
): Promise<void> {
  await addDoc(collection(getDb(), ROOMS, roomCode, MESSAGES), {
    playerId,
    playerName,
    emoji,
    createdAt: Date.now(),
  });
}

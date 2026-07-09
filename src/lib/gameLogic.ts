import {
  Bid,
  BlindMode,
  Card,
  Player,
  RANKS,
  Rank,
  RevealResult,
  Room,
  Suit,
} from "./types";

const SUITS: Suit[] = ["H", "D", "C", "S"];

export function createDeck(deckCount: 1 | 2 = 1): Card[] {
  const deck: Card[] = [];

  for (let d = 0; d < deckCount; d += 1) {
    for (const suit of SUITS) {
      deck.push({ rank: "2", suit });
      for (const rank of RANKS) {
        deck.push({ rank, suit });
      }
    }
  }

  return shuffle(deck);
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getBlindMode(room: Pick<Room, "blindMode" | "blindGetsCards">): BlindMode {
  if (room.blindMode === "HIDDEN_CARDS_BLIND" || room.blindMode === "ORIGINAL_BLIND") {
    return room.blindMode;
  }
  return room.blindGetsCards ? "HIDDEN_CARDS_BLIND" : "ORIGINAL_BLIND";
}

export function isHiddenCardsBlind(mode: BlindMode): boolean {
  return mode === "HIDDEN_CARDS_BLIND";
}

export function blindModeToLegacyGetsCards(mode: BlindMode): boolean {
  return mode === "HIDDEN_CARDS_BLIND";
}

export function rankIndex(rank: Rank): number {
  return RANKS.indexOf(rank);
}

export function isBidHigher(
  newBid: Pick<Bid, "count" | "rank">,
  current: Pick<Bid, "count" | "rank">
): boolean {
  if (newBid.count > current.count) return true;
  if (newBid.count < current.count) return false;
  return rankIndex(newBid.rank) > rankIndex(current.rank);
}

export function countMatchingCards(allCards: Card[], targetRank: Rank): number {
  return allCards.filter((card) => card.rank === targetRank || card.rank === "2").length;
}

function openerIsNextAfterBidder(turnOrder: string[], bidderId: string, openerId: string): boolean {
  if (turnOrder.length === 0) return false;
  const bidderIndex = turnOrder.indexOf(bidderId);
  if (bidderIndex === -1) return false;
  const nextIndex = (bidderIndex + 1) % turnOrder.length;
  return turnOrder[nextIndex] === openerId;
}

export function resolveChallenge(
  players: Player[],
  currentBid: Bid,
  openerId: string,
  openerName: string,
  turnOrder: string[] = [],
  blindThreshold = 6
): RevealResult {
  const allCards = players.flatMap((player) => player.cards);
  const actualCount = countMatchingCards(allCards, currentBid.rank);
  const lastBidder = players.find((player) => player.id === currentBid.playerId);

  const openerLoses = actualCount >= currentBid.count;
  const loserId = openerLoses ? openerId : currentBid.playerId;
  const loserName = openerLoses ? openerName : currentBid.playerName;

  const blindImmediateOpen =
    Boolean(lastBidder?.isBlind) &&
    openerIsNextAfterBidder(turnOrder, currentBid.playerId, openerId) &&
    !lastBidder?.isEliminated;

  const blindRevival =
    blindImmediateOpen && openerLoses
      ? { id: lastBidder!.id, name: lastBidder!.name }
      : null;

  let reason = openerLoses
    ? `Sayım (${actualCount}) ≥ iddia (${currentBid.count}). Aç diyen kaybetti (+1 kart).`
    : `Sayım (${actualCount}) < iddia (${currentBid.count}). Son iddia eden kaybetti (+1 kart).`;

  if (blindRevival) {
    reason += ` BLIND iddiası doğruydu — ${blindRevival.name} ${blindThreshold} kartla oyuna döner, ${openerName} ceza kartı alır.`;
  } else if (blindImmediateOpen && !openerLoses) {
    reason += ` BLIND iddiası yanlıştı — ${currentBid.playerName} elendi.`;
  }

  return {
    actualCount,
    openerId,
    openerName,
    lastBidderId: currentBid.playerId,
    lastBidderName: currentBid.playerName,
    loserId,
    loserName,
    reason,
    blindRevivalId: blindRevival?.id ?? null,
    blindRevivalName: blindRevival?.name ?? null,
  };
}

export function applyBlindRevival(player: Player, blindThreshold: number): Player {
  return {
    ...player,
    cardCount: blindThreshold,
    isBlind: false,
    isEliminated: false,
    cards: [],
  };
}

function clearHand(player: Player): Player {
  return { ...player, cards: [] };
}

/** Penalty for the opener who lost a blind-revival challenge. */
export function applyBlindRevivalOpenerPenalty(
  player: Player,
  blindThreshold: number,
  blindMode: BlindMode,
  activePlayersBeforeRound: number
): Player {
  if (player.isBlind) {
    return applyRoundLoss(player, blindThreshold, blindMode);
  }

  if (activePlayersBeforeRound <= 2) {
    if (player.cardCount >= blindThreshold) {
      return clearHand(player);
    }
    return { ...player, cardCount: player.cardCount + 1, cards: [] };
  }

  return applyRoundLoss(player, blindThreshold, blindMode);
}

export function applyRoundLoss(
  player: Player,
  blindThreshold: number,
  blindMode: BlindMode
): Player {
  if (player.isBlind) {
    return {
      ...player,
      cardCount: 0,
      isBlind: false,
      isEliminated: true,
      cards: [],
    };
  }

  if (player.cardCount >= blindThreshold) {
    return {
      ...player,
      cardCount: isHiddenCardsBlind(blindMode) ? blindThreshold : 0,
      isBlind: true,
      cards: [],
    };
  }

  return {
    ...player,
    cardCount: player.cardCount + 1,
    cards: [],
  };
}

function cardsNeededToDeal(
  players: Player[],
  blindMode: BlindMode,
  blindThreshold: number
): number {
  const hiddenBlind = isHiddenCardsBlind(blindMode);
  return players.reduce((total, player) => {
    if (player.isEliminated) return total;
    if (player.isBlind && !hiddenBlind) return total;
    if (player.isBlind && hiddenBlind) return total + blindThreshold;
    return total + player.cardCount;
  }, 0);
}

function ensureDeckForDeal(
  deck: Card[],
  players: Player[],
  blindMode: BlindMode,
  blindThreshold: number,
  deckCount: 1 | 2
): Card[] {
  const needed = cardsNeededToDeal(players, blindMode, blindThreshold);
  if (deck.length >= needed) return deck;
  return shuffle([...deck, ...createDeck(deckCount)]);
}

export function dealCards(
  deck: Card[],
  players: Player[],
  blindMode: BlindMode,
  blindThreshold: number
): { deck: Card[]; players: Player[] } {
  const hiddenBlind = isHiddenCardsBlind(blindMode);
  const remainingDeck = [...deck];

  const updatedPlayers = players.map((player) => {
    if (player.isEliminated) {
      return { ...player, cards: [], cardCount: 0 };
    }

    if (player.isBlind && !hiddenBlind) {
      return { ...player, cards: [], cardCount: 0 };
    }

    const cardsToDeal = player.isBlind && hiddenBlind ? blindThreshold : player.cardCount;
    const cards: Card[] = [];

    for (let i = 0; i < cardsToDeal; i += 1) {
      const card = remainingDeck.pop();
      if (card) cards.push(card);
    }

    return {
      ...player,
      cards,
      cardCount: player.isBlind && hiddenBlind ? blindThreshold : player.cardCount,
    };
  });

  return { deck: remainingDeck, players: updatedPlayers };
}

function isBlindRevivalStalemate(players: Player[]): boolean {
  const active = getActivePlayers(players);
  return active.length === 2 && active.every((player) => player.isBlind);
}

function isBlindRevivalTwoPlayerDraw(
  players: Player[],
  revealResult: RevealResult,
  blindThreshold: number
): boolean {
  if (!revealResult.blindRevivalId) return false;
  if (getActivePlayers(players).length > 2) return false;

  const opener = players.find((player) => player.id === revealResult.loserId);
  return Boolean(opener && !opener.isBlind && opener.cardCount >= blindThreshold);
}

export function getHandDisplayCount(player: Player, blindMode: BlindMode): number {
  if (player.isEliminated) return 0;

  if (player.isBlind) {
    return isHiddenCardsBlind(blindMode) ? player.cardCount : 0;
  }

  return Math.max(player.cardCount, player.cards.length);
}

export function getActivePlayers(players: Player[]): Player[] {
  return players.filter((player) => !player.isEliminated && (player.cardCount > 0 || player.isBlind));
}

export function getWinner(players: Player[]): Player | null {
  const active = getActivePlayers(players);
  if (active.length === 1) return active[0];
  return null;
}

export type RoundResolveResult = {
  players: Player[];
  status: Room["status"];
  phase: Room["phase"];
  roundNumber: number;
  deck: Card[];
  turnOrder: string[];
  currentTurnIndex: number;
  winnerId: string | null;
  winnerName: string | null;
  revealResult: RevealResult | null;
  currentBid: null;
};

export function applyRevealPenalties(
  players: Player[],
  revealResult: RevealResult,
  room: Pick<Room, "blindThreshold" | "blindMode" | "blindGetsCards">
): Player[] {
  const blindMode = getBlindMode(room);
  const blindThreshold = room.blindThreshold ?? 6;
  const activeBeforeRound = getActivePlayers(players).length;
  const isBlindRevival = Boolean(revealResult.blindRevivalId);

  return players.map((player) => {
    if (isBlindRevival && player.id === revealResult.blindRevivalId) {
      return applyBlindRevival(player, blindThreshold);
    }

    if (player.id === revealResult.loserId) {
      if (isBlindRevival) {
        return applyBlindRevivalOpenerPenalty(
          player,
          blindThreshold,
          blindMode,
          activeBeforeRound
        );
      }
      return applyRoundLoss(player, blindThreshold, blindMode);
    }

    return { ...player, cards: [], cardCount: player.cardCount };
  });
}

function finishAsDraw(
  players: Player[],
  updatedPlayers: Player[],
  room: Pick<Room, "roundNumber">
): RoundResolveResult {
  return {
    players: preserveRevealedCards(players, updatedPlayers),
    status: "finished",
    phase: "round_end",
    roundNumber: room.roundNumber,
    deck: [],
    turnOrder: buildTurnOrder(updatedPlayers),
    currentTurnIndex: 0,
    winnerId: null,
    winnerName: null,
    revealResult: null,
    currentBid: null,
  };
}

export function predictWinnerAfterReveal(
  players: Player[],
  revealResult: RevealResult,
  room: Pick<Room, "blindThreshold" | "blindMode" | "blindGetsCards">
): Player | null {
  const blindThreshold = room.blindThreshold ?? 6;
  if (isBlindRevivalTwoPlayerDraw(players, revealResult, blindThreshold)) {
    return null;
  }

  const updatedPlayers = applyRevealPenalties(players, revealResult, room);
  if (revealResult.blindRevivalId && isBlindRevivalStalemate(updatedPlayers)) {
    return null;
  }
  return getWinner(updatedPlayers);
}

export function predictGameEndsAfterReveal(
  players: Player[],
  revealResult: RevealResult,
  room: Pick<Room, "blindThreshold" | "blindMode" | "blindGetsCards">
): boolean {
  const blindThreshold = room.blindThreshold ?? 6;
  if (isBlindRevivalTwoPlayerDraw(players, revealResult, blindThreshold)) {
    return true;
  }

  const updatedPlayers = applyRevealPenalties(players, revealResult, room);
  if (revealResult.blindRevivalId && isBlindRevivalStalemate(updatedPlayers)) {
    return true;
  }
  return getWinner(updatedPlayers) !== null;
}

function preserveRevealedCards(players: Player[], updatedPlayers: Player[]): Player[] {
  return updatedPlayers.map((player) => {
    const revealed = players.find((source) => source.id === player.id);
    return revealed?.cards.length
      ? { ...player, cards: revealed.cards }
      : { ...player, cards: [] };
  });
}

export function resolveRoundAfterReveal(
  players: Player[],
  revealResult: RevealResult,
  room: Pick<Room, "blindThreshold" | "blindMode" | "blindGetsCards" | "deckCount" | "roundNumber" | "deck">
): RoundResolveResult {
  const blindMode = getBlindMode(room);
  const blindThreshold = room.blindThreshold ?? 6;
  const updatedPlayers = applyRevealPenalties(players, revealResult, room);

  if (isBlindRevivalTwoPlayerDraw(players, revealResult, blindThreshold)) {
    return finishAsDraw(players, updatedPlayers, room);
  }

  if (revealResult.blindRevivalId && isBlindRevivalStalemate(updatedPlayers)) {
    return finishAsDraw(players, updatedPlayers, room);
  }

  const winner = getWinner(updatedPlayers);
  if (winner) {
    return {
      players: preserveRevealedCards(players, updatedPlayers),
      status: "finished",
      phase: "round_end",
      roundNumber: room.roundNumber,
      deck: [],
      turnOrder: buildTurnOrder(updatedPlayers),
      currentTurnIndex: 0,
      winnerId: winner.id,
      winnerName: winner.name,
      revealResult: null,
      currentBid: null,
    };
  }

  let deck = room.deck.length > 0 ? [...room.deck] : createDeck(room.deckCount ?? 1);
  deck = ensureDeckForDeal(deck, updatedPlayers, blindMode, blindThreshold, room.deckCount ?? 1);
  const dealt = dealCards(deck, updatedPlayers, blindMode, blindThreshold);
  deck = dealt.deck;
  const turnOrder = buildTurnOrder(dealt.players, revealResult.loserId);

  return {
    players: dealt.players,
    status: "playing",
    phase: "bidding",
    roundNumber: room.roundNumber + 1,
    deck,
    turnOrder,
    currentTurnIndex: 0,
    winnerId: null,
    winnerName: null,
    revealResult: null,
    currentBid: null,
  };
}

export function nextTurnIndex(turnOrder: string[], currentIndex: number): number {
  if (turnOrder.length === 0) return 0;
  return (currentIndex + 1) % turnOrder.length;
}

export function buildTurnOrder(players: Player[], startWithId?: string | null): string[] {
  const activeIds = getActivePlayers(players)
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((player) => player.id);

  if (!startWithId || activeIds.length === 0) return activeIds;

  const startIndex = activeIds.indexOf(startWithId);
  if (startIndex === -1) return activeIds;

  return [...activeIds.slice(startIndex), ...activeIds.slice(0, startIndex)];
}

export function cardMatchesBid(card: Card, bidRank: Rank): boolean {
  return card.rank === bidRank || card.rank === "2";
}

export function cardToLabel(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function formatBid(bid: Bid): string {
  return `${bid.count} tane ${bid.rank === "J" || bid.rank === "Q" || bid.rank === "K" || bid.rank === "A" ? bid.rank : bid.rank}`;
}

export function getMinimumBid(currentBid: Bid | null): { count: number; rank: Rank } {
  if (!currentBid) {
    return { count: 1, rank: "3" };
  }

  if (currentBid.count >= 20) {
    return { count: currentBid.count + 1, rank: "3" };
  }

  const nextRankIndex = rankIndex(currentBid.rank) + 1;
  if (nextRankIndex < RANKS.length) {
    return { count: currentBid.count, rank: RANKS[nextRankIndex] };
  }

  return { count: currentBid.count + 1, rank: "3" };
}

export function isValidBid(
  bid: Pick<Bid, "count" | "rank">,
  currentBid: Bid | null,
  activePlayerCount: number,
  deckCount: 1 | 2 = 1
): boolean {
  if (bid.count < 1) return false;
  if (bid.count > activePlayerCount * 4 * deckCount) return false;
  if (!currentBid) return true;
  return isBidHigher(bid, currentBid);
}

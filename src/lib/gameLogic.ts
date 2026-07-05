import {
  Bid,
  Card,
  Player,
  RANKS,
  Rank,
  RevealResult,
  Suit,
} from "./types";

const SUITS: Suit[] = ["H", "D", "C", "S"];

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    deck.push({ rank: "2", suit });
    for (const rank of RANKS) {
      deck.push({ rank, suit });
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

export function rankIndex(rank: Rank): number {
  return RANKS.indexOf(rank);
}

export function isBidHigher(newBid: Pick<Bid, "count" | "rank">, current: Pick<Bid, "count" | "rank">): boolean {
  if (newBid.count > current.count) return true;
  if (newBid.count < current.count) return false;
  return rankIndex(newBid.rank) > rankIndex(current.rank);
}

export function countMatchingCards(allCards: Card[], targetRank: Rank): number {
  return allCards.filter((card) => card.rank === targetRank || card.rank === "2").length;
}

export function resolveChallenge(
  players: Player[],
  currentBid: Bid,
  openerId: string,
  openerName: string
): RevealResult {
  const allCards = players.flatMap((player) => player.cards);
  const actualCount = countMatchingCards(allCards, currentBid.rank);

  const openerLoses = actualCount >= currentBid.count;
  const loserId = openerLoses ? openerId : currentBid.playerId;
  const loserName = openerLoses ? openerName : currentBid.playerName;

  const reason = openerLoses
    ? `Sayım (${actualCount}) ≥ iddia (${currentBid.count}). Aç diyen kaybetti.`
    : `Sayım (${actualCount}) < iddia (${currentBid.count}). Son iddia eden kaybetti.`;

  return {
    actualCount,
    openerId,
    openerName,
    lastBidderId: currentBid.playerId,
    lastBidderName: currentBid.playerName,
    loserId,
    loserName,
    reason,
  };
}

export function applyRoundLoss(player: Player): Player {
  if (player.isBlind) {
    return {
      ...player,
      cardCount: 0,
      isEliminated: true,
      cards: [],
    };
  }

  if (player.cardCount >= 6) {
    return {
      ...player,
      cardCount: 6,
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

export function dealCards(
  deck: Card[],
  players: Player[]
): { deck: Card[]; players: Player[] } {
  const remainingDeck = [...deck];
  const updatedPlayers = players.map((player) => {
    if (player.isEliminated) {
      return { ...player, cards: [], cardCount: 0 };
    }

    const cards: Card[] = [];
    for (let i = 0; i < player.cardCount; i += 1) {
      const card = remainingDeck.pop();
      if (card) cards.push(card);
    }

    return { ...player, cards };
  });

  return { deck: remainingDeck, players: updatedPlayers };
}

export function getActivePlayers(players: Player[]): Player[] {
  return players.filter((player) => !player.isEliminated && player.cardCount > 0);
}

export function getWinner(players: Player[]): Player | null {
  const active = getActivePlayers(players);
  if (active.length === 1) return active[0];
  return null;
}

export function nextTurnIndex(turnOrder: string[], currentIndex: number): number {
  if (turnOrder.length === 0) return 0;
  return (currentIndex + 1) % turnOrder.length;
}

export function buildTurnOrder(players: Player[], startAfterId?: string | null): string[] {
  const activeIds = getActivePlayers(players)
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((player) => player.id);

  if (!startAfterId || activeIds.length === 0) return activeIds;

  const startIndex = activeIds.indexOf(startAfterId);
  if (startIndex === -1) return activeIds;

  return [...activeIds.slice(startIndex + 1), ...activeIds.slice(0, startIndex + 1)];
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
  activePlayerCount: number
): boolean {
  if (bid.count < 1) return false;
  if (bid.count > activePlayerCount * 4) return false;
  if (!currentBid) return true;
  return isBidHigher(bid, currentBid);
}

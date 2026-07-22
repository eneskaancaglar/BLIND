import {
  countMatchingCards,
  getActivePlayers,
  getBlindMode,
  getHandDisplayCount,
  getMinimumBid,
  isValidBid,
} from "./gameLogic";
import type { Bid, BlindMode, BotDifficulty, Card, Player, Rank, Room } from "./types";
import { RANKS } from "./types";

export type BotDecision =
  | { action: "bid"; count: number; rank: Rank }
  | { action: "open" };

type DifficultyProfile = {
  bluffRate: number;
  minRaiseRate: number;
  suboptimalPickRate: number;
  mistakenOpenRate: number;
  estimateNoise: number;
  doubtMarginMin: number;
  doubtMarginMax: number;
  minRaiseScore: number;
};

const DIFFICULTY_PROFILES: Record<BotDifficulty, DifficultyProfile> = {
  normal: {
    bluffRate: 0.28,
    minRaiseRate: 0.18,
    suboptimalPickRate: 0.2,
    mistakenOpenRate: 0.1,
    estimateNoise: 0.85,
    doubtMarginMin: 0.9,
    doubtMarginMax: 1.6,
    minRaiseScore: 1.2,
  },
  expert: {
    bluffRate: 0.08,
    minRaiseRate: 0.04,
    suboptimalPickRate: 0,
    mistakenOpenRate: 0,
    estimateNoise: 0,
    doubtMarginMin: 0.45,
    doubtMarginMax: 0.75,
    minRaiseScore: 2.4,
  },
};

function getDifficulty(bot: Player): BotDifficulty {
  return bot.botDifficulty ?? "normal";
}

function profileFor(bot: Player): DifficultyProfile {
  return DIFFICULTY_PROFILES[getDifficulty(bot)];
}

/** Cards the bot may use for decisions (never other players' hands). */
function botVisibleCards(bot: Player, blindMode: BlindMode): Card[] {
  if (bot.isEliminated) return [];
  if (bot.isBlind && blindMode === "ORIGINAL_BLIND") return [];
  return bot.cards;
}

function applyEstimateNoise(estimate: number, bot: Player): number {
  const profile = profileFor(bot);
  if (profile.estimateNoise <= 0) return estimate;
  const noise = (Math.random() - 0.5) * profile.estimateNoise;
  return Math.max(0, estimate + noise);
}

/**
 * Estimate how many cards matching `bidRank` (including 2s) exist on the table.
 * Uses only public info: own hand + opponent card counts.
 */
export function estimateMatchingCards(
  bidRank: Rank,
  bot: Player,
  opponents: Player[],
  room: Pick<Room, "blindMode" | "blindGetsCards" | "deckCount">
): number {
  const blindMode = getBlindMode(room);
  const deckCount = room.deckCount ?? 1;
  const ownCards = botVisibleCards(bot, blindMode);
  const ownMatches = countMatchingCards(ownCards, bidRank);

  const deckSize = 52 * deckCount;
  const rankSlots = 4 * deckCount;
  const twoSlots = 4 * deckCount;
  const matchDensity = (rankSlots + twoSlots) / deckSize;

  let expectedFromOthers = 0;
  for (const opponent of opponents) {
    if (opponent.isEliminated) continue;
    const handSize = getHandDisplayCount(opponent, blindMode);
    expectedFromOthers += handSize * matchDensity;
  }

  return applyEstimateNoise(ownMatches + expectedFromOthers, bot);
}

function strongestRank(cards: Card[]): { rank: Rank; count: number } {
  let bestRank: Rank = "3";
  let bestCount = 0;

  for (const rank of RANKS) {
    const count = countMatchingCards(cards, rank);
    if (count > bestCount) {
      bestCount = count;
      bestRank = rank;
    }
  }

  return { rank: bestRank, count: bestCount };
}

function pickOpeningBid(
  bot: Player,
  room: Room,
  activeCount: number
): { count: number; rank: Rank } {
  const profile = profileFor(bot);
  const blindMode = getBlindMode(room);
  const deckCount = room.deckCount ?? 1;
  const cards = botVisibleCards(bot, blindMode);

  if (cards.length === 0) {
    const conservative: Rank = ["5", "6", "7", "8"][Math.floor(Math.random() * 4)] as Rank;
    return { count: 1, rank: conservative };
  }

  const { rank, count } = strongestRank(cards);
  let bidCount = Math.max(1, count);

  if (count >= 2 && Math.random() < profile.bluffRate) {
    bidCount = count + 1;
  }

  if (getDifficulty(bot) === "expert" && count >= 3) {
    bidCount = Math.max(bidCount, count);
  }

  bidCount = Math.min(bidCount, activeCount * 4 * deckCount);

  return { count: bidCount, rank };
}

function pickRaiseBid(
  bot: Player,
  room: Room,
  opponents: Player[],
  currentBid: Bid,
  activeCount: number
): { count: number; rank: Rank } | null {
  const profile = profileFor(bot);
  const deckCount = room.deckCount ?? 1;
  const blindMode = getBlindMode(room);
  const cards = botVisibleCards(bot, blindMode);
  const minBid = getMinimumBid(currentBid);
  const isExpert = getDifficulty(bot) === "expert";

  const candidates: { count: number; rank: Rank; score: number }[] = [];

  for (const rank of RANKS) {
    const own = countMatchingCards(cards, rank);
    const estimated = estimateMatchingCards(rank, bot, opponents, room);
    const maxCount = isExpert
      ? Math.min(Math.ceil(estimated + 0.5), activeCount * 4 * deckCount)
      : Math.min(estimated + 1.5, activeCount * 4 * deckCount);

    for (let count = minBid.count; count <= maxCount; count += 1) {
      const bid = { count, rank };
      if (!isValidBid(bid, currentBid, activeCount, deckCount)) continue;
      if (count < minBid.count) continue;
      if (count === minBid.count && rankIndex(rank) < rankIndex(minBid.rank)) continue;

      let score = own * 2 + estimated;
      if (count <= own) score += 3;
      if (count <= estimated) score += isExpert ? 3 : 2;
      if (count > estimated + (isExpert ? 0.5 : 1)) score -= isExpert ? 6 : 4;

      candidates.push({ count, rank, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0 && candidates[0].score >= profile.minRaiseScore) {
    if (
      profile.suboptimalPickRate > 0 &&
      candidates.length > 1 &&
      Math.random() < profile.suboptimalPickRate
    ) {
      const pick = candidates[1];
      return { count: pick.count, rank: pick.rank };
    }
    const pick = candidates[0];
    return { count: pick.count, rank: pick.rank };
  }

  if (Math.random() < profile.minRaiseRate && isValidBid(minBid, currentBid, activeCount, deckCount)) {
    return minBid;
  }

  return null;
}

function rankIndex(rank: Rank): number {
  return RANKS.indexOf(rank);
}

function shouldOpenChallenge(
  bot: Player,
  room: Room,
  opponents: Player[],
  currentBid: Bid
): boolean {
  const profile = profileFor(bot);
  const blindMode = getBlindMode(room);
  const estimated = estimateMatchingCards(currentBid.rank, bot, opponents, room);
  const ownCards = botVisibleCards(bot, blindMode);
  const ownMatches = countMatchingCards(ownCards, currentBid.rank);
  const isExpert = getDifficulty(bot) === "expert";

  const doubtMargin =
    profile.doubtMarginMin + Math.random() * (profile.doubtMarginMax - profile.doubtMarginMin);

  if (currentBid.count > estimated + doubtMargin) {
    return true;
  }

  if (ownMatches === 0 && currentBid.count >= 2 && currentBid.count > estimated + (isExpert ? 0.2 : 0)) {
    return true;
  }

  if (currentBid.count >= 4 && estimated < currentBid.count - (isExpert ? 0.5 : 1)) {
    return true;
  }

  const activeOpponents = opponents.filter((p) => !p.isEliminated).length;
  if (currentBid.count >= activeOpponents + 1 && estimated < currentBid.count - (isExpert ? 0.3 : 0)) {
    return true;
  }

  if (!isExpert && Math.random() < profile.mistakenOpenRate && currentBid.count > estimated) {
    return true;
  }

  return false;
}

export function decideBotMove(bot: Player, room: Room, allPlayers: Player[]): BotDecision {
  const opponents = allPlayers.filter((player) => player.id !== bot.id);
  const activePlayers = getActivePlayers(allPlayers);
  const activeCount = activePlayers.length;
  const deckCount = room.deckCount ?? 1;
  const currentBid = room.currentBid;
  const profile = profileFor(bot);

  if (!currentBid) {
    const opening = pickOpeningBid(bot, room, activeCount);
    return { action: "bid", ...opening };
  }

  if (shouldOpenChallenge(bot, room, opponents, currentBid)) {
    return { action: "open" };
  }

  const raise = pickRaiseBid(bot, room, opponents, currentBid, activeCount);
  if (raise) {
    return { action: "bid", ...raise };
  }

  if (shouldOpenChallenge(bot, room, opponents, currentBid)) {
    return { action: "open" };
  }

  const minBid = getMinimumBid(currentBid);
  if (isValidBid(minBid, currentBid, activeCount, deckCount)) {
    if (Math.random() < profile.minRaiseRate) {
      return { action: "bid", count: minBid.count, rank: minBid.rank };
    }
  }

  return { action: "open" };
}

export function getBotDisplayName(index: number): string {
  return `bot-${index + 1}`;
}

export function roomHasBots(players: Player[]): boolean {
  return players.some((player) => player.isBot);
}

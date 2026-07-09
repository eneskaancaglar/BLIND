import { describe, expect, it } from "vitest";
import {
  applyBlindRevivalOpenerPenalty,
  createDeck,
  dealCards,
  resolveChallenge,
  resolveRoundAfterReveal,
} from "./gameLogic";
import type { Bid, Player, Room } from "./types";

function player(
  id: string,
  cardCount: number,
  overrides: Partial<Player> = {}
): Player {
  return {
    id,
    name: id,
    isHost: false,
    cards: Array.from({ length: cardCount }, () => ({ rank: "3", suit: "H" })),
    cardCount,
    isBlind: false,
    isEliminated: false,
    joinedAt: id === "a" ? 1 : id === "b" ? 2 : 3,
    ...overrides,
  };
}

function room(overrides: Partial<Room> = {}): Room {
  return {
    code: "TEST",
    hostId: "a",
    status: "playing",
    phase: "revealed",
    currentTurnIndex: 0,
    turnOrder: ["a", "b", "c"],
    currentBid: null,
    roundNumber: 2,
    deck: createDeck(1),
    deckCount: 1,
    blindThreshold: 6,
    blindGetsCards: false,
    blindMode: "ORIGINAL_BLIND",
    winnerId: null,
    winnerName: null,
    lastLoserId: null,
    lastLoserName: null,
    revealResult: null,
    createdAt: 0,
    ...overrides,
  };
}

describe("blind revival round resolution", () => {
  it("keeps third player cardCount unchanged after blind revival", () => {
    const players = [
      player("a", 4),
      player("b", 0, { isBlind: true, cards: [] }),
      player("c", 5),
    ];
    const bid: Bid = { count: 1, rank: "3", playerId: "b", playerName: "b" };
    const reveal = resolveChallenge(players, bid, "a", "a", ["b", "a", "c"], 6);

    expect(reveal.blindRevivalId).toBe("b");
    expect(reveal.loserId).toBe("a");

    const resolved = resolveRoundAfterReveal(players, reveal, room({ deck: [] }));
    const third = resolved.players.find((p) => p.id === "c");

    expect(third?.cardCount).toBe(5);
    expect(third?.isBlind).toBe(false);
  });

  it("ends in draw when two players remain and opener is already at blind threshold", () => {
    const players = [
      player("a", 6),
      player("b", 0, { isBlind: true, cards: [] }),
    ];
    const bid: Bid = { count: 1, rank: "3", playerId: "b", playerName: "b" };
    const reveal = resolveChallenge(players, bid, "a", "a", ["b", "a"], 6);

    const resolved = resolveRoundAfterReveal(players, reveal, room({ deck: createDeck(1) }));

    expect(resolved.status).toBe("finished");
    expect(resolved.winnerId).toBeNull();
    expect(resolved.players.find((p) => p.id === "a")?.cardCount).toBe(6);
    expect(resolved.players.find((p) => p.id === "b")?.cardCount).toBe(6);
  });

  it("applies +1 penalty to opener when two players remain and below threshold", () => {
    const opener = player("a", 4);
    const penalized = applyBlindRevivalOpenerPenalty(opener, 6, "ORIGINAL_BLIND", 2);
    expect(penalized.cardCount).toBe(5);
    expect(penalized.isBlind).toBe(false);
  });

  it("preserves cardCount when dealCards cannot draw from an empty deck", () => {
    const players = [player("a", 5), player("b", 4)];
    const { players: dealt } = dealCards([], players, "ORIGINAL_BLIND", 6);

    expect(dealt.find((p) => p.id === "b")?.cardCount).toBe(4);
    expect(dealt.find((p) => p.id === "b")?.cards.length).toBe(0);
  });

  it("keeps third player cardCount in hidden-cards blind revival", () => {
    const players = [
      player("a", 4),
      player("b", 0, { isBlind: true, cards: [] }),
      player("c", 5),
    ];
    const bid: Bid = { count: 1, rank: "3", playerId: "b", playerName: "b" };
    const reveal = resolveChallenge(players, bid, "a", "a", ["b", "a", "c"], 6);
    const resolved = resolveRoundAfterReveal(
      players,
      reveal,
      room({ deck: [], blindMode: "HIDDEN_CARDS_BLIND", blindGetsCards: true })
    );
    const third = resolved.players.find((p) => p.id === "c");

    expect(third?.cardCount).toBe(5);
    expect(third?.cards.length).toBe(5);
  });

  it("refills deck during round resolve so observers keep their cardCount", () => {
    const players = [
      player("a", 4),
      player("b", 0, { isBlind: true, cards: [] }),
      player("c", 5),
    ];
    const bid: Bid = { count: 1, rank: "3", playerId: "b", playerName: "b" };
    const reveal = resolveChallenge(players, bid, "a", "a", ["b", "a", "c"], 6);
    const resolved = resolveRoundAfterReveal(players, reveal, room({ deck: [] }));
    const third = resolved.players.find((p) => p.id === "c");

    expect(third?.cardCount).toBe(5);
    expect(third?.cards.length).toBe(5);
  });
});

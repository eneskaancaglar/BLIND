export type Rank =
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export type Suit = "H" | "D" | "C" | "S";

export type Card = {
  rank: Rank | "2";
  suit: Suit;
};

export type Bid = {
  count: number;
  rank: Rank;
  playerId: string;
  playerName: string;
};

export type RoomStatus = "waiting" | "playing" | "finished";

export type GamePhase = "bidding" | "revealed" | "round_end";

export type Room = {
  code: string;
  hostId: string;
  status: RoomStatus;
  phase: GamePhase;
  currentTurnIndex: number;
  turnOrder: string[];
  currentBid: Bid | null;
  roundNumber: number;
  deck: Card[];
  winnerId: string | null;
  winnerName: string | null;
  lastLoserId: string | null;
  lastLoserName: string | null;
  revealResult: RevealResult | null;
  createdAt: number;
};

export type Player = {
  id: string;
  name: string;
  isHost: boolean;
  cards: Card[];
  cardCount: number;
  isBlind: boolean;
  isEliminated: boolean;
  joinedAt: number;
};

export type RevealResult = {
  actualCount: number;
  openerId: string;
  openerName: string;
  lastBidderId: string;
  lastBidderName: string;
  loserId: string;
  loserName: string;
  reason: string;
};

export type PlayerView = Omit<Player, "cards"> & {
  cards?: Card[];
  hiddenCount?: number;
};

export const RANKS: Rank[] = [
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

export const RANK_LABELS: Record<Rank, string> = {
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
  J: "Vale",
  Q: "Kız",
  K: "Papaz",
  A: "As",
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  H: "♥",
  D: "♦",
  C: "♣",
  S: "♠",
};

export const SUIT_COLORS: Record<Suit, string> = {
  H: "text-red-400",
  D: "text-red-400",
  C: "text-white",
  S: "text-white",
};

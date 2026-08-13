import type { Rank, Suit } from "./types";

export const CARD_BACK_IMAGE = "/cards/back.png";
export const CARD_BACK_RED_IMAGE = "/cards/back-red.png";

const RANKS: Array<Rank | "2"> = [
  "2",
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

const SUITS: Suit[] = ["H", "D", "C", "S"];

/** Blind custom deck — one PNG per suit and rank */
export function getCardFaceImage(rank: Rank | "2", suit: Suit): string {
  return `/cards/${suit}/${rank}.png`;
}

export function getCardBackImage(backColor?: "blue" | "red"): string {
  return backColor === "red" ? CARD_BACK_RED_IMAGE : CARD_BACK_IMAGE;
}

export const ALL_CARD_FACE_PATHS: string[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => getCardFaceImage(rank, suit))
);

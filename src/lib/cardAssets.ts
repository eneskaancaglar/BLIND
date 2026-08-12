import type { Rank } from "./types";

/** Occult-themed card faces sliced from the game sprite sheet */
export const CARD_FACE_IMAGES: Record<Rank | "2", string> = {
  "2": "/cards/2.png",
  "3": "/cards/3.png",
  "4": "/cards/4.png",
  "5": "/cards/5.png",
  "6": "/cards/6.png",
  "7": "/cards/7.png",
  "8": "/cards/8.png",
  "9": "/cards/9.png",
  "10": "/cards/10.png",
  J: "/cards/J.png",
  Q: "/cards/Q.png",
  K: "/cards/K.png",
  A: "/cards/A.png",
};

export const CARD_BACK_IMAGE = "/cards/back.png";

export function getCardFaceImage(rank: Rank | "2"): string {
  return CARD_FACE_IMAGES[rank] ?? CARD_FACE_IMAGES["3"];
}

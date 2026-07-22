export type SeatPosition = "top" | "top-left" | "top-right" | "left" | "right" | "bottom";

const SEAT_ANCHORS: Record<SeatPosition, { x: number; y: number }> = {
  top: { x: 50, y: 26 },
  "top-left": { x: 28, y: 28 },
  "top-right": { x: 72, y: 28 },
  left: { x: 18, y: 50 },
  right: { x: 82, y: 50 },
  bottom: { x: 50, y: 88 },
};

export function getSeatAnchorPercent(seat: SeatPosition): { x: number; y: number } {
  return SEAT_ANCHORS[seat];
}

export function getOpponentSeatPosition(index: number, total: number): SeatPosition {
  if (total <= 1) return "top";
  if (total === 2) return index === 0 ? "top-left" : "top-right";
  if (total === 3) return (["top-left", "top", "top-right"] as const)[index] ?? "top";
  if (total === 4) {
    return (["left", "top-left", "top-right", "right"] as const)[index] ?? "top";
  }
  const positions: SeatPosition[] = ["left", "top-left", "top", "top-right", "right"];
  return positions[index % positions.length] ?? "top";
}

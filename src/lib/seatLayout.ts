export type SeatPosition = "top" | "top-left" | "top-right" | "left" | "right" | "bottom";

const SEAT_ANCHORS: Record<SeatPosition, { x: number; y: number }> = {
  top: { x: 50, y: 16 },
  "top-left": { x: 20, y: 20 },
  "top-right": { x: 80, y: 20 },
  left: { x: 10, y: 44 },
  right: { x: 90, y: 44 },
  bottom: { x: 50, y: 92 },
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

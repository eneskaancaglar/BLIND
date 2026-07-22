export type SeatPosition = "top" | "top-left" | "top-right" | "left" | "right" | "bottom";

const SEAT_ANCHORS: Record<SeatPosition, { x: number; y: number }> = {
  top: { x: 50, y: 12 },
  "top-left": { x: 22, y: 16 },
  "top-right": { x: 78, y: 16 },
  left: { x: 6, y: 52 },
  right: { x: 94, y: 52 },
  bottom: { x: 50, y: 84 },
};

export function getSeatAnchorPercent(seat: SeatPosition): { x: number; y: number } {
  return SEAT_ANCHORS[seat];
}

export function getOpponentSeatPosition(index: number, total: number): SeatPosition {
  if (total <= 1) return "top";
  if (total === 2) return index === 0 ? "left" : "right";
  if (total === 3) return (["left", "top", "right"] as const)[index] ?? "top";
  if (total === 4) {
    return (["left", "top-left", "top-right", "right"] as const)[index] ?? "top";
  }
  const positions: SeatPosition[] = ["left", "top-left", "top", "top-right", "right"];
  return positions[index % positions.length] ?? "top";
}

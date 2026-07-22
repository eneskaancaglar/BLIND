export type SeatPosition = "top" | "top-left" | "top-right" | "left" | "right" | "bottom";

const TABLE_CENTER = { x: 50, y: 46 };

const SEAT_ANCHORS: Record<SeatPosition, { x: number; y: number }> = {
  top: { x: 50, y: 12 },
  "top-left": { x: 26, y: 16 },
  "top-right": { x: 74, y: 16 },
  left: { x: 18, y: 52 },
  right: { x: 82, y: 52 },
  bottom: { x: 50, y: 84 },
};

export function getSeatAnchorPercent(seat: SeatPosition): { x: number; y: number } {
  return SEAT_ANCHORS[seat];
}

/** Arrow endpoints pulled toward table center — stays in open felt, not under seats. */
export function getArrowAnchorPercent(seat: SeatPosition): { x: number; y: number } {
  const anchor = SEAT_ANCHORS[seat];
  const dx = TABLE_CENTER.x - anchor.x;
  const dy = TABLE_CENTER.y - anchor.y;
  const pull = seat === "bottom" ? 0.42 : seat === "top" ? 0.38 : 0.48;
  return {
    x: anchor.x + dx * pull,
    y: anchor.y + dy * pull,
  };
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

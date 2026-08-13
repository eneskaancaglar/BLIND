export type SeatPosition = "top" | "top-left" | "top-right" | "left" | "right" | "bottom";

const TABLE_CENTER = { x: 50, y: 44 };

const SEAT_ANCHORS: Record<SeatPosition, { x: number; y: number }> = {
  top: { x: 50, y: 13 },
  "top-left": { x: 24, y: 17 },
  "top-right": { x: 76, y: 17 },
  left: { x: 13, y: 46 },
  right: { x: 87, y: 46 },
  bottom: { x: 50, y: 78 },
};

export type SeatCardLayout = {
  /** Z rotation of the whole fan toward table center */
  containerRotate: number;
  pivotX: string;
  pivotY: string;
  maxSpreadDeg: number;
  tiltX: number;
};

const SEAT_CARD_LAYOUTS: Record<SeatPosition, SeatCardLayout> = {
  bottom: { containerRotate: 0, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 56, tiltX: 12 },
  top: { containerRotate: 180, pivotX: "82%", pivotY: "100%", maxSpreadDeg: 42, tiltX: 14 },
  left: { containerRotate: 90, pivotX: "94%", pivotY: "90%", maxSpreadDeg: 38, tiltX: 40 },
  right: { containerRotate: -90, pivotX: "6%", pivotY: "90%", maxSpreadDeg: 38, tiltX: 40 },
  "top-left": { containerRotate: 128, pivotX: "88%", pivotY: "94%", maxSpreadDeg: 36, tiltX: 32 },
  "top-right": { containerRotate: -128, pivotX: "12%", pivotY: "94%", maxSpreadDeg: 36, tiltX: 32 },
};

export function getSeatCardLayout(seat: SeatPosition): SeatCardLayout {
  return SEAT_CARD_LAYOUTS[seat];
}

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

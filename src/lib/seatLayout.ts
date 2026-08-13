export type SeatPosition = "top" | "top-left" | "top-right" | "left" | "right" | "bottom";

const TABLE_CENTER = { x: 50, y: 44 };

/** Felt içi elips — rakipler bu sınırda eşit aralıklı */
const TABLE_ELLIPSE = { cx: 50, cy: 46, rx: 20, ry: 21 };

/** Alt (yerel oyuncu) hariç yay: sol → üst → sağ */
const OPPONENT_ARC_START_DEG = 135;
const OPPONENT_ARC_SPAN_DEG = 270;

export type SeatCardLayout = {
  containerRotate: number;
  pivotX: string;
  pivotY: string;
  maxSpreadDeg: number;
  tiltX: number;
};

const SEAT_CARD_LAYOUTS: Record<SeatPosition, SeatCardLayout> = {
  bottom: { containerRotate: 0, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 58, tiltX: 0 },
  top: { containerRotate: 180, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 52, tiltX: 0 },
  left: { containerRotate: 90, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 48, tiltX: 0 },
  right: { containerRotate: -90, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 48, tiltX: 0 },
  "top-left": { containerRotate: 135, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 46, tiltX: 0 },
  "top-right": { containerRotate: -135, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 46, tiltX: 0 },
};

export function getSeatCardLayout(seat: SeatPosition): SeatCardLayout {
  return SEAT_CARD_LAYOUTS[seat];
}

/** Masa merkezine bakan fan rotasyonu (dinamik koltuklar). */
export function getSeatLayoutFromAnchor(x: number, y: number): SeatCardLayout {
  const dx = TABLE_CENTER.x - x;
  const dy = TABLE_CENTER.y - y;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return {
    containerRotate: angleDeg + 90,
    pivotX: "50%",
    pivotY: "100%",
    maxSpreadDeg: 50,
    tiltX: 0,
  };
}

export function getSeatAnchorPercent(_seat: SeatPosition): { x: number; y: number } {
  return getOpponentSeatAnchors(1)[0] ?? { x: 50, y: TABLE_ELLIPSE.cy - TABLE_ELLIPSE.ry };
}

/** Rakipleri masa elipsi üzerinde eşit aralıklı yerleştir. */
export function getOpponentSeatAnchors(count: number): Array<{ x: number; y: number }> {
  if (count <= 0) return [];

  if (count === 1) {
    return [{ x: TABLE_ELLIPSE.cx, y: TABLE_ELLIPSE.cy - TABLE_ELLIPSE.ry }];
  }

  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    const deg = OPPONENT_ARC_START_DEG + OPPONENT_ARC_SPAN_DEG * t;
    const rad = (deg * Math.PI) / 180;
    return {
      x: TABLE_ELLIPSE.cx + TABLE_ELLIPSE.rx * Math.cos(rad),
      y: TABLE_ELLIPSE.cy + TABLE_ELLIPSE.ry * Math.sin(rad),
    };
  });
}

export function getSeatPositionFromAnchor(x: number, y: number): SeatPosition {
  const dx = x - TABLE_CENTER.x;
  const dy = y - TABLE_CENTER.y;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  if (angle < -125 || angle > 125) return "top";
  if (angle < -55) return "top-left";
  if (angle > 55) return "top-right";
  if (angle < 0) return "left";
  return "right";
}

export function getArrowAnchorPercent(seat: SeatPosition): { x: number; y: number } {
  const anchor = getSeatAnchorPercent(seat);
  const dx = TABLE_CENTER.x - anchor.x;
  const dy = TABLE_CENTER.y - anchor.y;
  const pull = seat === "bottom" ? 0.42 : seat === "top" ? 0.38 : 0.48;
  return {
    x: anchor.x + dx * pull,
    y: anchor.y + dy * pull,
  };
}

export function getOpponentSeatPosition(index: number, total: number): SeatPosition {
  const anchors = getOpponentSeatAnchors(total);
  const anchor = anchors[index];
  if (!anchor) return "top";
  return getSeatPositionFromAnchor(anchor.x, anchor.y);
}

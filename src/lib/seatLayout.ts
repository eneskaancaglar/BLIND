export type SeatPosition = "top" | "top-left" | "top-right" | "left" | "right" | "bottom";

/** Maça sembolü / idda merkezi */
export const TABLE_CENTER = { x: 50, y: 44 };

/** Felt içi elips — avatarlar altın çizgi / rim hizasında */
const TABLE_ELLIPSE = { cx: 50, cy: 44, rx: 23.5, ry: 27.5 };

/** Yerel oyuncu (alt, 6 o'clock) */
const LOCAL_SEAT_ANGLE_DEG = 90;

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

/** Masa merkezine bakan fan rotasyonu. */
export function getSeatLayoutFromAnchor(x: number, y: number): SeatCardLayout {
  const toCenterX = TABLE_CENTER.x - x;
  const toCenterY = TABLE_CENTER.y - y;
  const angleDeg = (Math.atan2(toCenterY, toCenterX) * 180) / Math.PI;
  return {
    containerRotate: angleDeg + 90,
    pivotX: "50%",
    pivotY: "100%",
    maxSpreadDeg: 50,
    tiltX: 0,
  };
}

/** Koltuktan dışarı (rim) birim vektör. */
export function getSeatOutwardVector(x: number, y: number): { x: number; y: number } {
  const dx = x - TABLE_CENTER.x;
  const dy = y - TABLE_CENTER.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/** Yerel oyuncu eli — alt orta, felt içinde. */
export function getPlayerHandAnchor(): { x: number; y: number } {
  const rad = (LOCAL_SEAT_ANGLE_DEG * Math.PI) / 180;
  const cardInset = 0.62;
  return {
    x: TABLE_ELLIPSE.cx + TABLE_ELLIPSE.rx * Math.cos(rad) * cardInset,
    y: TABLE_ELLIPSE.cy + TABLE_ELLIPSE.ry * Math.sin(rad) * cardInset,
  };
}

export function getSeatAnchorPercent(_seat: SeatPosition): { x: number; y: number } {
  const rad = (270 * Math.PI) / 180;
  return {
    x: TABLE_ELLIPSE.cx + TABLE_ELLIPSE.rx * Math.cos(rad),
    y: TABLE_ELLIPSE.cy + TABLE_ELLIPSE.ry * Math.sin(rad),
  };
}

/**
 * Rakipleri masada eşit aralıklı yerleştir (referans: 6 kişilik daire).
 * Yerel oyuncu altta; rakipler saat yönünde eşit dağılır.
 */
export function getOpponentSeatAnchors(opponentCount: number): Array<{ x: number; y: number }> {
  if (opponentCount <= 0) return [];

  const totalSeats = opponentCount + 1;
  const stepDeg = 360 / totalSeats;

  return Array.from({ length: opponentCount }, (_, index) => {
    const seatIndex = index + 1;
    const deg = LOCAL_SEAT_ANGLE_DEG - seatIndex * stepDeg;
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

export function getTableCenterPercent(): { x: number; y: number } {
  return { ...TABLE_CENTER };
}

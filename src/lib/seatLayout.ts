export type SeatPosition = "top" | "top-left" | "top-right" | "left" | "right" | "bottom";

/** Maça sembolü / idda merkezi */
export const TABLE_CENTER = { x: 50, y: 44 };

/** Kartlar — felt içi */
const FELT_ELLIPSE = { cx: 50, cy: 44, rx: 18.5, ry: 22 };

/** Avatarlar — masa dışı / ahşap rim */
const AVATAR_ELLIPSE = { cx: 50, cy: 44, rx: 27, ry: 31 };

const LOCAL_SEAT_ANGLE_DEG = 90;

export type OpponentSeatLayout = {
  avatar: { x: number; y: number };
  cards: { x: number; y: number };
};

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

function seatAngleDeg(index: number, opponentCount: number): number {
  const totalSeats = opponentCount + 1;
  const stepDeg = 360 / totalSeats;
  return LOCAL_SEAT_ANGLE_DEG - (index + 1) * stepDeg;
}

function pointOnEllipse(
  ellipse: { cx: number; cy: number; rx: number; ry: number },
  deg: number,
  scale = 1
): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return {
    x: ellipse.cx + ellipse.rx * scale * Math.cos(rad),
    y: ellipse.cy + ellipse.ry * scale * Math.sin(rad),
  };
}

export function getSeatCardLayout(seat: SeatPosition): SeatCardLayout {
  return SEAT_CARD_LAYOUTS[seat];
}

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

export function getSeatOutwardVector(x: number, y: number): { x: number; y: number } {
  const dx = x - TABLE_CENTER.x;
  const dy = y - TABLE_CENTER.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/** Yerel oyuncu eli — felt içinde, alt orta. */
export function getPlayerHandAnchor(): { x: number; y: number } {
  return pointOnEllipse(FELT_ELLIPSE, LOCAL_SEAT_ANGLE_DEG, 0.52);
}

export function getSeatAnchorPercent(_seat: SeatPosition): { x: number; y: number } {
  return pointOnEllipse(AVATAR_ELLIPSE, 270);
}

/** Avatar dış elips, kartlar iç elips — aynı açıda eşit aralık. */
export function getOpponentSeatLayouts(opponentCount: number): OpponentSeatLayout[] {
  if (opponentCount <= 0) return [];

  return Array.from({ length: opponentCount }, (_, index) => {
    const deg = seatAngleDeg(index, opponentCount);
    return {
      avatar: pointOnEllipse(AVATAR_ELLIPSE, deg),
      cards: pointOnEllipse(FELT_ELLIPSE, deg, 0.9),
    };
  });
}

/** @deprecated use getOpponentSeatLayouts */
export function getOpponentSeatAnchors(opponentCount: number): Array<{ x: number; y: number }> {
  return getOpponentSeatLayouts(opponentCount).map((layout) => layout.avatar);
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
  const layouts = getOpponentSeatLayouts(total);
  const layout = layouts[index];
  if (!layout) return "top";
  return getSeatPositionFromAnchor(layout.cards.x, layout.cards.y);
}

export function getTableCenterPercent(): { x: number; y: number } {
  return { ...TABLE_CENTER };
}

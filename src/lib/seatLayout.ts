export type SeatPosition = "top" | "top-left" | "top-right" | "left" | "right" | "bottom";

export const TABLE_CENTER = { x: 50, y: 42 };

/** Felt içi oyun alanı elipsi */
const TABLE_ELLIPSE = { cx: 50, cy: 42, rx: 17.5, ry: 19 };

/** Alt oyuncu hariç: sol-üst → üst → sağ-üst (derece, 0=sağ, 90=alt) */
const OPPONENT_ARC_START_DEG = 205;
const OPPONENT_ARC_END_DEG = 335;

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

/** Koltuktan dışarı (masa kenarına) birim vektör — avatar yerleşimi için. */
export function getSeatOutwardVector(x: number, y: number): { x: number; y: number } {
  const dx = x - TABLE_CENTER.x;
  const dy = y - TABLE_CENTER.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

export function getPlayerHandAnchor(): { x: number; y: number } {
  return {
    x: TABLE_ELLIPSE.cx,
    y: TABLE_ELLIPSE.cy + TABLE_ELLIPSE.ry * 0.72,
  };
}

export function getSeatAnchorPercent(_seat: SeatPosition): { x: number; y: number } {
  return getOpponentSeatAnchors(1)[0] ?? { x: 50, y: TABLE_ELLIPSE.cy - TABLE_ELLIPSE.ry };
}

/** Rakipleri felt elipsi üzerinde eşit aralıklı yerleştir (alt bölge hariç). */
export function getOpponentSeatAnchors(count: number): Array<{ x: number; y: number }> {
  if (count <= 0) return [];

  if (count === 1) {
    const rad = (270 * Math.PI) / 180;
    return [
      {
        x: TABLE_ELLIPSE.cx + TABLE_ELLIPSE.rx * Math.cos(rad),
        y: TABLE_ELLIPSE.cy + TABLE_ELLIPSE.ry * Math.sin(rad),
      },
    ];
  }

  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    const deg = OPPONENT_ARC_START_DEG + t * (OPPONENT_ARC_END_DEG - OPPONENT_ARC_START_DEG);
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

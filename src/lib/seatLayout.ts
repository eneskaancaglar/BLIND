export type SeatPosition =
  | "top"
  | "top-left"
  | "top-right"
  | "left"
  | "right"
  | "bottom-left"
  | "bottom-right"
  | "bottom";

/** Maça sembolü / idda merkezi */
export const TABLE_CENTER = { x: 50, y: 44 };

const FELT_ELLIPSE = { cx: 50, cy: 44, rx: 18.5, ry: 22 };
const AVATAR_ELLIPSE = { cx: 50, cy: 44, rx: 38, ry: 36 };

const LOCAL_SEAT_ANGLE_DEG = 90;

export type OpponentSeatLayout = {
  seat: SeatPosition;
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

/** Sabit koltuk koordinatları — kartlar avatar ile merkez arası (felt üstü) */
const SEAT_ANCHORS: Record<SeatPosition, { avatar: { x: number; y: number }; cards: { x: number; y: number } }> = {
  top: {
    avatar: { x: 50, y: 7 },
    cards: { x: 50, y: 24 },
  },
  "top-left": {
    avatar: { x: 16, y: 12 },
    cards: { x: 34, y: 26 },
  },
  "top-right": {
    avatar: { x: 84, y: 12 },
    cards: { x: 66, y: 26 },
  },
  left: {
    avatar: { x: 8, y: 42 },
    cards: { x: 28, y: 44 },
  },
  right: {
    avatar: { x: 92, y: 42 },
    cards: { x: 72, y: 44 },
  },
  "bottom-left": {
    avatar: { x: 16, y: 72 },
    cards: { x: 34, y: 58 },
  },
  "bottom-right": {
    avatar: { x: 84, y: 72 },
    cards: { x: 66, y: 58 },
  },
  bottom: {
    avatar: { x: 50, y: 86 },
    cards: { x: 50, y: 82 },
  },
};

/** Avatar — frame padding bölgesi (masa PNG dışı, siyah arka plan) */
const AVATAR_RING_ANCHORS: Record<SeatPosition, { x: number; y: number }> = {
  top: { x: 50, y: 6 },
  "top-left": { x: 10, y: 7 },
  "top-right": { x: 90, y: 7 },
  left: { x: 8, y: 46 },
  right: { x: 92, y: 46 },
  "bottom-left": { x: 10, y: 88 },
  "bottom-right": { x: 90, y: 88 },
  bottom: { x: 50, y: 92 },
};

/** Rakip koltuk sırası — toplam oyuncu sayısına göre (3–6 kişi) */
const OPPONENT_SEATS_BY_PLAYER_COUNT: Record<number, SeatPosition[]> = {
  2: ["top"],
  3: ["top-left", "top-right"],
  4: ["top", "left", "right"],
  5: ["top-left", "top-right", "bottom-left", "bottom-right"],
  6: ["top", "top-left", "top-right", "bottom-left", "bottom-right"],
};

const SEAT_CARD_LAYOUTS: Record<SeatPosition, SeatCardLayout> = {
  bottom: { containerRotate: 0, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 58, tiltX: 0 },
  top: { containerRotate: 180, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 44, tiltX: 0 },
  left: { containerRotate: 90, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 40, tiltX: 0 },
  right: { containerRotate: -90, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 40, tiltX: 0 },
  "top-left": { containerRotate: 135, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 38, tiltX: 0 },
  "top-right": { containerRotate: -135, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 38, tiltX: 0 },
  "bottom-left": { containerRotate: 52, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 36, tiltX: 0 },
  "bottom-right": { containerRotate: -52, pivotX: "50%", pivotY: "100%", maxSpreadDeg: 36, tiltX: 0 },
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

function layoutFromSeat(seat: SeatPosition): OpponentSeatLayout {
  const anchors = SEAT_ANCHORS[seat];
  return {
    seat,
    avatar: { ...AVATAR_RING_ANCHORS[seat] },
    cards: { ...anchors.cards },
  };
}

function fallbackOpponentLayouts(opponentCount: number): OpponentSeatLayout[] {
  return Array.from({ length: opponentCount }, (_, index) => {
    const deg = seatAngleDeg(index, opponentCount);
    const avatar = pointOnEllipse(AVATAR_ELLIPSE, deg);
    const cards = pointOnEllipse(FELT_ELLIPSE, deg, 0.88);
    const seat = getSeatPositionFromAnchor(cards.x, cards.y);
    return { seat, avatar, cards };
  });
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
    maxSpreadDeg: 44,
    tiltX: 0,
  };
}

export function getSeatOutwardVector(x: number, y: number): { x: number; y: number } {
  const dx = x - TABLE_CENTER.x;
  const dy = y - TABLE_CENTER.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/** Yerel oyuncu eli — alt orta, avatarın hemen üstünde */
export function getPlayerHandAnchor(): { x: number; y: number } {
  return { ...SEAT_ANCHORS.bottom.cards };
}

export function getSeatAnchorPercent(seat: SeatPosition): { x: number; y: number } {
  return { ...SEAT_ANCHORS[seat].avatar };
}

/** Oyuncu sayısına göre sabit koltuk düzeni (3–6 kişi). */
export function getOpponentSeatLayouts(opponentCount: number): OpponentSeatLayout[] {
  if (opponentCount <= 0) return [];

  const totalPlayers = opponentCount + 1;
  const preset = OPPONENT_SEATS_BY_PLAYER_COUNT[totalPlayers];

  if (preset && preset.length === opponentCount) {
    return preset.map((seat) => layoutFromSeat(seat));
  }

  return fallbackOpponentLayouts(opponentCount);
}

/** @deprecated use getOpponentSeatLayouts */
export function getOpponentSeatAnchors(opponentCount: number): Array<{ x: number; y: number }> {
  return getOpponentSeatLayouts(opponentCount).map((layout) => layout.avatar);
}

export function getSeatPositionFromAnchor(x: number, y: number): SeatPosition {
  const dx = x - TABLE_CENTER.x;
  const dy = y - TABLE_CENTER.y;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  if (dy > 18 && Math.abs(dx) < 14) return "bottom";
  if (dy > 8 && dx < -10) return "bottom-left";
  if (dy > 8 && dx > 10) return "bottom-right";
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
  const pull =
    seat === "bottom" || seat === "bottom-left" || seat === "bottom-right"
      ? 0.42
      : seat === "top"
        ? 0.38
        : 0.48;
  return {
    x: anchor.x + dx * pull,
    y: anchor.y + dy * pull,
  };
}

export function getOpponentSeatPosition(index: number, total: number): SeatPosition {
  const layouts = getOpponentSeatLayouts(total);
  const layout = layouts[index];
  if (!layout) return "top";
  return layout.seat;
}

/** Rakip fan görünümü — en fazla 5 kapalı kart */
export function getOpponentVisualCardCount(count: number): number {
  if (count <= 0) return 0;
  return count;
}

/** Ana oyuncu fan görünümü — en fazla 10 kart */
export function getPlayerVisualCardCount(count: number): number {
  if (count <= 0) return 0;
  return Math.min(count, 10);
}

export function getTableCenterPercent(): { x: number; y: number } {
  return { ...TABLE_CENTER };
}

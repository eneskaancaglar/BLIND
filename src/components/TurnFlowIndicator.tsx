"use client";

import { getOpponentSeatPosition, getSeatAnchorPercent } from "@/lib/seatLayout";
import type { Player } from "@/lib/types";

type TurnFlowIndicatorProps = {
  turnOrder: string[];
  /** Current bidder — only the arrow to the next player glows */
  activeTurnId?: string;
  playerId: string;
  opponents: Player[];
  players: Player[];
};

const TABLE_CENTER = { x: 50, y: 46 };
const OUTWARD_BULGE = 16;

/** Quadratic arc bulging outward from the table center (not inward). */
function outwardArcPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = mx - TABLE_CENTER.x;
  const dy = my - TABLE_CENTER.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (dx / len) * OUTWARD_BULGE;
  const cy = my + (dy / len) * OUTWARD_BULGE;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function playerAnchor(
  id: string,
  playerId: string,
  opponents: Player[]
): { x: number; y: number } {
  if (id === playerId) {
    return getSeatAnchorPercent("bottom");
  }
  const index = opponents.findIndex((player) => player.id === id);
  if (index < 0) return getSeatAnchorPercent("top");
  const seat = getOpponentSeatPosition(index, opponents.length);
  return getSeatAnchorPercent(seat);
}

export function TurnFlowIndicator({
  turnOrder,
  activeTurnId,
  playerId,
  opponents,
  players,
}: TurnFlowIndicatorProps) {
  const activeOrder = turnOrder.filter((id) => {
    const player = players.find((p) => p.id === id);
    return player && !player.isEliminated;
  });

  if (activeOrder.length < 2) return null;

  const segments = activeOrder.map((fromId, index) => {
    const toId = activeOrder[(index + 1) % activeOrder.length];
    const from = playerAnchor(fromId, playerId, opponents);
    const to = playerAnchor(toId, playerId, opponents);
    const isActive = Boolean(activeTurnId && fromId === activeTurnId);
    return { fromId, toId, from, to, isActive, key: `${fromId}-${toId}` };
  });

  return (
    <svg
      className="turn-flow-svg pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <marker
          id="turn-flow-arrow"
          markerWidth="5"
          markerHeight="5"
          refX="4.5"
          refY="2.5"
          orient="auto"
        >
          <path d="M0,0 L5,2.5 L0,5 Z" fill="rgba(196, 181, 253, 0.75)" />
        </marker>
        <marker
          id="turn-flow-arrow-active"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(253, 224, 71, 1)" />
        </marker>
      </defs>

      {segments.map((segment) => (
        <path
          key={segment.key}
          d={outwardArcPath(segment.from.x, segment.from.y, segment.to.x, segment.to.y)}
          fill="none"
          stroke={segment.isActive ? "rgba(253, 224, 71, 0.98)" : "rgba(167, 139, 250, 0.62)"}
          strokeWidth={segment.isActive ? 0.62 : 0.42}
          strokeLinecap="round"
          markerEnd={segment.isActive ? "url(#turn-flow-arrow-active)" : "url(#turn-flow-arrow)"}
          className={segment.isActive ? "turn-flow-active" : "turn-flow-idle"}
        />
      ))}
    </svg>
  );
}

"use client";

import { getArrowAnchorPercent, getOpponentSeatPosition } from "@/lib/seatLayout";
import type { Player } from "@/lib/types";

type TurnFlowIndicatorProps = {
  turnOrder: string[];
  /** Current bidder — only the arrow to the next player glows */
  activeTurnId?: string;
  playerId: string;
  opponents: Player[];
  players: Player[];
};

const END_INSET = 3;

function shortenSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: x1 + ux * END_INSET,
    y1: y1 + uy * END_INSET,
    x2: x2 - ux * END_INSET,
    y2: y2 - uy * END_INSET,
  };
}

/** Short arc through the open center of the table. */
function centerArcPath(x1: number, y1: number, x2: number, y2: number): string {
  const trimmed = shortenSegment(x1, y1, x2, y2);
  const mx = (trimmed.x1 + trimmed.x2) / 2;
  const my = (trimmed.y1 + trimmed.y2) / 2;
  return `M ${trimmed.x1} ${trimmed.y1} Q ${mx} ${my} ${trimmed.x2} ${trimmed.y2}`;
}

function playerArrowAnchor(
  id: string,
  playerId: string,
  opponents: Player[]
): { x: number; y: number } {
  if (id === playerId) {
    return getArrowAnchorPercent("bottom");
  }
  const index = opponents.findIndex((player) => player.id === id);
  if (index < 0) return getArrowAnchorPercent("top");
  const seat = getOpponentSeatPosition(index, opponents.length);
  return getArrowAnchorPercent(seat);
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
    const toId = activeOrder[(index - 1 + activeOrder.length) % activeOrder.length];
    const from = playerArrowAnchor(fromId, playerId, opponents);
    const to = playerArrowAnchor(toId, playerId, opponents);
    const isActive = Boolean(activeTurnId && fromId === activeTurnId);
    return { fromId, toId, from, to, isActive, key: `${fromId}-${toId}` };
  });

  return (
    <svg
      className="turn-flow-svg pointer-events-none absolute inset-0 z-[3] h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <marker
          id="turn-flow-arrow"
          markerWidth="4.5"
          markerHeight="4.5"
          refX="4"
          refY="2.25"
          orient="auto"
        >
          <path d="M0,0 L4.5,2.25 L0,4.5 Z" fill="rgba(196, 181, 253, 0.9)" />
        </marker>
        <marker
          id="turn-flow-arrow-active"
          markerWidth="5"
          markerHeight="5"
          refX="4.5"
          refY="2.5"
          orient="auto"
        >
          <path d="M0,0 L5,2.5 L0,5 Z" fill="rgba(253, 224, 71, 1)" />
        </marker>
      </defs>

      {segments.map((segment) => (
        <path
          key={segment.key}
          d={centerArcPath(segment.from.x, segment.from.y, segment.to.x, segment.to.y)}
          fill="none"
          stroke={segment.isActive ? "rgba(253, 224, 71, 0.98)" : "rgba(167, 139, 250, 0.72)"}
          strokeWidth={segment.isActive ? 0.68 : 0.48}
          strokeLinecap="round"
          markerEnd={segment.isActive ? "url(#turn-flow-arrow-active)" : "url(#turn-flow-arrow)"}
          className={segment.isActive ? "turn-flow-active" : "turn-flow-idle"}
        />
      ))}
    </svg>
  );
}

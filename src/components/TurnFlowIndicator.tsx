"use client";

import { getOpponentSeatPosition, getSeatAnchorPercent } from "@/lib/seatLayout";
import type { Player } from "@/lib/types";

type TurnFlowIndicatorProps = {
  turnOrder: string[];
  turnPlayerId?: string;
  playerId: string;
  opponents: Player[];
  players: Player[];
};

function arcPath(x1: number, y1: number, x2: number, y2: number, bulge = 1): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const cx = 50 + (mx - 50) * 0.15;
  const cy = 42 + (my - 42) * 0.15 * bulge;
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
  turnPlayerId,
  playerId,
  opponents,
  players,
}: TurnFlowIndicatorProps) {
  const activeOrder = turnOrder.filter((id) => {
    const player = players.find((p) => p.id === id);
    return player && !player.isEliminated;
  });

  if (activeOrder.length < 2) return null;

  const currentIndex = turnPlayerId ? activeOrder.indexOf(turnPlayerId) : -1;
  const segments = activeOrder.map((fromId, index) => {
    const toId = activeOrder[(index + 1) % activeOrder.length];
    const from = playerAnchor(fromId, playerId, opponents);
    const to = playerAnchor(toId, playerId, opponents);
    const isActive = index === currentIndex;
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
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(167, 139, 250, 0.85)" />
        </marker>
        <marker
          id="turn-flow-arrow-active"
          markerWidth="7"
          markerHeight="7"
          refX="5.5"
          refY="3.5"
          orient="auto"
        >
          <path d="M0,0 L7,3.5 L0,7 Z" fill="rgba(250, 204, 21, 0.95)" />
        </marker>
      </defs>

      {segments.map((segment) => (
        <path
          key={segment.key}
          d={arcPath(segment.from.x, segment.from.y, segment.to.x, segment.to.y)}
          fill="none"
          stroke={segment.isActive ? "rgba(250, 204, 21, 0.9)" : "rgba(167, 139, 250, 0.35)"}
          strokeWidth={segment.isActive ? 0.55 : 0.35}
          strokeDasharray={segment.isActive ? "2 1.2" : "none"}
          markerEnd={segment.isActive ? "url(#turn-flow-arrow-active)" : "url(#turn-flow-arrow)"}
          className={segment.isActive ? "turn-flow-active" : undefined}
        />
      ))}

      {turnPlayerId ? (
        (() => {
          const anchor = playerAnchor(turnPlayerId, playerId, opponents);
          return (
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r={2.8}
              fill="none"
              stroke="rgba(250, 204, 21, 0.95)"
              strokeWidth={0.45}
              className="turn-flow-current-ring"
            />
          );
        })()
      ) : null}
    </svg>
  );
}

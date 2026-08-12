"use client";

/** Decorative poker-room layers — pointer-events none, no layout impact. */
export function GameRoomAmbience() {
  return (
    <div className="game-room-ambient pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="room-ceiling-beam" />
      <div className="room-ceiling-beam room-ceiling-beam-secondary" />
      <div className="room-wall-glow room-wall-glow-left" />
      <div className="room-wall-glow room-wall-glow-right" />
      <div className="room-floor-shine" />
      <div className="room-table-shadow" />
      <div className="room-vignette" />
      <div className="room-dust">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="room-dust-particle" data-i={i} />
        ))}
      </div>
    </div>
  );
}

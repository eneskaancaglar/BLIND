"use client";

import { getAvatarById, resolvePlayerAvatarId } from "@/lib/avatars";

type PlayerAvatarProps = {
  avatarId?: string;
  player?: { avatarId?: string; isBot?: boolean; id?: string; name?: string };
  size?: "sm" | "md" | "lg";
  isTurn?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
};

const SIZE_PX = {
  sm: 2.1,
  md: 2.65,
  lg: 3.2,
};

export function PlayerAvatar({
  avatarId,
  player,
  size = "md",
  isTurn = false,
  onClick,
  className = "",
  title,
}: PlayerAvatarProps) {
  const resolvedId = avatarId ?? (player ? resolvePlayerAvatarId(player) : "fox");
  const avatar = getAvatarById(resolvedId);
  const dim = SIZE_PX[size];

  const inner = (
    <span
      className={`player-avatar ${isTurn ? "player-avatar-turn" : ""} ${className}`}
      style={{
        width: `${dim}rem`,
        height: `${dim}rem`,
        background: avatar.gradient,
      }}
      title={title}
    >
      <span className="player-avatar-emoji" aria-hidden>
        {avatar.emoji}
      </span>
    </span>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="player-avatar-btn shrink-0">
        {inner}
      </button>
    );
  }

  return inner;
}

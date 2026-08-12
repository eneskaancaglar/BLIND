"use client";

import { getAvatarById, resolvePlayerAvatarId } from "@/lib/avatars";
import { AvatarIcon } from "./AvatarIcon";

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
  sm: 3.35,
  md: 4.15,
  lg: 5,
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
      <AvatarIcon id={resolvedId} className="player-avatar-svg" />
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        className="player-avatar-btn shrink-0"
        aria-label={title ?? player?.name ?? "Player"}
      >
        {inner}
      </button>
    );
  }

  return inner;
}

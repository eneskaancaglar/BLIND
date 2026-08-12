"use client";

import Image from "next/image";
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
  sm: 2.65,
  md: 3.15,
  lg: 3.75,
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
  const resolvedId = avatarId ?? (player ? resolvePlayerAvatarId(player) : "amber");
  const avatar = getAvatarById(resolvedId);
  const dim = SIZE_PX[size];

  const inner = (
    <span
      className={`player-avatar ${isTurn ? "player-avatar-turn" : ""} ${className}`}
      style={{ width: `${dim}rem`, height: `${dim}rem` }}
      title={title}
    >
      <Image
        src={avatar.imageUrl}
        alt={avatar.label}
        width={128}
        height={128}
        className="player-avatar-img"
        unoptimized
        draggable={false}
      />
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

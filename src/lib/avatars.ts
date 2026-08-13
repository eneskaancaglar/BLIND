export type AvatarDef = {
  id: string;
  imageUrl: string;
  label: string;
};

/** Custom Blind avatar portraits (local assets) */
export const PLAYER_AVATARS: AvatarDef[] = [
  { id: "1", label: "Oracle", imageUrl: "/avatars/1.png" },
  { id: "2", label: "Seer", imageUrl: "/avatars/2.png" },
  { id: "3", label: "Warden", imageUrl: "/avatars/3.png" },
  { id: "4", label: "Mystic", imageUrl: "/avatars/4.png" },
  { id: "5", label: "Raven", imageUrl: "/avatars/5.png" },
  { id: "6", label: "Phantom", imageUrl: "/avatars/6.png" },
  { id: "7", label: "Sage", imageUrl: "/avatars/7.png" },
  { id: "8", label: "Empress", imageUrl: "/avatars/8.png" },
];

export const BOT_AVATAR_ID = "bot";

export const BOT_AVATAR: AvatarDef = {
  id: BOT_AVATAR_ID,
  label: "Bot",
  imageUrl: "/avatars/bot.png",
};

const STORAGE_KEY = "blind_avatar_id";
const DEFAULT_AVATAR_ID = "1";

export function getAvatarById(id?: string | null): AvatarDef {
  if (id === BOT_AVATAR_ID) return BOT_AVATAR;
  return PLAYER_AVATARS.find((a) => a.id === id) ?? PLAYER_AVATARS[0];
}

export function getBotAvatarId(): string {
  return BOT_AVATAR_ID;
}

export function getStoredAvatarId(): string {
  if (typeof window === "undefined") return DEFAULT_AVATAR_ID;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (stored === BOT_AVATAR_ID || PLAYER_AVATARS.some((a) => a.id === stored))) {
    return stored;
  }
  return DEFAULT_AVATAR_ID;
}

export function setStoredAvatarId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
}

export function resolvePlayerAvatarId(player: {
  avatarId?: string;
  isBot?: boolean;
  id?: string;
  name?: string;
}): string {
  if (player.isBot) return BOT_AVATAR_ID;
  if (player.avatarId && PLAYER_AVATARS.some((a) => a.id === player.avatarId)) {
    return player.avatarId;
  }
  return DEFAULT_AVATAR_ID;
}

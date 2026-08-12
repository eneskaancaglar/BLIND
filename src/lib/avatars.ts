export type AvatarDef = {
  id: string;
  imageUrl: string;
  label: string;
};

/** DiceBear avatars — free, stable CDN portraits */
export const PLAYER_AVATARS: AvatarDef[] = [
  {
    id: "amber",
    label: "Amber",
    imageUrl: "https://api.dicebear.com/7.x/adventurer/png?seed=amber&size=128",
  },
  {
    id: "blaze",
    label: "Blaze",
    imageUrl: "https://api.dicebear.com/7.x/adventurer/png?seed=blaze&size=128",
  },
  {
    id: "coral",
    label: "Coral",
    imageUrl: "https://api.dicebear.com/7.x/adventurer/png?seed=coral&size=128",
  },
  {
    id: "dusk",
    label: "Dusk",
    imageUrl: "https://api.dicebear.com/7.x/adventurer/png?seed=dusk&size=128",
  },
  {
    id: "ember",
    label: "Ember",
    imageUrl: "https://api.dicebear.com/7.x/adventurer/png?seed=ember&size=128",
  },
  {
    id: "frost",
    label: "Frost",
    imageUrl: "https://api.dicebear.com/7.x/adventurer/png?seed=frost&size=128",
  },
  {
    id: "grove",
    label: "Grove",
    imageUrl: "https://api.dicebear.com/7.x/adventurer/png?seed=grove&size=128",
  },
  {
    id: "haze",
    label: "Haze",
    imageUrl: "https://api.dicebear.com/7.x/adventurer/png?seed=haze&size=128",
  },
  {
    id: "iris",
    label: "Iris",
    imageUrl: "https://api.dicebear.com/7.x/adventurer/png?seed=iris&size=128",
  },
  {
    id: "jade",
    label: "Jade",
    imageUrl: "https://api.dicebear.com/7.x/adventurer/png?seed=jade&size=128",
  },
];

export const BOT_AVATAR_ID = "bot";

export const BOT_AVATAR: AvatarDef = {
  id: BOT_AVATAR_ID,
  label: "Bot",
  imageUrl: "https://api.dicebear.com/7.x/bottts/png?seed=blind-bot&size=128",
};

const STORAGE_KEY = "blind_avatar_id";
const DEFAULT_AVATAR_ID = "amber";

export function getAvatarById(id?: string | null): AvatarDef {
  if (id === BOT_AVATAR_ID) return BOT_AVATAR;
  return PLAYER_AVATARS.find((a) => a.id === id) ?? PLAYER_AVATARS[0];
}

export function getBotAvatarId(): string {
  return BOT_AVATAR_ID;
}

export function getStoredAvatarId(): string {
  if (typeof window === "undefined") return DEFAULT_AVATAR_ID;
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_AVATAR_ID;
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
  if (player.avatarId) return player.avatarId;
  return DEFAULT_AVATAR_ID;
}

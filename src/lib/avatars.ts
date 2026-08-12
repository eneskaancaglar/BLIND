export type AvatarDef = {
  id: string;
  emoji: string;
  gradient: string;
  label: string;
};

export const PLAYER_AVATARS: AvatarDef[] = [
  { id: "fox", emoji: "🦊", gradient: "linear-gradient(145deg,#fb923c,#c2410c)", label: "Fox" },
  { id: "owl", emoji: "🦉", gradient: "linear-gradient(145deg,#a78bfa,#5b21b6)", label: "Owl" },
  { id: "wolf", emoji: "🐺", gradient: "linear-gradient(145deg,#94a3b8,#334155)", label: "Wolf" },
  { id: "lion", emoji: "🦁", gradient: "linear-gradient(145deg,#fbbf24,#b45309)", label: "Lion" },
  { id: "tiger", emoji: "🐯", gradient: "linear-gradient(145deg,#f97316,#9a3412)", label: "Tiger" },
  { id: "bear", emoji: "🐻", gradient: "linear-gradient(145deg,#92400e,#451a03)", label: "Bear" },
  { id: "panda", emoji: "🐼", gradient: "linear-gradient(145deg,#f5f5f5,#737373)", label: "Panda" },
  { id: "frog", emoji: "🐸", gradient: "linear-gradient(145deg,#4ade80,#15803d)", label: "Frog" },
  { id: "octopus", emoji: "🐙", gradient: "linear-gradient(145deg,#f472b6,#be185d)", label: "Octopus" },
  { id: "unicorn", emoji: "🦄", gradient: "linear-gradient(145deg,#e879f9,#86198f)", label: "Unicorn" },
  { id: "dragon", emoji: "🐲", gradient: "linear-gradient(145deg,#34d399,#047857)", label: "Dragon" },
  { id: "robot", emoji: "🤖", gradient: "linear-gradient(145deg,#38bdf8,#0369a1)", label: "Robot" },
  { id: "alien", emoji: "👽", gradient: "linear-gradient(145deg,#a3e635,#4d7c0f)", label: "Alien" },
  { id: "wizard", emoji: "🧙", gradient: "linear-gradient(145deg,#818cf8,#3730a3)", label: "Wizard" },
  { id: "ninja", emoji: "🥷", gradient: "linear-gradient(145deg,#64748b,#0f172a)", label: "Ninja" },
  { id: "pirate", emoji: "🏴‍☠️", gradient: "linear-gradient(145deg,#1e293b,#020617)", label: "Pirate" },
  { id: "knight", emoji: "⚔️", gradient: "linear-gradient(145deg,#cbd5e1,#475569)", label: "Knight" },
  { id: "crown", emoji: "👑", gradient: "linear-gradient(145deg,#fde047,#ca8a04)", label: "Crown" },
  { id: "joker", emoji: "🃏", gradient: "linear-gradient(145deg,#ef4444,#7f1d1d)", label: "Joker" },
  { id: "diamond", emoji: "💎", gradient: "linear-gradient(145deg,#22d3ee,#0e7490)", label: "Diamond" },
];

export const BOT_AVATAR_IDS = ["robot", "wizard", "ninja"] as const;

const STORAGE_KEY = "blind_avatar_id";
const DEFAULT_AVATAR_ID = "fox";

export function getAvatarById(id?: string | null): AvatarDef {
  return PLAYER_AVATARS.find((a) => a.id === id) ?? PLAYER_AVATARS[0];
}

export function getBotAvatarId(index: number): string {
  return BOT_AVATAR_IDS[index % BOT_AVATAR_IDS.length];
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
  if (player.avatarId) return player.avatarId;
  if (player.isBot) {
    const match = player.name?.match(/bot-(\d+)/i);
    const index = match ? Number(match[1]) - 1 : 0;
    return getBotAvatarId(Math.max(0, index));
  }
  return DEFAULT_AVATAR_ID;
}

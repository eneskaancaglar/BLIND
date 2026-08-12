"use client";

type AvatarIconProps = {
  id: string;
  className?: string;
};

/** Crisp vector avatar icons (64×64 viewBox). */
export function AvatarIcon({ id, className = "" }: AvatarIconProps) {
  switch (id) {
    case "fox":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <path fill="#ea580c" d="M10 22 20 8l6 14 8-6 8 6 6-14 10 14v28H10V22Z" />
          <circle cx="24" cy="34" r="3" fill="#111827" />
          <circle cx="40" cy="34" r="3" fill="#111827" />
          <path fill="#111827" d="M28 42c2 2 6 2 8 0" stroke="#111827" strokeWidth="2" />
        </svg>
      );
    case "owl":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <circle cx="32" cy="34" r="22" fill="#7c3aed" />
          <circle cx="24" cy="32" r="8" fill="#f5f3ff" />
          <circle cx="40" cy="32" r="8" fill="#f5f3ff" />
          <circle cx="24" cy="32" r="4" fill="#111827" />
          <circle cx="40" cy="32" r="4" fill="#111827" />
          <path fill="#fcd34d" d="M32 38 28 44h8l-4-6Z" />
        </svg>
      );
    case "wolf":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <path fill="#64748b" d="M12 18 20 6l8 12 4-8 4 8 8-12 8 12v30H12V18Z" />
          <ellipse cx="32" cy="36" rx="14" ry="16" fill="#94a3b8" />
          <circle cx="26" cy="34" r="2.5" fill="#111827" />
          <circle cx="38" cy="34" r="2.5" fill="#111827" />
        </svg>
      );
    case "lion":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <circle cx="32" cy="34" r="24" fill="#f59e0b" />
          <circle cx="32" cy="34" r="18" fill="#fcd34d" />
          <circle cx="25" cy="32" r="3" fill="#111827" />
          <circle cx="39" cy="32" r="3" fill="#111827" />
          <path fill="#111827" d="M26 42c3 2 9 2 12 0" stroke="#111827" strokeWidth="2" />
        </svg>
      );
    case "tiger":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <circle cx="32" cy="34" r="22" fill="#fb923c" />
          <path stroke="#7c2d12" strokeWidth="2" d="M16 28h32M18 36h28M20 44h24" />
          <circle cx="25" cy="32" r="3" fill="#111827" />
          <circle cx="39" cy="32" r="3" fill="#111827" />
        </svg>
      );
    case "bear":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <circle cx="18" cy="18" r="8" fill="#92400e" />
          <circle cx="46" cy="18" r="8" fill="#92400e" />
          <circle cx="32" cy="36" r="22" fill="#a16207" />
          <ellipse cx="32" cy="40" rx="8" ry="6" fill="#fcd34d" />
          <circle cx="25" cy="32" r="3" fill="#111827" />
          <circle cx="39" cy="32" r="3" fill="#111827" />
        </svg>
      );
    case "panda":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <circle cx="32" cy="34" r="22" fill="#f8fafc" />
          <circle cx="22" cy="26" r="7" fill="#111827" />
          <circle cx="42" cy="26" r="7" fill="#111827" />
          <circle cx="25" cy="34" r="3" fill="#111827" />
          <circle cx="39" cy="34" r="3" fill="#111827" />
        </svg>
      );
    case "frog":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <ellipse cx="32" cy="38" rx="24" ry="18" fill="#22c55e" />
          <circle cx="20" cy="24" r="8" fill="#fff" />
          <circle cx="44" cy="24" r="8" fill="#fff" />
          <circle cx="20" cy="24" r="4" fill="#111827" />
          <circle cx="44" cy="24" r="4" fill="#111827" />
        </svg>
      );
    case "octopus":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <circle cx="32" cy="26" r="16" fill="#ec4899" />
          <path fill="#db2777" d="M16 40c0 8 6 14 16 14s16-6 16-14" />
          <circle cx="26" cy="24" r="3" fill="#111827" />
          <circle cx="38" cy="24" r="3" fill="#111827" />
        </svg>
      );
    case "unicorn":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <path fill="#e879f9" d="M32 8 36 22h8l-6 10 2 14-10-6-10 6 2-14-6-10h8l4-14Z" />
          <circle cx="32" cy="38" r="16" fill="#fae8ff" />
          <circle cx="26" cy="36" r="2.5" fill="#111827" />
          <circle cx="38" cy="36" r="2.5" fill="#111827" />
        </svg>
      );
    case "dragon":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <path fill="#059669" d="M8 28 18 12l8 10 6-6 6 6 8-10 10 16v24H8V28Z" />
          <circle cx="24" cy="34" r="3" fill="#fef08a" />
          <circle cx="40" cy="34" r="3" fill="#fef08a" />
          <path fill="#064e3b" d="M28 44h8v8h-8z" />
        </svg>
      );
    case "robot":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <rect x="14" y="18" width="36" height="34" rx="6" fill="#38bdf8" />
          <rect x="20" y="26" width="10" height="10" rx="2" fill="#e0f2fe" />
          <rect x="34" y="26" width="10" height="10" rx="2" fill="#e0f2fe" />
          <rect x="24" y="42" width="16" height="4" rx="2" fill="#0f172a" />
          <rect x="28" y="10" width="8" height="8" rx="2" fill="#64748b" />
        </svg>
      );
    case "alien":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <ellipse cx="32" cy="36" rx="18" ry="22" fill="#84cc16" />
          <ellipse cx="24" cy="32" rx="6" ry="8" fill="#111827" />
          <ellipse cx="40" cy="32" rx="6" ry="8" fill="#111827" />
          <path fill="#111827" d="M28 46c2 2 6 2 8 0" stroke="#111827" strokeWidth="2" />
        </svg>
      );
    case "wizard":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <path fill="#6366f1" d="M32 6 44 24H20L32 6Z" />
          <circle cx="32" cy="38" r="16" fill="#c7d2fe" />
          <circle cx="26" cy="36" r="2.5" fill="#111827" />
          <circle cx="38" cy="36" r="2.5" fill="#111827" />
          <rect x="28" y="44" width="8" height="10" fill="#4338ca" />
        </svg>
      );
    case "ninja":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <circle cx="32" cy="34" r="22" fill="#334155" />
          <rect x="14" y="28" width="36" height="8" rx="2" fill="#0f172a" />
          <circle cx="24" cy="32" r="3" fill="#fff" />
          <circle cx="40" cy="32" r="3" fill="#fff" />
        </svg>
      );
    case "pirate":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <circle cx="32" cy="34" r="22" fill="#fca5a5" />
          <rect x="14" y="28" width="36" height="10" fill="#111827" />
          <circle cx="24" cy="32" r="3" fill="#fff" />
          <path fill="#111827" d="M36 30h10v6H36z" />
        </svg>
      );
    case "knight":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <path fill="#94a3b8" d="M20 14h24v12H20z" />
          <rect x="18" y="24" width="28" height="26" rx="4" fill="#64748b" />
          <rect x="24" y="30" width="16" height="10" rx="2" fill="#cbd5e1" />
        </svg>
      );
    case "crown":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <path fill="#fbbf24" d="M8 40 16 18l8 12 8-16 8 16 8-12 8 22v8H8v-8Z" />
          <circle cx="32" cy="34" r="10" fill="#fde68a" />
        </svg>
      );
    case "joker":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <rect x="12" y="12" width="40" height="40" rx="6" fill="#ef4444" />
          <text x="32" y="40" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">
            J
          </text>
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <path fill="#22d3ee" d="M32 8 52 32 32 56 12 32 32 8Z" />
          <path fill="#ecfeff" d="M32 16 44 32 32 48 20 32 32 16Z" opacity="0.55" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
          <circle cx="32" cy="32" r="24" fill="#64748b" />
        </svg>
      );
  }
}

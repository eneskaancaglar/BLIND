type BotBadgeProps = {
  className?: string;
  size?: "xs" | "sm";
};

export function BotBadge({ className = "", size = "xs" }: BotBadgeProps) {
  const dim = size === "sm" ? 14 : 11;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-200 ${className}`}
      style={{ width: dim + 4, height: dim + 4 }}
      title="Bot"
      aria-label="Bot"
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect x="5" y="8" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="9.5" cy="13" r="1.2" fill="currentColor" />
        <circle cx="14.5" cy="13" r="1.2" fill="currentColor" />
        <path d="M12 4v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="3" r="1.2" fill="currentColor" />
        <path d="M5 11H3M21 11h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

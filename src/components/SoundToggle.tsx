"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useSound } from "@/context/SoundContext";
import { resumeAudio } from "@/lib/sounds";

type SoundToggleProps = {
  className?: string;
  compact?: boolean;
  footer?: boolean;
};

export function SoundToggle({ className = "", compact = false, footer = false }: SoundToggleProps) {
  const { enabled, setEnabled, play } = useSound();
  const { translate } = useLanguage();

  function toggle() {
    resumeAudio();
    const next = !enabled;
    setEnabled(next);
    if (next) play("click");
  }

  if (footer) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        className={`home-footer-btn ${className}`}
      >
        <span aria-hidden className="mr-1">
          {enabled ? "🔊" : "🔇"}
        </span>
        {enabled ? translate("soundOn") : translate("soundOff")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? translate("soundOff") : translate("soundOn")}
      title={enabled ? translate("soundOff") : translate("soundOn")}
      className={`flex items-center justify-center rounded-full border border-white/10 bg-black/30 text-slate-200 transition hover:bg-black/50 ${
        compact ? "h-7 w-7 text-sm" : "gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
      } ${className}`}
    >
      <span aria-hidden>{enabled ? "🔊" : "🔇"}</span>
      {!compact ? <span>{enabled ? translate("soundOn") : translate("soundOff")}</span> : null}
    </button>
  );
}

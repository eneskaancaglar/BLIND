"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useSound } from "@/context/SoundContext";
import { resumeAudio } from "@/lib/sounds";

type SoundToggleProps = {
  className?: string;
  compact?: boolean;
};

export function SoundToggle({ className = "", compact = false }: SoundToggleProps) {
  const { enabled, setEnabled, play } = useSound();
  const { translate } = useLanguage();

  function toggle() {
    resumeAudio();
    const next = !enabled;
    setEnabled(next);
    if (next) play("click");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      title={enabled ? translate("soundOff") : translate("soundOn")}
      className={`flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs font-semibold text-violet-100 transition hover:bg-black/50 ${className}`}
    >
      <span aria-hidden>{enabled ? "🔊" : "🔇"}</span>
      {!compact ? <span>{enabled ? translate("soundOn") : translate("soundOff")}</span> : null}
    </button>
  );
}

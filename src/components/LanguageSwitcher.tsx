"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { Language } from "@/lib/i18n";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
  footer?: boolean;
};

export function LanguageSwitcher({ className = "", compact = false, footer = false }: LanguageSwitcherProps) {
  const { language, setLanguage, translate } = useLanguage();

  function select(lang: Language) {
    setLanguage(lang);
  }

  if (footer) {
    return (
      <button
        type="button"
        onClick={() => select(language === "en" ? "tr" : "en")}
        className={`home-footer-btn ${className}`}
        aria-label={translate("language")}
      >
        {language === "en" ? translate("english") : translate("turkish")}
      </button>
    );
  }

  return (
    <div className={`flex items-center ${compact ? "gap-1" : "gap-2"} ${className}`}>
      <div
        className={`flex rounded-xl border border-white/10 bg-black/30 ${
          compact ? "p-0.5" : "p-0.5"
        }`}
      >
        {(["en", "tr"] as Language[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => select(lang)}
            className={`rounded-lg font-semibold transition ${
              compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
            } ${
              language === lang
                ? "bg-white/15 text-white"
                : "text-slate-300/70 hover:text-white"
            }`}
          >
            {lang === "en" ? translate("english") : translate("turkish")}
          </button>
        ))}
      </div>
    </div>
  );
}

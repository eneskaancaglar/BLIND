"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { Language } from "@/lib/i18n";

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage, translate } = useLanguage();

  function select(lang: Language) {
    setLanguage(lang);
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-violet-200/60">{translate("language")}</span>
      <div className="flex rounded-xl border border-white/10 bg-black/30 p-0.5">
        {(["en", "tr"] as Language[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => select(lang)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              language === lang
                ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white"
                : "text-violet-200/70 hover:text-white"
            }`}
          >
            {lang === "en" ? translate("english") : translate("turkish")}
          </button>
        ))}
      </div>
    </div>
  );
}

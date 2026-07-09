"use client";

import { useLanguage } from "@/context/LanguageContext";

type DrawOverlayProps = {
  onHome: () => void;
};

export function DrawOverlay({ onHome }: DrawOverlayProps) {
  const { translate } = useLanguage();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm animate-result-in rounded-3xl border border-white/20 bg-gradient-to-b from-slate-900/95 to-black/90 p-8 text-center shadow-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-slate-300/80">
          {translate("gameOver")}
        </p>
        <h2 className="text-3xl font-black text-white">{translate("drawGame")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{translate("drawBlindRevival")}</p>
        <button
          type="button"
          onClick={onHome}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-slate-500 to-slate-600 py-4 text-lg font-bold text-white shadow-lg"
        >
          {translate("backToHome")}
        </button>
      </div>
    </div>
  );
}

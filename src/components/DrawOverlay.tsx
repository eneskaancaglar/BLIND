"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { BodyPortal } from "./BodyPortal";

type DrawOverlayProps = {
  onHome: () => void;
};

export function DrawOverlay({ onHome }: DrawOverlayProps) {
  const { translate } = useLanguage();
  const [leaving, setLeaving] = useState(false);

  function handleHome() {
    if (leaving) return;
    setLeaving(true);
    onHome();
  }

  return (
    <BodyPortal>
      <div className="round-overlay round-overlay-transition pointer-events-auto fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="round-transition-backdrop absolute inset-0 bg-gradient-to-b from-slate-900/95 via-black/90 to-black/95" />

        <div className="relative z-10 w-full max-w-sm px-4 text-center animate-transition-in">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-slate-300/85">
            {translate("gameOver")}
          </p>
          <h2 className="text-3xl font-black text-white">{translate("drawGame")}</h2>
          <p className="mt-3 text-lg text-slate-300/85">{translate("drawBlindRevival")}</p>
          <button
            type="button"
            disabled={leaving}
            onClick={handleHome}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-slate-500 to-slate-600 py-4 text-lg font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-70"
          >
            {translate("backToHome")}
          </button>
        </div>
      </div>
    </BodyPortal>
  );
}

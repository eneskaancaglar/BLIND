"use client";

import { useLanguage } from "@/context/LanguageContext";

type WinnerOverlayProps = {
  winnerName: string;
  isMe: boolean;
  onHome: () => void;
};

export function WinnerOverlay({ winnerName, isMe, onHome }: WinnerOverlayProps) {
  const { translate } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm animate-result-in rounded-3xl border border-emerald-400/40 bg-gradient-to-b from-emerald-950/95 to-black/90 p-8 text-center shadow-2xl shadow-emerald-900/40">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-emerald-300/80">
          {translate("gameOver")}
        </p>
        <h2 className="text-3xl font-black text-white">
          {isMe ? translate("youWon") : translate("winner", { name: winnerName })}
        </h2>
        {!isMe ? (
          <p className="mt-3 text-lg text-emerald-100/80">{winnerName}</p>
        ) : null}
        <button
          type="button"
          onClick={onHome}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-lg font-bold text-white shadow-lg"
        >
          {translate("backToHome")}
        </button>
      </div>
    </div>
  );
}

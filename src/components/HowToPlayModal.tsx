"use client";

import { useLanguage } from "@/context/LanguageContext";
import { getRuleKeys } from "@/lib/i18n";

type HowToPlayModalProps = {
  open: boolean;
  onClose: () => void;
};

export function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  const { translate } = useLanguage();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-violet-400/30 bg-gradient-to-b from-[#1a1035] to-[#0f172a] p-6 shadow-2xl shadow-violet-900/40"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="rules-title"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">
              BLIND
            </p>
            <h2 id="rules-title" className="text-2xl font-bold text-white">
              {translate("rulesTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
          >
            {translate("close")}
          </button>
        </div>

        <ol className="space-y-4">
          {getRuleKeys().map((key, index) => (
            <li key={key} className="flex gap-3 text-sm leading-relaxed text-violet-100/90">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-xs font-bold text-white">
                {index + 1}
              </span>
              <span className="pt-0.5">{translate(key)}</span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 py-3.5 font-bold text-white shadow-lg"
        >
          {translate("gotIt")}
        </button>
      </div>
    </div>
  );
}

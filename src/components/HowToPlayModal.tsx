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
        className="theme-modal-panel max-h-[85dvh] w-full max-w-md overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="rules-title"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="theme-overlay-kicker">BLIND</p>
            <h2 id="rules-title" className="theme-overlay-title text-2xl">
              {translate("rulesTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="home-footer-btn !min-h-8 px-3 py-1 text-sm"
          >
            {translate("close")}
          </button>
        </div>

        <ol className="space-y-4">
          {getRuleKeys().map((key, index) => (
            <li key={key} className="flex gap-3 text-sm leading-relaxed text-slate-200">
              <span className="theme-overlay-badge h-7 w-7 shrink-0 text-xs font-bold">
                {index + 1}
              </span>
              <span className="pt-0.5">{translate(key)}</span>
            </li>
          ))}
        </ol>

        <button type="button" onClick={onClose} className="home-btn-start mt-6 w-full py-3.5 font-bold">
          {translate("gotIt")}
        </button>
      </div>
    </div>
  );
}

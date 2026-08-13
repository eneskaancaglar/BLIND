"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PLAYER_AVATARS, getAvatarById } from "@/lib/avatars";
import { useLanguage } from "@/context/LanguageContext";

type AvatarPickerProps = {
  value: string;
  onChange: (id: string) => void;
};

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const { translate } = useLanguage();
  const [open, setOpen] = useState(false);
  const selected = getAvatarById(value);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="avatar-picker">
      <div className="avatar-picker-header">
        <p className="avatar-picker-title">{translate("chooseAvatar")}</p>
        <p className="avatar-picker-sub">{translate("avatarPickerHint")}</p>
      </div>

      <button
        type="button"
        className="avatar-picker-hero"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="avatar-picker-ring" aria-hidden />
        <span className="avatar-picker-preview">
          <Image
            src={selected.imageUrl}
            alt={selected.label}
            width={256}
            height={256}
            className="avatar-picker-preview-img"
            unoptimized
          />
        </span>
        <span className="avatar-picker-meta">
          <span className="avatar-picker-name">{selected.label}</span>
          <span className="avatar-picker-action">{translate("selectAvatar")}</span>
        </span>
      </button>

      {open ? (
        <div
          className="avatar-picker-modal"
          role="dialog"
          aria-modal="true"
          aria-label={translate("chooseAvatar")}
          onClick={() => setOpen(false)}
        >
          <div className="avatar-picker-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="avatar-picker-sheet-head">
              <p className="avatar-picker-sheet-title">{translate("chooseAvatar")}</p>
              <button
                type="button"
                className="avatar-picker-close"
                onClick={() => setOpen(false)}
                aria-label={translate("close")}
              >
                ×
              </button>
            </div>

            <div className="avatar-picker-grid">
              {PLAYER_AVATARS.map((avatar) => {
                const isSelected = value === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    title={avatar.label}
                    aria-label={avatar.label}
                    aria-pressed={isSelected}
                    onClick={() => {
                      onChange(avatar.id);
                      setOpen(false);
                    }}
                    className={`avatar-picker-option ${isSelected ? "avatar-picker-option-active" : ""}`}
                  >
                    <Image
                      src={avatar.imageUrl}
                      alt={avatar.label}
                      width={128}
                      height={128}
                      className="avatar-picker-option-img"
                      unoptimized
                    />
                    <span className="avatar-picker-option-label">{avatar.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

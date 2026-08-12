"use client";

import { PLAYER_AVATARS } from "@/lib/avatars";
import { useLanguage } from "@/context/LanguageContext";
import { AvatarIcon } from "./AvatarIcon";

type AvatarPickerProps = {
  value: string;
  onChange: (id: string) => void;
};

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const { translate } = useLanguage();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-300">{translate("chooseAvatar")}</p>
      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
        {PLAYER_AVATARS.map((avatar) => {
          const selected = value === avatar.id;
          return (
            <button
              key={avatar.id}
              type="button"
              title={avatar.label}
              aria-label={avatar.label}
              aria-pressed={selected}
              onClick={() => onChange(avatar.id)}
              className={`avatar-pick-btn ${selected ? "avatar-pick-btn-active" : ""}`}
              style={{ background: avatar.gradient }}
            >
              <AvatarIcon id={avatar.id} className="avatar-pick-svg" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

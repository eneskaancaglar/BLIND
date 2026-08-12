"use client";

import { useState } from "react";
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

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-300">{translate("chooseAvatar")}</p>

      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <div
          className="avatar-pick-preview shrink-0 overflow-hidden rounded-full border-2 border-amber-200/40"
          style={{ width: "4rem", height: "4rem" }}
        >
          <Image
            src={selected.imageUrl}
            alt={selected.label}
            width={128}
            height={128}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{selected.label}</p>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="mt-1 rounded-lg border border-amber-300/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/25"
          >
            {translate("selectAvatar")}
          </button>
        </div>
      </div>

      {open ? (
        <div className="avatar-pick-panel grid grid-cols-5 gap-2 rounded-xl border border-white/10 bg-black/30 p-2.5">
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
                className={`avatar-pick-btn overflow-hidden ${isSelected ? "avatar-pick-btn-active" : ""}`}
              >
                <Image
                  src={avatar.imageUrl}
                  alt={avatar.label}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

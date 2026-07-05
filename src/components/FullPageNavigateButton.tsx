"use client";

type FullPageNavigateButtonProps = {
  path: string;
  label: string;
  sublabel?: string;
};

export function getAbsoluteUrl(path: string): string {
  if (typeof window === "undefined") return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${normalizedPath}`;
}

export function FullPageNavigateButton({
  path,
  label,
  sublabel,
}: FullPageNavigateButtonProps) {
  const absoluteUrl = getAbsoluteUrl(path);

  function handleClick() {
    window.location.replace(absoluteUrl);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        className="block w-full rounded-2xl bg-green-600 px-6 py-5 text-xl font-bold text-white shadow-lg"
      >
        {label}
      </button>
      {sublabel ? <p className="text-sm text-neutral-500">{sublabel}</p> : null}
      <p className="break-all text-xs text-neutral-600">{absoluteUrl}</p>
    </div>
  );
}

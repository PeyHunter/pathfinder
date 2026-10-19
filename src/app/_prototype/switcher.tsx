"use client";
// PROTOTYPE: throwaway. Floating bar that cycles ?variant= on the current route.

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import "./switcher.css";

export function PrototypeSwitcher({ variants, current }: { variants: { key: string; name: string }[]; current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  // "" is the current production look, so it stays in the cycle for comparison.
  const keys = ["", ...variants.map((v) => v.key)];
  const i = Math.max(0, keys.indexOf(current));
  const label = current ? `${current} · ${variants.find((v) => v.key === current)?.name}` : "Current design";

  const go = (dir: number) => {
    const k = keys[(i + dir + keys.length) % keys.length];
    router.replace(k ? `${pathname}?variant=${k}` : pathname, { scroll: false });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;
  return (
    <div className="proto-switcher" role="toolbar" aria-label="Prototype variant">
      <button type="button" onClick={() => go(-1)} aria-label="Previous variant">←</button>
      <span>{label}</span>
      <button type="button" onClick={() => go(1)} aria-label="Next variant">→</button>
    </div>
  );
}

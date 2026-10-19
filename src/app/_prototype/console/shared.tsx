// PROTOTYPE: throwaway. Shared chrome and small display bits for the "Mission control" variant.
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import type { Status } from "@/lib/progress";
import s from "./console.module.css";

// Both are variable fonts, so the default "variable" weight loads every weight the CSS uses.
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-cm-mono" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-cm-head" });

/** Glyph + text label per status, so status is never carried by color alone. */
export const STATUS: Record<Status, { glyph: string; label: string }> = {
  mastered: { glyph: "■", label: "Mastered" },
  in_progress: { glyph: "▶", label: "In progress" },
  needs_review: { glyph: "!", label: "Review" },
  available: { glyph: "□", label: "Not started" },
  locked: { glyph: "·", label: "Locked" },
};

export const pad = (n: number, width = 2) => String(n).padStart(width, "0");
export const percent = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

export function Shell({ readout, children }: { readout: string; children: ReactNode }) {
  return (
    <div data-prototype-variant="console" className={`${mono.variable} ${grotesk.variable} ${s.root}`}>
      <header className={s.topbar}>
        <Link href="/?variant=console" className={s.brand}>
          <span aria-hidden="true" className={s.brandMark}>{">_"}</span> PATHFINDER
        </Link>
        <p className={s.readout}>
          <span className={s.led} aria-hidden="true" /> {readout}
        </p>
        <nav className={s.nav} aria-label="Main">
          <Link href="/?variant=console" className={s.navLink}>Paths</Link>
          <Link href="/new" className={s.key}>New path</Link>
        </nav>
      </header>
      <main className={s.main}>{children}</main>
      <footer className={s.footer}>
        <p>PATHFINDER // learn anything, one step at a time.</p>
        <p className={s.dim}>console build · read-only view</p>
      </footer>
    </div>
  );
}

export function Chevron() {
  return (
    <svg viewBox="0 0 8 12" aria-hidden="true" className={s.icon}>
      <path d="M1.5 1.5 6 6l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** One segment per concept, colored by status. */
export function Segments({ statuses, label }: { statuses: Status[]; label: string }) {
  return (
    <span className={s.segs} role="img" aria-label={label}>
      {statuses.map((st, i) => (
        <span key={i} className={s.seg} data-status={st} />
      ))}
    </span>
  );
}

/** A meter whose fill is the registered --cm-pct property, so it can animate in. */
export function Meter({ value }: { value: number }) {
  return <span className={s.meter} aria-hidden="true" style={{ "--cm-pct": `${value}%` } as CSSProperties} />;
}

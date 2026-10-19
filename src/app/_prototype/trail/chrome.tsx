// PROTOTYPE: throwaway. Trail map variant: fonts, root element, nav, footer and the inline icons.
import { Fraunces, Public_Sans } from "next/font/google";
import Link from "next/link";
import s from "./trail.module.css";

// Both are variable fonts, so every weight is loaded; italic is loaded too because the display face uses it.
const display = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz", "SOFT"], variable: "--trail-font-display" });
const body = Public_Sans({ subsets: ["latin"], style: ["normal", "italic"], variable: "--trail-font-body" });

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div data-prototype-variant="trail" className={`${s.root} ${display.variable} ${body.variable}`}>
      <header className={s.nav}>
        <nav className={s.navInner} aria-label="Main">
          <Link href="/?variant=trail" className={`${s.brand} ${s.withIcon}`}>
            <PeakIcon />
            <span>Pathfinder</span>
          </Link>
          <Link href="/new" className={`${s.navLink} ${s.withIcon}`}>
            <PlusIcon />
            <span>New path</span>
          </Link>
        </nav>
      </header>
      <main className={s.main}>{children}</main>
      <footer className={s.footer}>
        <p>Pathfinder · learn anything, one waypoint at a time.</p>
        <Link href="/?variant=trail" className={s.footerLink}>
          Back to the trailhead
        </Link>
      </footer>
    </div>
  );
}

export function PeakIcon() {
  return (
    <svg viewBox="0 0 24 20" aria-hidden="true" fill="currentColor">
      <path d="M0 20 8.5 4l4 7 3-5L24 20Z" />
      <path d="m8.5 4 2.2 4.1-2.2-1-2.1 1Z" style={{ fill: "var(--cut, var(--paper))" }} />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
      <path d="M8 2v12M2 8h12" />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" />
    </svg>
  );
}

export function FlagIcon() {
  return (
    <svg viewBox="0 0 16 18" aria-hidden="true" fill="currentColor">
      <path d="M2 0h1.6v18H2Z" />
      <path d="M3.6 1.2H14l-2.6 3.6L14 8.4H3.6Z" />
    </svg>
  );
}

export function TentIcon() {
  return (
    <svg viewBox="0 0 24 20" aria-hidden="true" fill="currentColor">
      <path d="M12 1 1 19h22Z" />
      <path d="m12 9-4 10h8Z" style={{ fill: "var(--cut, var(--paper))" }} />
    </svg>
  );
}

export function pct(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

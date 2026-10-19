// PROTOTYPE: throwaway. Broadsheet chrome: fonts, masthead (nameplate + dateline) and the colophon-style footer.
import Link from "next/link";
import { Instrument_Serif, Newsreader } from "next/font/google";
import type { Status } from "@/lib/progress";
import s from "./editorial.module.css";

// Load every style the design uses: the reset rule "font-synthesis" is off for weight/style, so a missing italic would render upright.
const display = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-display" });
const body = Newsreader({ style: ["normal", "italic"], axes: ["opsz"], subsets: ["latin"], variable: "--font-body" });

export const HOME = "/?variant=editorial";

export const today = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

/** "locked" only means prerequisites aren't mastered yet, so it reads as not started, like the current UI. */
export const statusWord: Record<Status, string> = {
  locked: "Not started",
  available: "Not started",
  in_progress: "In progress",
  needs_review: "Needs review",
  mastered: "Mastered",
};

export function Paper({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div data-prototype-variant="editorial" className={`${s.root} ${display.variable} ${body.variable}`}>
      <header className={`${s.contentGrid} ${s.masthead}`} data-compact={compact || undefined}>
        <div className={`${s.breakout} ${s.ears}`}>
          <p className={s.dateline}>
            <time dateTime={new Date().toISOString().slice(0, 10)}>{today()}</time>
          </p>
          <nav aria-label="Sections" className={s.mastNav}>
            <Link href={HOME}>Front page</Link>
            <Link href="/new">New path</Link>
          </nav>
        </div>
        <p className={`${s.breakout} ${s.nameplate}`}>
          <Link href={HOME}>The Pathfinder</Link>
        </p>
        {!compact && (
          <p className={`${s.breakout} ${s.tagline}`}>
            Learn anything, one step at a time. <span>Late edition</span>
          </p>
        )}
      </header>
      {children}
      <footer className={`${s.contentGrid} ${s.footer}`}>
        <p>
          The Pathfinder is set in Instrument Serif and Newsreader. The night edition follows your system theme.{" "}
          <Link href={HOME}>Front page</Link> · <Link href="/new">New path</Link>
        </p>
      </footer>
    </div>
  );
}

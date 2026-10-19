// PROTOTYPE: throwaway. The variant's own nav, footer and fonts; the app's global chrome is hidden while it is mounted.
import Link from "next/link";
import { Bricolage_Grotesque, Nunito } from "next/font/google";
import { Play, Star } from "./glyphs";
import s from "./arcade.module.css";

// Both are variable fonts, so every weight the CSS uses (500-800) is loaded with font-synthesis off.
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-arcade-display" });
const body = Nunito({ subsets: ["latin"], variable: "--font-arcade-body" });

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div data-prototype-variant="arcade" className={`${s.root} ${display.variable} ${body.variable}`}>
      <nav className={s.nav} aria-label="Main">
        <Link href="/?variant=arcade" className={s.brand}>
          <span className={s.brandMark}>
            <Star />
          </span>
          <span>Pathfinder</span>
        </Link>
        <Link href="/new" className={`${s.btn} ${s.btnSmall}`}>
          <span>New path</span>
          <Play />
        </Link>
      </nav>
      <main className={s.page}>{children}</main>
      <footer className={s.footer}>
        <p>
          <Star /> Pathfinder · learn anything, one level at a time.
        </p>
      </footer>
    </div>
  );
}

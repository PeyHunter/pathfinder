// PROTOTYPE: throwaway. Home as a level-select screen: playful hero, then save-slot cartridges.
import Link from "next/link";
import { statusLabel, type HomePath, type HomeProps } from "../types";
import { Shell } from "./chrome";
import { Play, Star } from "./glyphs";
import s from "./arcade.module.css";

const hue = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function Home({ paths }: HomeProps) {
  return (
    <Shell>
      <section className={s.hero} aria-labelledby="arcade-hero">
        <div className={s.heroArt} aria-hidden="true">
          <Star className={s.spark} />
          <Star className={s.spark} />
          <Star className={s.spark} />
        </div>
        <div className={s.heroText}>
          <p className={s.kicker}>Player 1 ready</p>
          <h1 id="arcade-hero" className={s.heroTitle}>
            Pick your next adventure
          </h1>
          <p className={s.lede}>
            Drop in a messy list of things you want to learn. Pathfinder builds the worlds and levels, starting from the very basics.
          </p>
          <Link href="/new" className={`${s.btn} ${s.btnBig}`}>
            <span>Start a new path</span>
            <Play />
          </Link>
        </div>
      </section>

      <section className={s.slots} aria-labelledby="arcade-slots">
        <h2 id="arcade-slots" className={s.sectionTitle}>
          Save slots <span className={s.count}>{paths.length}</span>
        </h2>
        {paths.length === 0 ? (
          <div className={s.empty}>
            <Star className={s.emptyStar} />
            <p className={s.emptyTitle}>No save files yet</p>
            <p>Your first adventure is one list away.</p>
            <Link href="/new" className={s.btn}>
              <span>Press start</span>
              <Play />
            </Link>
          </div>
        ) : (
          <ol className={s.carts}>
            {paths.map((p, i) => (
              <Cartridge key={p.id} p={p} slot={i + 1} />
            ))}
          </ol>
        )}
      </section>
    </Shell>
  );
}

const METER = 5;

function Cartridge({ p, slot }: { p: HomePath; slot: number }) {
  const prog = p.progress;
  const lit = prog && prog.total > 0 ? Math.round((prog.mastered / prog.total) * METER) : 0;
  return (
    <li className={`${s.cart} ${s.hued}`} style={hue(slot)}>
      <div className={s.cartLabel}>
        <span className={s.cartStripes} aria-hidden="true" />
        <span className={s.chip}>{statusLabel[p.status]}</span>
        {prog?.started && (
          <span className={s.sticker}>
            Continue <Play />
          </span>
        )}
      </div>
      <h3 className={s.cartTitle}>
        <Link href={`/paths/${p.id}?variant=arcade`} className={s.cartLink}>
          {p.title}
        </Link>
      </h3>
      {prog ? (
        <p className={s.meter}>
          <span className={s.stars} aria-hidden="true">
            {Array.from({ length: METER }, (_, k) => (
              <Star key={k} className={k < lit ? s.starOn : s.starOff} />
            ))}
          </span>
          <span className={s.meterText}>
            {prog.mastered} / {prog.total} mastered
          </span>
        </p>
      ) : (
        <p className={s.meter}>
          <span className={s.meterText}>No levels yet</span>
        </p>
      )}
      <p className={s.cartFoot}>
        <span>Slot {String(slot).padStart(2, "0")}</span>
        <span className={s.cartGo} aria-hidden="true">
          {prog?.started ? "Resume" : "Open"} <Play />
        </span>
      </p>
    </li>
  );
}

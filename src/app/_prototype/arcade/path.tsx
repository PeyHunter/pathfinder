// PROTOTYPE: throwaway. The path as a world map: HUD with an XP bar, then modules as worlds in a native-scroll carousel.
// The carousel's arrow buttons are omitted on purpose: they need a script, and this variant is server components only.
import Link from "next/link";
import type { PathProps } from "../types";
import { Shell } from "./chrome";
import { Check, Play, Star, StatusGlyph, levelLabel } from "./glyphs";
import s from "./arcade.module.css";

export function Path({ path, progress }: PathProps) {
  const all = path.modules.flatMap((m) => m.concepts);
  const added = all.filter((c) => c.addedBySystem).length;
  const status = (slug: string) => progress.statuses[slug] ?? "available";
  const next = progress.next;
  const xp = progress.total ? progress.mastered / progress.total : 0;

  return (
    <Shell>
      <header className={s.hud}>
        <div className={s.hudInner}>
          <div className={s.hudText}>
            <p className={s.kicker}>{progress.started ? "Adventure in progress" : "New game"}</p>
            <h1 className={s.pathTitle}>{path.title}</h1>
            <p className={s.lede}>
              {all.length} steps in {path.modules.length} modules, {added} are basics I added.
            </p>
          </div>
          <div className={s.hudPlay}>
            {next ? (
              <Link href={`/paths/${path.id}/concepts/${next.slug}`} className={`${s.btn} ${s.btnBig}`}>
                <span>{progress.started ? `Play next: ${next.name}` : "Start learning"}</span>
                <Play />
              </Link>
            ) : (
              <p className={s.allClear}>
                <Star /> All clear! You mastered everything.
              </p>
            )}
          </div>
          <div className={s.xp}>
            <p className={s.xpLabel}>
              <span>XP</span>
              <span className={s.xpNums}>
                {progress.mastered} / {progress.total} mastered
              </span>
            </p>
            <div
              className={s.xpTrack}
              role="progressbar"
              aria-label="Concepts mastered"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.mastered}
              style={{ "--xp": xp } as React.CSSProperties}
            >
              <span className={s.xpFill} />
            </div>
          </div>
        </div>
      </header>

      <section className={s.map} aria-labelledby="arcade-map">
        <div className={s.mapHead}>
          <h2 id="arcade-map" className={s.sectionTitle}>
            World map
          </h2>
          <p className={s.mapHint}>
            {path.modules.length} worlds · scroll sideways <Play />
          </p>
        </div>
        <ol className={s.carousel}>
          {path.modules.map((m) => {
            const done = m.concepts.filter((c) => status(c.slug) === "mastered").length;
            const cleared = m.concepts.length > 0 && done === m.concepts.length;
            return (
              <li key={m.order} className={`${s.world} ${s.hued}`} style={{ "--i": m.order } as React.CSSProperties} aria-labelledby={`world-${m.order}`}>
                <div className={s.worldHead}>
                  <div className={s.worldBadges}>
                    <p className={s.worldNo}>World {m.order}</p>
                    <span className={s.here}>You are here</span>
                    {cleared && (
                      <span className={s.cleared}>
                        <Check /> Cleared
                      </span>
                    )}
                  </div>
                  <h3 id={`world-${m.order}`} className={s.worldTitle}>
                    {m.title}
                  </h3>
                </div>
                <p className={s.why}>{m.whyItMatters}</p>
                <div className={s.worldMeta}>
                  <p className={s.worldCount}>
                    <Star /> {done} / {m.concepts.length} mastered
                  </p>
                  <Link href={`/paths/${path.id}/modules/${m.order}`} className={`${s.btn} ${s.btnSmall} ${s.btnHue}`}>
                    <span>Enter world</span>
                    <Play />
                  </Link>
                </div>
                <ol className={s.tiles}>
                  {m.concepts.map((c) => {
                    const st = status(c.slug);
                    const isNext = next?.slug === c.slug;
                    return (
                      <li key={c.slug} className={s.tile} data-status={st} data-next={isNext || undefined}>
                        <div className={s.tileTop}>
                          <span className={s.stepNo}>
                            <span className={s.srOnly}>Step </span>
                            {c.step}
                          </span>
                          <span className={s.glyph}>
                            <StatusGlyph status={st} next={isNext} />
                          </span>
                          {c.addedBySystem && <span className={s.bonus}>Bonus</span>}
                        </div>
                        <p className={s.tileName}>
                          <Link href={`/paths/${path.id}/concepts/${c.slug}`} className={s.tileLink} title={`${c.name}: ${c.summary}`}>
                            {c.name}
                          </Link>
                        </p>
                        <p className={s.tileSummary}>{c.summary}</p>
                        <p className={s.tileStatus}>
                          {isNext && <strong>Up next · </strong>}
                          {levelLabel[st]}
                          {c.addedBySystem && " · Added basic"}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </li>
            );
          })}
        </ol>
      </section>
    </Shell>
  );
}

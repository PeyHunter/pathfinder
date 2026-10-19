// PROTOTYPE: throwaway. Trail map home: a trailhead hero, then each path as a signpost.
import Link from "next/link";
import { statusLabel, type HomeProps } from "../types";
import { ArrowIcon, Shell, pct } from "./chrome";
import s from "./trail.module.css";

export function Home({ paths }: HomeProps) {
  return (
    <Shell>
      <section className={s.hero}>
        <svg className={s.heroTrail} viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
          <path d="M20 290 C 120 260, 60 200, 170 180 S 300 140, 240 90 S 330 30, 385 12" />
        </svg>
        <div className={s.heroText}>
          <p className={s.eyebrow}>Trailhead</p>
          <h1 className={s.heroTitle}>Every summit starts with one marked step.</h1>
          <p className={s.lede}>
            Paste a messy list of things you want to understand. Pathfinder maps it into a trail that starts from the very basics, with
            camps along the way.
          </p>
          <Link href="/new" className={`${s.cta} ${s.ctaHero}`}>
            <span>Plan a new trail</span>
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <section className={s.trails} aria-labelledby="trail-list">
        <h2 id="trail-list" className={s.sectionTitle}>
          Your trails
        </h2>
        {paths.length === 0 ? (
          <div className={s.empty}>
            <p className={s.emptyTitle}>No trails marked yet.</p>
            <p>Bring a list of topics, however rough. We’ll lay the first waypoint for you.</p>
            <Link href="/new" className={s.cta}>
              <span>Mark your first trail</span>
              <ArrowIcon />
            </Link>
          </div>
        ) : (
          <ul className={s.posts}>
            {paths.map((p) => {
              const prog = p.progress;
              return (
                <li key={p.id} className={s.post} data-status={p.status}>
                  <p className={s.plank}>{statusLabel[p.status]}</p>
                  <h3 className={s.postTitle}>
                    <Link href={`/paths/${p.id}?variant=trail`} className={s.cardLink}>
                      {p.title}
                    </Link>
                  </h3>
                  {prog ? (
                    <div className={s.postProgress}>
                      <div className={s.miniMeter} style={{ "--climbed": `${pct(prog.mastered, prog.total)}%` } as React.CSSProperties} aria-hidden="true" />
                      <p className={s.num}>
                        {prog.mastered} of {prog.total} mastered
                      </p>
                    </div>
                  ) : (
                    <p className={s.postProgressNone}>Not on the trail yet</p>
                  )}
                  <p className={`${s.postGo} ${s.withIcon}`} aria-hidden="true">
                    <span>{prog?.started ? "Continue" : "Open"}</span>
                    <ArrowIcon />
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Shell>
  );
}

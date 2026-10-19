// PROTOTYPE: throwaway. Trail map path overview: a trail sign sidebar beside one winding trail of camps and waypoints.
import Link from "next/link";
import type { Status } from "@/lib/progress";
import type { PathProps } from "../types";
import { ArrowIcon, FlagIcon, Shell, TentIcon, pct } from "./chrome";
import s from "./trail.module.css";

// "locked" only means prerequisites aren't mastered yet, so it reads as not started, like the current UI.
const LOOK: Record<Status, { label: string; kind: string }> = {
  mastered: { label: "Mastered", kind: "mastered" },
  in_progress: { label: "In progress", kind: "progress" },
  needs_review: { label: "Needs review", kind: "review" },
  available: { label: "Not started", kind: "new" },
  locked: { label: "Not started", kind: "new" },
};

export function Path({ path, progress }: PathProps) {
  const all = path.modules.flatMap((m) => m.concepts);
  const added = all.filter((c) => c.addedBySystem).length;
  const status = (slug: string): Status => progress.statuses[slug] ?? "available";
  const next = progress.next;
  const climbed = pct(progress.mastered, progress.total);

  return (
    <Shell>
      <section className={s.pathHead}>
        <p className={s.eyebrow}>{progress.started ? "Your trail" : "Your trail is marked"}</p>
        <h1 className={s.pathTitle}>{path.title}</h1>
        <p className={s.lede}>
          {all.length} steps in {path.modules.length} modules, {added} are basics I added.
        </p>
      </section>

      <div className={s.withSidebar}>
        <aside className={s.sign} aria-label="Trail summary">
          <div className={s.signBoard}>
            <p className={s.signKicker}>Trail sign</p>
            <p className={s.signTitle}>{path.title}</p>
            <dl className={s.signStats}>
              <div>
                <dt>Steps</dt>
                <dd>{progress.total}</dd>
              </div>
              <div>
                <dt>Camps</dt>
                <dd>{path.modules.length}</dd>
              </div>
              <div>
                <dt>Mastered</dt>
                <dd>
                  {progress.mastered}/{progress.total}
                </dd>
              </div>
            </dl>

            <div className={s.elevation} style={{ "--climbed": `${climbed}%` } as React.CSSProperties}>
              <div className={s.ridge} role="img" aria-label={`${progress.mastered} of ${progress.total} concepts mastered`} />
              <div className={s.ridgeScale} aria-hidden="true">
                <span>Trailhead</span>
                <span className={s.ridgePct}>{climbed}%</span>
                <span>Summit</span>
              </div>
            </div>

            {next ? (
              <Link href={`/paths/${path.id}/concepts/${next.slug}`} className={s.cta}>
                <span>{progress.started ? `Continue: ${next.name}` : "Start learning"}</span>
                <ArrowIcon />
              </Link>
            ) : (
              <p className={`${s.summit} ${s.withIcon}`}>
                <FlagIcon />
                <span>You’ve mastered every concept in this path.</span>
              </p>
            )}
          </div>
        </aside>

        <div className={s.trailSlot}>
          <ol className={s.trail} aria-label="Trail">
            {path.modules.map((m) => {
              const done = m.concepts.filter((c) => status(c.slug) === "mastered").length;
              return (
                <li key={m.order} className={s.camp} data-complete={done === m.concepts.length || undefined}>
                  <div className={s.campSign}>
                    <span className={s.campMarker} aria-hidden="true">
                      <TentIcon />
                    </span>
                    <p className={s.campKicker}>
                      Camp {m.order} ·{" "}
                      <span className={s.num}>
                        {done} of {m.concepts.length}
                      </span>{" "}
                      mastered
                    </p>
                    <h2 className={s.campTitle}>{m.title}</h2>
                    <p className={s.campWhy}>{m.whyItMatters}</p>
                    <Link href={`/paths/${path.id}/modules/${m.order}`} className={`${s.campLink} ${s.withIcon}`}>
                      <span>Open module {m.order}</span>
                      <ArrowIcon />
                    </Link>
                  </div>

                  <ol className={s.waypoints}>
                    {m.concepts.map((c) => {
                      const look = LOOK[status(c.slug)];
                      const isNext = next?.slug === c.slug;
                      return (
                        <li key={c.slug} className={s.waypoint} data-status={look.kind} data-next={isNext || undefined}>
                          <span className={s.marker} aria-hidden="true">
                            <span className={s.markerNum}>{c.step}</span>
                          </span>
                          <div className={s.card}>
                            <p className={s.cardMeta}>
                              <span className={s.num}>Step {c.step}</span>
                              <span className={s.badge}>{look.label}</span>
                              {isNext && <span className={s.nextTag}>Next up</span>}
                              {c.addedBySystem && <span className={s.added}>Added basic</span>}
                            </p>
                            <h3 className={s.cardTitle}>
                              <Link href={`/paths/${path.id}/concepts/${c.slug}`} className={s.cardLink}>
                                {c.name}
                              </Link>
                            </h3>
                            <p className={s.cardSummary}>{c.summary}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </li>
              );
            })}
          </ol>
          <div className={s.summitMarker} aria-hidden="true">
            <FlagIcon />
          </div>
        </div>
      </div>
    </Shell>
  );
}

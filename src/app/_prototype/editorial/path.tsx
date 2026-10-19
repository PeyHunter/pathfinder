// PROTOTYPE: throwaway. Path overview as a long-form article: modules are chapters, concepts are numbered entries.
import Link from "next/link";
import type { PathProps } from "../types";
import { Paper, statusWord } from "./chrome";
import s from "./editorial.module.css";

export function Path({ path, progress }: PathProps) {
  const all = path.modules.flatMap((m) => m.concepts);
  const added = all.filter((c) => c.addedBySystem);
  const status = (slug: string) => progress.statuses[slug] ?? "available";
  const mastered = (m: (typeof path.modules)[number]) => m.concepts.filter((c) => status(c.slug) === "mastered").length;
  const next = progress.next;
  const nextModule = next && path.modules.find((m) => m.concepts.some((c) => c.slug === next.slug))?.order;
  const edits = path.normalized?.concepts.filter((c) => c.change) ?? [];

  const cta = next ? (
    <Link href={`/paths/${path.id}/concepts/${next.slug}`} className={s.cta}>
      {progress.started ? `Continue: ${next.name}` : "Start learning"}
    </Link>
  ) : (
    <p className={s.finished}>You’ve mastered every concept in this path.</p>
  );

  return (
    <Paper compact>
      <main className={`${s.contentGrid} ${s.page}`}>
        <header className={s.articleHead}>
          <p className={s.kicker}>Learning path{path.learnerLevel ? ` · For a ${path.learnerLevel} reader` : ""}</p>
          <h1 className={s.headline}>{path.title}</h1>
          <p className={s.standfirst}>
            {all.length} steps in {path.modules.length} modules, {added.length} are basics I added so nothing is skipped.
          </p>
          <p className={s.byline}>
            <span className={s.smallCaps}>By Pathfinder</span>
            <span className={s.nums}>
              {progress.mastered} of {progress.total} concepts mastered
            </span>
            <span className={s.meter} style={{ "--pct": `${progress.total ? (progress.mastered / progress.total) * 100 : 0}%` } as React.CSSProperties} aria-hidden />
          </p>
          {cta}
        </header>

        <div className={`${s.breakout} ${s.articleBody}`}>
          <nav className={s.toc} aria-labelledby="ed-contents">
            <h2 id="ed-contents" className={s.smallCaps}>
              Contents
            </h2>
            <ol>
              {path.modules.map((m) => (
                <li key={m.order} data-current={m.order === nextModule || undefined}>
                  <a href={`#module-${m.order}`}>
                    <span className={s.tocNum}>{m.order}</span>
                    <span className={s.tocTitle}>{m.title}</span>
                    <span className={s.tocCount}>
                      {mastered(m)}/{m.concepts.length}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
            {cta}
          </nav>

          <div className={s.chapters}>
            {path.modules.map((m) => {
              const done = mastered(m);
              const touched = m.concepts.some((c) => !["available", "locked"].includes(status(c.slug)));
              const first = m.concepts[0];
              const last = m.concepts.at(-1);
              return (
                <section key={m.order} id={`module-${m.order}`} className={s.chapter} aria-labelledby={`ed-ch-${m.order}`}>
                  <p className={s.kicker}>Chapter {m.order}</p>
                  <h2 id={`ed-ch-${m.order}`} className={s.chapterHead}>
                    {m.title}
                  </h2>
                  <blockquote className={s.pullQuote}>
                    <p>{m.whyItMatters}</p>
                  </blockquote>
                  <p className={s.intro}>
                    {m.concepts.length === 1
                      ? `One step: ${first?.name}.`
                      : `${m.concepts.length} steps, from ${first?.name} to ${last?.name}.`}{" "}
                    <span className={s.nums}>
                      {done} of {m.concepts.length}
                    </span>{" "}
                    mastered.{" "}
                    <Link href={`/paths/${path.id}/modules/${m.order}`} className={s.inline}>
                      {done === m.concepts.length ? "Review the chapter" : touched ? "Continue the chapter" : "Start the chapter"}&nbsp;▸
                    </Link>
                  </p>
                  <ol className={s.entries}>
                    {m.concepts.map((c) => {
                      const st = status(c.slug);
                      const isNext = c.slug === next?.slug;
                      return (
                        <li key={c.slug} className={s.entry} data-status={st}>
                          <span className={s.step}>{c.step}</span>
                          <h3 className={s.entryHead}>
                            <Link href={`/paths/${path.id}/concepts/${c.slug}`} className={s.storyLink} aria-current={isNext ? "step" : undefined}>
                              {c.name}
                            </Link>
                            {c.addedBySystem && (
                              <sup className={s.mark} title="Added basic">
                                †
                              </sup>
                            )}
                          </h3>
                          <p className={s.summary}>{c.summary}</p>
                          <p className={s.entryMeta}>
                            <span className={s.smallCaps}>{statusWord[st]}</span>
                            {c.addedBySystem && <span className={s.smallCaps}>† Added basic</span>}
                          </p>
                          {isNext && (
                            <p className={s.readNext} aria-hidden>
                              Read next ▸
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                  {m.concepts.some((c) => c.addedBySystem) && (
                    <p className={s.footnote}>† A basic Pathfinder added so nothing is skipped.</p>
                  )}
                </section>
              );
            })}

            <details className={s.colophon}>
              <summary>
                <span className={s.smallCaps}>Colophon</span> What Pathfinder added
              </summary>
              <div className={s.colophonBody}>
                {added.length > 0 ? (
                  <>
                    <p>
                      {added.length} {added.length === 1 ? "basic was" : "basics were"} set in so the path starts from the ground up:
                    </p>
                    <ul>
                      {added.map((c) => (
                        <li key={c.slug}>
                          <span className={s.nums}>Step {c.step}</span> {c.name}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>Nothing was added: your list already covered the basics.</p>
                )}
                {edits.length > 0 && (
                  <>
                    <p>Edits to your list:</p>
                    <ul>
                      {edits.map((c, i) => (
                        <li key={i}>
                          “{c.from}” → {c.name} <em>({c.change})</em>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </details>
          </div>
        </div>
      </main>
    </Paper>
  );
}

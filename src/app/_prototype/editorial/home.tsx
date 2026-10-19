// PROTOTYPE: throwaway. Home as a front page: lead story, column stories, boxed call to start a new path.
import Link from "next/link";
import { statusLabel, type HomePath, type HomeProps } from "../types";
import { Paper } from "./chrome";
import s from "./editorial.module.css";

const filed = (d: Date) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric" });
const href = (p: HomePath) => `/paths/${p.id}?variant=editorial`;
const pct = (p: HomePath) => (p.progress && p.progress.total ? Math.round((p.progress.mastered / p.progress.total) * 100) : 0);

function Standing({ p }: { p: HomePath }) {
  if (!p.progress) return <p className={s.standing}>Not yet in print.</p>;
  return (
    <p className={s.standing}>
      <span className={s.smallCaps}>Standing</span>{" "}
      <span className={s.nums}>
        {p.progress.mastered} of {p.progress.total}
      </span>{" "}
      concepts mastered
      <span className={s.meter} style={{ "--pct": `${pct(p)}%` } as React.CSSProperties} aria-hidden />
    </p>
  );
}

function Lead({ p }: { p: HomePath }) {
  const next = p.progress?.next;
  return (
    <article className={s.lead}>
      <p className={s.kicker}>
        {statusLabel[p.status]} · Filed {filed(p.createdAt)}
      </p>
      <h2 className={s.leadHead}>
        <Link href={href(p)} className={s.storyLink}>
          {p.title}
        </Link>
      </h2>
      <div className={s.leadBody}>
        <p className={s.dropCap}>
          {p.progress
            ? p.progress.started
              ? `The path is under way: ${p.progress.mastered} of ${p.progress.total} concepts are mastered so far.`
              : `A fresh path of ${p.progress.total} concepts, laid out from the very basics and waiting for its first reader.`
            : "This path is still being set in type. Open it to see where it stands."}
          {next && ` Next up is “${next.name}”.`}
        </p>
        <Standing p={p} />
      </div>
      <p className={s.more}>
        {next ? (
          <Link href={`/paths/${p.id}/concepts/${next.slug}`} className={s.raised}>
            {p.progress?.started ? `Continue: ${next.name}` : "Start learning"} <span aria-hidden>▸</span>
          </Link>
        ) : (
          <span>
            {p.progress ? "Every concept mastered." : "Read the full story"} <span aria-hidden>▸</span>
          </span>
        )}
      </p>
    </article>
  );
}

function Column({ p }: { p: HomePath }) {
  return (
    <article className={s.story}>
      <p className={s.kicker}>{statusLabel[p.status]}</p>
      <h3 className={s.storyHead}>
        <Link href={href(p)} className={s.storyLink}>
          {p.title}
        </Link>
      </h3>
      <Standing p={p} />
      <p className={s.more}>
        {p.progress?.started ? "Continue" : "Open"} <span aria-hidden>▸</span>
      </p>
    </article>
  );
}

function NewPathBox() {
  return (
    <aside className={s.box} aria-labelledby="ed-new">
      <p className={s.kicker}>Classifieds</p>
      <h2 id="ed-new" className={s.boxHead}>
        Start a new path
      </h2>
      <p>Paste a messy list of things you want to understand. Pathfinder orders it and adds the basics you need.</p>
      <Link href="/new" className={s.cta}>
        Start a new path
      </Link>
    </aside>
  );
}

export function Home({ paths }: HomeProps) {
  const [lead, ...rest] = paths;
  const ready = paths.filter((p) => p.status === "ready").length;
  return (
    <Paper>
      <main className={`${s.contentGrid} ${s.page}`}>
        <section className={`${s.breakout} ${s.front}`} aria-label="Lead story">
          <div className={s.leadSlot}>
            {lead ? (
              <Lead p={lead} />
            ) : (
              <article className={s.lead}>
                <p className={s.kicker}>Stop the presses</p>
                <h2 className={s.leadHead}>Nothing in print yet. Your first path is the lead story.</h2>
                <p className={s.dropCap}>
                  Give Pathfinder a messy list of things you want to learn. It cleans the list up, adds the basics you would otherwise
                  trip over, and sets everything in order as chapters you can follow step by step.
                </p>
              </article>
            )}
          </div>
          <div className={s.frontSide}>
            <NewPathBox />
            {paths.length > 0 && (
              <p className={s.index}>
                <span className={s.smallCaps}>In this edition</span>
                <span className={s.nums}>
                  {paths.length} {paths.length === 1 ? "path" : "paths"}, {ready} ready
                </span>
              </p>
            )}
          </div>
        </section>

        {rest.length > 0 && (
          <section className={`${s.breakout} ${s.columns}`} aria-labelledby="ed-more">
            <h2 id="ed-more" className={s.sectionRule}>
              Also in this edition
            </h2>
            <div className={s.storyGrid}>
              {rest.map((p) => (
                <Column key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </Paper>
  );
}

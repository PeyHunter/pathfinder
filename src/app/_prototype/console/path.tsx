// PROTOTYPE: throwaway. Path overview as a dashboard: KPI tiles, a NEXT panel and a module status board.
import type { ReactNode } from "react";
import Link from "next/link";
import type { Status } from "@/lib/progress";
import type { PathProps } from "../types";
import { Chevron, Meter, STATUS, Segments, Shell, pad, percent } from "./shared";
import s from "./console.module.css";

export function Path({ path, progress }: PathProps) {
  const all = path.modules.flatMap((m) => m.concepts);
  const nameOf = new Map(all.map((c) => [c.slug, c.name]));
  const added = all.filter((c) => c.addedBySystem).length;
  const status = (slug: string): Status => progress.statuses[slug] ?? "available";
  const pct = percent(progress.mastered, progress.total);
  const next = progress.next;
  const nextConcept = next ? all.find((c) => c.slug === next.slug) : undefined;
  const nextModule = next ? path.modules.find((m) => m.concepts.some((c) => c.slug === next.slug)) : undefined;

  return (
    <Shell readout={`path #${pad(path.id, 3)} · ${pct}% complete · ${progress.started ? "active" : "standby"}`}>
      <header className={s.pathHead}>
        <p className={s.prompt}>
          <Link href="/?variant=console" className={s.crumb}>~/paths</Link>
          <span className={s.dim}>/{pad(path.id, 3)}</span>
        </p>
        <h1 className={s.pathTitle}>{path.title}</h1>
        <p className={s.lede}>
          {all.length} steps in {path.modules.length} modules, {added} are basics I added.
        </p>
      </header>

      <section aria-label="Key numbers" className={s.kpis}>
        <Kpi label="Steps" value={all.length} note="concepts in order" />
        <Kpi label="Modules" value={path.modules.length} note="≤ 7 steps each" />
        <Kpi label="Mastered" value={`${progress.mastered}/${progress.total}`} note="concepts" tone="ok" />
        <Kpi label="Complete" value={`${pct}%`} note={<Meter value={pct} />} tone="ok" />
        <Kpi label="Added basics" value={added} note="prereqs I filled in" />
        <Kpi
          label="Next up"
          value={next ? next.name : "—"}
          note={nextConcept && nextModule ? `step ${pad(nextConcept.step)} · module ${nextModule.order}` : "nothing queued"}
          tone="warn"
          wide
        />
      </section>

      <section className={`${s.panel} ${s.nextPanel}`} aria-labelledby="cm-next">
        <header className={s.panelBar}>
          <h2 id="cm-next">Next &gt;</h2>
          <span className={s.dim}>{next ? (progress.started ? "resume" : "ready to start") : "all clear"}</span>
        </header>
        <div className={s.nextBody}>
          {next ? (
            <div className={s.nextInfo}>
              <p className={s.nextName}>
                {nextConcept && <span className={s.dim}>[{pad(nextConcept.step)}] </span>}
                {next.name}
              </p>
              {nextConcept && <p className={s.dim}>{nextConcept.summary}</p>}
              <Link href={`/paths/${path.id}/concepts/${next.slug}`} className={s.cta}>
                <kbd className={s.kbd}>↵</kbd>
                <span className={s.ctaLabel}>{progress.started ? `Continue: ${next.name}` : "Start learning"}</span>
                <Chevron />
              </Link>
            </div>
          ) : (
            <p className={s.allClear}>All systems green. You&apos;ve mastered every concept in this path.</p>
          )}
          <div className={s.nextMeter}>
            <Meter value={pct} />
            <p className={s.num}>
              {progress.mastered} of {progress.total} concepts mastered
            </p>
          </div>
        </div>
      </section>

      <section className={s.panel} aria-labelledby="cm-board">
        <header className={s.panelBar}>
          <h2 id="cm-board">Module status board</h2>
          <ul className={s.legend} aria-label="Legend">
            {(Object.keys(STATUS) as Status[]).map((st) => (
              <li key={st} data-status={st}>
                <span className={s.glyph} aria-hidden="true">{STATUS[st].glyph}</span> {STATUS[st].label}
              </li>
            ))}
          </ul>
        </header>

        <div className={s.board}>
          {path.modules.map((m) => {
            const statuses = m.concepts.map((c) => status(c.slug));
            const done = statuses.filter((st) => st === "mastered").length;
            return (
              <div key={m.order} className={s.slot}>
                <article className={s.module} aria-labelledby={`cm-m${m.order}`}>
                  <header className={s.modHead}>
                    <span className={s.modOrder}>M{pad(m.order)}</span>
                    <div className={s.modInfo}>
                      <h3 id={`cm-m${m.order}`} className={s.modTitle}>{m.title}</h3>
                      <p className={s.why}>{m.whyItMatters}</p>
                    </div>
                    <div className={s.modMeta}>
                      <p className={s.num}>
                        <span className={done === m.concepts.length ? s.yes : undefined}>
                          {done}/{m.concepts.length}
                        </span>{" "}
                        <span className={s.dim}>mastered</span>
                      </p>
                      <Segments statuses={statuses} label={`${done} of ${m.concepts.length} mastered`} />
                      <Link href={`/paths/${path.id}/modules/${m.order}`} className={s.modLink}>
                        Open module <Chevron />
                      </Link>
                    </div>
                  </header>

                  <ol className={s.log}>
                    {m.concepts.map((c) => {
                      const st = status(c.slug);
                      const isNext = c.slug === next?.slug;
                      return (
                        <li key={c.slug} className={s.row} data-status={st} data-next={isNext || undefined}>
                          <span className={s.step}>[{pad(c.step)}]</span>
                          <span className={s.glyph} aria-hidden="true">{STATUS[st].glyph}</span>
                          <div className={s.rowMain}>
                            <p className={s.rowHead}>
                              <Link href={`/paths/${path.id}/concepts/${c.slug}`} className={s.name}>
                                {c.name}
                              </Link>
                              <span className={s.state}>{STATUS[st].label}</span>
                              {c.addedBySystem && <span className={s.tag}>Added basic</span>}
                              {isNext && <span className={s.nextTag}>◀ Next</span>}
                            </p>
                            <p className={s.summary}>{c.summary}</p>
                            {c.prerequisites.length > 0 && (
                              <p className={s.req}>
                                requires: {c.prerequisites.map((p) => nameOf.get(p) ?? p).join(", ")}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </article>
              </div>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}

function Kpi({
  label,
  value,
  note,
  tone,
  wide,
}: {
  label: string;
  value: ReactNode;
  note: ReactNode;
  tone?: "ok" | "warn";
  wide?: boolean;
}) {
  return (
    <div className={s.kpi} data-tone={tone} data-wide={wide || undefined}>
      <p className={s.kpiLabel}>{label}</p>
      <p className={s.kpiValue}>{value}</p>
      <div className={s.kpiNote}>{note}</div>
    </div>
  );
}

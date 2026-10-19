// PROTOTYPE: throwaway. Home as an operator's index: command-prompt hero and a dense table of paths.
import Link from "next/link";
import { statusLabel, type HomeProps } from "../types";
import { Chevron, Shell, pad, percent } from "./shared";
import s from "./console.module.css";

const BAR = 12;

export function Home({ paths }: HomeProps) {
  const ready = paths.filter((p) => p.progress);
  const mastered = ready.reduce((n, p) => n + p.progress!.mastered, 0);
  const total = ready.reduce((n, p) => n + p.progress!.total, 0);

  return (
    <Shell readout={`${paths.length} paths · ${ready.length} ready · ${mastered}/${total} mastered`}>
      <section className={s.hero} aria-labelledby="cm-hero">
        <p className={s.prompt}>
          <span className={s.ps1}>operator@pathfinder:~$</span> pathfinder new --from{" "}
          <span className={s.str}>&quot;messy list&quot;</span>
          <span className={s.cursor} aria-hidden="true">▌</span>
        </p>
        <h1 id="cm-hero" className={s.heroTitle}>
          Learn anything. One step at a time.
        </h1>
        <p className={s.lede}>
          Paste a messy list of things you want to understand. Pathfinder turns it into an ordered path of modules and
          steps that starts from the very basics.
        </p>
        <Link href="/new" className={s.cta}>
          <kbd className={s.kbd}>↵</kbd>
          <span className={s.ctaLabel}>Create a path</span>
          <Chevron />
        </Link>
      </section>

      <section className={s.panel} aria-labelledby="cm-index">
        <header className={s.panelBar}>
          <h2 id="cm-index">Path index</h2>
          <span className={s.dim}>{pad(paths.length, 3)} records</span>
        </header>

        {paths.length === 0 ? (
          <div className={s.empty}>
            <p className={s.prompt}>
              <span className={s.ps1}>$</span> ls ~/paths
            </p>
            <p className={s.emptyTitle}>No paths yet. The board is quiet.</p>
            <p className={s.dim}>Start with a messy list. I&apos;ll sort it and fill in the basics you need.</p>
            <Link href="/new" className={s.cta}>
              <kbd className={s.kbd}>↵</kbd>
              <span className={s.ctaLabel}>Create your first path</span>
              <Chevron />
            </Link>
          </div>
        ) : (
          <div className={s.scroller} tabIndex={0} role="region" aria-label="Paths table, scrolls sideways">
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Title</th>
                  <th scope="col">Status</th>
                  <th scope="col" className={s.num}>Mastered</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Started</th>
                </tr>
              </thead>
              <tbody>
                {paths.map((p) => {
                  const prog = p.progress;
                  const pct = prog ? percent(prog.mastered, prog.total) : 0;
                  const filled = Math.round((pct / 100) * BAR);
                  return (
                    <tr key={p.id} className={s.trow}>
                      <td className={s.dim}>#{pad(p.id, 3)}</td>
                      <td className={s.titleCell}>
                        <Link href={`/paths/${p.id}?variant=console`} className={s.rowLink}>
                          {p.title}
                        </Link>
                      </td>
                      <td>
                        <span className={s.pstatus} data-path-status={p.status}>
                          {statusLabel[p.status]}
                        </span>
                      </td>
                      <td className={s.num}>{prog ? `${prog.mastered}/${prog.total}` : "—"}</td>
                      <td>
                        {prog ? (
                          <span className={s.ascii}>
                            <span aria-hidden="true">
                              [<span className={s.asciiOn}>{"█".repeat(filled)}</span>
                              <span className={s.asciiOff}>{"░".repeat(BAR - filled)}</span>]
                            </span>{" "}
                            <span className={s.num}>{String(pct).padStart(3, " ")}%</span>
                          </span>
                        ) : (
                          <span className={s.dim}>—</span>
                        )}
                      </td>
                      <td className={prog?.started ? s.yes : s.dim}>{prog ? (prog.started ? "yes" : "no") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Shell>
  );
}

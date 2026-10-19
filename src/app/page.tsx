import Link from "next/link";
import { PathActions } from "@/components/path-actions";
import { ProgressBar } from "@/components/status";
import { ButtonLink, Section } from "@/components/ui";
import { getPathProgress } from "@/lib/learning-service";
import { listPaths } from "@/lib/path-service";
import { pickVariant, Switcher } from "./_prototype/variants";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const all = listPaths().reverse();
  // PROTOTYPE: ?variant= swaps in a visual direction; without it the page renders as before.
  const v = await pickVariant(searchParams);
  if (v)
    return (
      <>
        <v.Home paths={all.map((p) => ({ ...p, progress: p.status === "ready" ? getPathProgress(p.id) : null }))} />
        <Switcher current={v.key} />
      </>
    );
  return (
    <>
      <Switcher current="" />
      <Section className="text-center animate-rise">
        <h1 className="text-5xl md:text-7xl font-semibold text-ink">Learn anything.<br />One step at a time.</h1>
        <p className="mx-auto mt-6 max-w-xl text-[21px] md:text-2xl leading-snug text-ink-2">
          Paste a messy list of things you want to understand. Pathfinder turns it into a clear path that starts from the very basics.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <ButtonLink href="/new">Create a path</ButtonLink>
        </div>
      </Section>

      {all.length > 0 && (
        <Section tone="mist">
          <h2 className="text-3xl md:text-4xl font-semibold mb-8">Your paths</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {all.map((p) => {
              const prog = p.status === "ready" ? getPathProgress(p.id) : null;
              return (
                <div key={p.id} className="rounded-[var(--radius-card)] bg-canvas p-7 shadow-card">
                  <p className="text-xs uppercase tracking-wide text-ink-3">{statusLabel[p.status]}</p>
                  <Link href={`/paths/${p.id}`} className="mt-2 block text-2xl font-semibold hover:underline">
                    {p.title}
                  </Link>
                  {prog && (
                    <div className="mt-4 space-y-1.5">
                      <ProgressBar done={prog.mastered} total={prog.total} />
                      <p className="text-sm text-ink-2">
                        {prog.mastered} of {prog.total} concepts mastered
                      </p>
                    </div>
                  )}
                  <div className="mt-5 flex items-center justify-between gap-4">
                    <Link href={`/paths/${p.id}`} className="text-link hover:underline">
                      {prog?.started ? "Continue ›" : "Open ›"}
                    </Link>
                    <PathActions id={p.id} title={p.title} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </>
  );
}

const statusLabel = {
  normalizing: "Reading your list",
  awaiting_confirmation: "Needs your input",
  generating: "Building",
  ready: "Ready",
  failed: "Something went wrong",
} as const;

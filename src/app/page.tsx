import Link from "next/link";
import { ButtonLink, Section } from "@/components/ui";
import { listPaths } from "@/lib/path-service";

export const dynamic = "force-dynamic";

export default function Home() {
  const all = listPaths().reverse();
  return (
    <>
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
            {all.map((p) => (
              <Link
                key={p.id}
                href={`/paths/${p.id}`}
                className="group rounded-[var(--radius-card)] bg-canvas p-7 shadow-card transition-transform hover:scale-[1.01]"
              >
                <p className="text-xs uppercase tracking-wide text-ink-3">{statusLabel[p.status]}</p>
                <h3 className="mt-2 text-2xl font-semibold">{p.title}</h3>
                <p className="mt-4 text-link group-hover:underline">Open ›</p>
              </Link>
            ))}
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

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MarkDone } from "@/components/mark-done";
import { PathActions } from "@/components/path-actions";
import { ProgressBar, StatusBadge } from "@/components/status";
import { Button, ButtonLink, Card, Eyebrow, Section, Spinner } from "@/components/ui";
import type { PathProgress } from "@/lib/learning-service";
import type { PathView } from "@/lib/path-service";
import type { Resolution } from "@/lib/schemas";

export default function PathScreen({ initial, progress }: { initial: PathView; progress: PathProgress | null }) {
  const [path, setPath] = useState(initial);
  const router = useRouter();
  const working = path.status === "normalizing" || path.status === "generating";

  // Generation runs on the server after the request returns, so poll until it settles.
  useEffect(() => {
    if (!working) return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/paths/${path.id}`);
      if (!res.ok) return;
      const next: PathView = await res.json();
      setPath(next);
      if (next.status === "ready") router.refresh(); // the server side adds progress for ready paths
    }, 2000);
    return () => clearInterval(t);
  }, [working, path.id, router]);

  const refresh = async () => {
    const res = await fetch(`/api/paths/${path.id}`);
    if (res.ok) setPath(await res.json());
    router.refresh();
  };

  if (path.status === "normalizing") return <Spinner label="Reading your list…" />;
  if (path.status === "generating")
    return <Spinner label="Designing your path. This can take a minute or two." />;
  if (path.status === "failed") return <Failed path={path} onRetry={refresh} />;
  if (path.status === "awaiting_confirmation") return <Review path={path} onConfirmed={refresh} />;
  return <Result path={path} progress={progress} />;
}

function Failed({ path, onRetry }: { path: PathView; onRetry: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Section narrow className="text-center">
      <h1 className="text-4xl font-semibold">That didn’t work.</h1>
      <pre className="mt-6 whitespace-pre-wrap text-left text-sm text-ink-2 bg-mist rounded-2xl p-5">{path.error}</pre>
      <Button
        className="mt-8"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await fetch(`/api/paths/${path.id}/retry`, { method: "POST" }).catch(() => null);
          if (!res?.ok) {
            setError(await errorText(res));
            setBusy(false);
            return;
          }
          onRetry();
        }}
      >
        Try again
      </Button>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
    </Section>
  );
}

type Choice = Resolution["choice"];

async function errorText(res: Response | null): Promise<string> {
  if (!res) return "Couldn’t reach the server. Is it still running?";
  const body = await res.json().catch(() => null);
  return body?.error ?? `The server answered ${res.status}. Please try again.`;
}

function Review({ path, onConfirmed }: { path: PathView; onConfirmed: () => void }) {
  const normalized = path.normalized!;
  const [choices, setChoices] = useState<Record<string, Choice>>(() =>
    Object.fromEntries(normalized.ambiguous.map((a) => [a.id, { kind: "pick", index: a.likely }])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = normalized.concepts.filter((c) => c.change);
  const customEmpty = Object.values(choices).some((c) => c.kind === "custom" && !c.text.trim());

  async function confirm() {
    setBusy(true);
    setError(null);
    const resolutions = Object.entries(choices).map(([id, choice]) => ({ id, choice }));
    const res = await fetch(`/api/paths/${path.id}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resolutions }),
    }).catch(() => null);
    if (!res?.ok) {
      setError(await errorText(res));
      setBusy(false);
      return;
    }
    onConfirmed();
  }

  return (
    <>
      <Section className="text-center animate-rise">
        <Eyebrow>Step 1 of 2</Eyebrow>
        <h1 className="text-5xl md:text-6xl font-semibold">Check my reading.</h1>
        <p className="mx-auto mt-5 max-w-xl text-[21px] text-ink-2 leading-snug">
          I cleaned up your list into {normalized.concepts.length} concepts.
          {normalized.ambiguous.length === 1 && " One item could mean different things, so tell me which you meant."}
          {normalized.ambiguous.length > 1 && ` ${normalized.ambiguous.length} items could mean different things, so tell me which you meant.`}
        </p>
      </Section>

      {normalized.ambiguous.length > 0 && (
        <Section tone="mist">
          <h2 className="text-3xl font-semibold mb-8">What did you mean?</h2>
          <div className="space-y-5">
            {normalized.ambiguous.map((a) => {
              const choice = choices[a.id];
              const set = (c: Choice) => setChoices((s) => ({ ...s, [a.id]: c }));
              return (
                <Card key={a.id}>
                  <p className="text-sm text-ink-3">You wrote “{a.original}”</p>
                  <h3 className="mt-1 text-xl font-semibold">{a.question}</h3>
                  <div className="mt-5 space-y-2">
                    {a.interpretations.map((opt, i) => (
                      <Option key={i} selected={choice.kind === "pick" && choice.index === i} onSelect={() => set({ kind: "pick", index: i })}>
                        <span className="font-medium">{opt.name}</span>
                        {i === a.likely && <span className="ml-2 text-xs text-accent">Most likely</span>}
                        <span className="block text-ink-2 text-[15px]">{opt.description}</span>
                      </Option>
                    ))}
                    <Option selected={choice.kind === "custom"} onSelect={() => set({ kind: "custom", text: "" })}>
                      <span className="font-medium">Something else</span>
                      {choice.kind === "custom" && (
                        <input
                          autoFocus
                          value={choice.text}
                          onChange={(e) => set({ kind: "custom", text: e.target.value })}
                          placeholder="Describe what you meant"
                          className="mt-2 block w-full rounded-xl border border-line px-4 py-2 outline-none focus:border-accent"
                        />
                      )}
                    </Option>
                    <Option selected={choice.kind === "skip"} onSelect={() => set({ kind: "skip" })}>
                      <span className="font-medium">Leave it out</span>
                    </Option>
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      <Section>
        <h2 className="text-3xl font-semibold">Your concepts</h2>
        <div className="mt-8 flex flex-wrap gap-2">
          {normalized.concepts.map((c, i) => (
            <span key={i} title={c.change ? `“${c.from}” · ${c.change}` : c.from} className="rounded-full bg-mist px-4 py-2 text-[15px]">
              {c.name}
            </span>
          ))}
        </div>
        {changed.length > 0 && (
          <details className="mt-8 text-[15px]">
            <summary className="cursor-pointer text-link">See what I changed ({changed.length})</summary>
            <ul className="mt-4 divide-y divide-line/60">
              {changed.map((c, i) => (
                <li key={i} className="py-2.5 grid grid-cols-[1fr_auto_1fr] gap-3 items-baseline">
                  <span className="text-ink-2">{c.from}</span>
                  <span className="text-ink-3">→</span>
                  <span>
                    {c.name} <span className="text-ink-3">· {c.change}</span>
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
        <div className="mt-12 text-center">
          <Button onClick={confirm} disabled={busy || customEmpty}>
            {busy ? "Starting…" : "Looks good, build my path"}
          </Button>
          {error && <p className="mt-4 text-sm text-danger">{error}</p>}
          <p className="mt-3 text-sm text-ink-3">I’ll add the basics you need and put everything in order.</p>
        </div>
      </Section>
    </>
  );
}

function Option({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: React.ReactNode }) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === " " || e.key === "Enter") && e.target === e.currentTarget && onSelect()}
      className={`cursor-pointer rounded-xl border-2 px-4 py-3 transition-colors ${selected ? "border-accent bg-accent/[0.04]" : "border-line/70 hover:border-ink-3"}`}
    >
      {children}
    </div>
  );
}

function Result({ path, progress }: { path: PathView; progress: PathProgress | null }) {
  const all = path.modules.flatMap((m) => m.concepts);
  const added = all.filter((c) => c.addedBySystem).length;
  const status = (slug: string) => progress?.statuses[slug] ?? "available";
  const continueHref = progress?.next ? `/paths/${path.id}/concepts/${progress.next.slug}` : null;
  return (
    <>
      <Section className="text-center animate-rise">
        <Eyebrow>{progress?.started ? "Your path" : "Your path is ready"}</Eyebrow>
        <h1 className="text-5xl md:text-6xl font-semibold">{path.title}</h1>
        <p className="mx-auto mt-5 max-w-xl text-[21px] text-ink-2">
          {all.length} steps in {path.modules.length} modules. {added} of them are basics I added so nothing is skipped.
        </p>
        {progress && (
          <div className="mx-auto mt-8 max-w-md space-y-2">
            <ProgressBar done={progress.mastered} total={progress.total} />
            <p className="text-sm text-ink-2">
              {progress.mastered} of {progress.total} concepts mastered
            </p>
          </div>
        )}
        <div className="mt-8 flex flex-col items-center gap-3">
          {continueHref ? (
            <ButtonLink href={continueHref}>
              {progress?.started ? `Continue: ${progress.next!.name}` : "Start learning"}
            </ButtonLink>
          ) : (
            progress && <p className="text-xl font-semibold text-success">You’ve mastered every concept in this path.</p>
          )}
          <PathActions id={path.id} title={path.title} className="justify-center" />
        </div>
      </Section>

      <Section tone="mist">
        <div className="space-y-6">
          {path.modules.map((m) => {
            const done = m.concepts.filter((c) => status(c.slug) === "mastered").length;
            const touched = m.concepts.some((c) => status(c.slug) !== "available" && status(c.slug) !== "locked");
            return (
              <Card key={m.order} className="p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-ink-3">
                      Module {m.order} · {done} of {m.concepts.length} mastered
                    </p>
                    <h2 className="text-2xl font-semibold">{m.title}</h2>
                    <p className="mt-1 text-ink-2">{m.whyItMatters}</p>
                  </div>
                  <ButtonLink href={`/paths/${path.id}/modules/${m.order}`} variant={touched ? "primary" : "secondary"}>
                    {done === m.concepts.length ? "Review module" : touched ? "Continue module" : "Start module"}
                  </ButtonLink>
                </div>
                <ol className="mt-6 space-y-4">
                  {m.concepts.map((c) => (
                    <li key={c.slug} className="flex gap-4">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mist text-sm font-medium text-ink-2">
                        {c.step}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">
                          <Link href={`/paths/${path.id}/concepts/${c.slug}`} className="hover:underline">
                            {c.name}
                          </Link>
                          {c.addedBySystem && <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-xs text-ink-3">Added basic</span>}
                        </p>
                        <p className="text-[15px] text-ink-2">{c.summary}</p>
                        {progress && <MarkDone pathId={path.id} slug={c.slug} status={status(c.slug)} className="mt-2" />}
                      </div>
                      {progress && <StatusBadge status={status(c.slug)} />}
                    </li>
                  ))}
                </ol>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section>
        <details>
          <summary className="cursor-pointer text-link">Show the graph as JSON</summary>
          <pre className="mt-4 max-h-[600px] overflow-auto rounded-2xl bg-mist p-5 text-xs font-mono">
            {JSON.stringify(path.modules, null, 2)}
          </pre>
        </details>
      </Section>
    </>
  );
}

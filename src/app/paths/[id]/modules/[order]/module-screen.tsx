"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MarkDone } from "@/components/mark-done";
import { ProgressBar, StatusBadge } from "@/components/status";
import { Button, ButtonLink, Card, Eyebrow, Section, Spinner } from "@/components/ui";
import type { ModuleView } from "@/lib/learning-service";
import type { Status } from "@/lib/progress";

export default function ModuleScreen({ initial }: { initial: ModuleView }) {
  const [view, setView] = useState(initial);
  const [startError, setStartError] = useState<string | null>(null);
  const base = `/api/paths/${view.pathId}/modules/${view.order}`;

  // Only used to retry after a failure; the page starts the first generation on the server.
  async function start() {
    setStartError(null);
    const res = await fetch(base, { method: "POST" }).catch(() => null);
    if (!res?.ok) return setStartError("Couldn’t start writing the lessons. Is the server running?");
    setView((v) => ({ ...v, contentStatus: "generating", contentError: null }));
  }

  useEffect(() => {
    if (view.contentStatus !== "generating") return;
    const t = setInterval(async () => {
      const res = await fetch(base).catch(() => null);
      if (res?.ok) setView(await res.json());
    }, 3000);
    return () => clearInterval(t);
  }, [view.contentStatus, base]);

  const setStatus = (slug: string, status: Status) =>
    setView((v) => ({ ...v, concepts: v.concepts.map((c) => (c.slug === slug ? { ...c, status } : c)) }));

  const done = view.concepts.filter((c) => c.status === "mastered").length;
  const back = (
    <Link href={`/paths/${view.pathId}`} className="text-link hover:underline">
      ‹ {view.pathTitle}
    </Link>
  );

  if (view.contentStatus === "generating")
    return (
      <Section narrow className="text-center">
        {back}
        <Spinner label={`Writing the lessons for “${view.title}”. This takes a minute or two, once per module.`} />
        {startError && <p className="text-danger">{startError}</p>}
      </Section>
    );

  if (view.contentStatus === "failed")
    return (
      <Section narrow className="text-center">
        {back}
        <h1 className="mt-6 text-4xl font-semibold">The lessons didn’t come out right.</h1>
        <pre className="mt-6 whitespace-pre-wrap text-left text-sm text-ink-2 bg-mist rounded-2xl p-5">{view.contentError}</pre>
        <Button className="mt-8" onClick={start}>
          Try again
        </Button>
        {startError && <p className="mt-4 text-danger">{startError}</p>}
      </Section>
    );

  const next = view.concepts.find((c) => c.isNext && c.status !== "mastered") ?? view.concepts.find((c) => c.status !== "mastered");
  return (
    <>
      <Section className="animate-rise">
        {back}
        <div className="mt-6">
          <Eyebrow>
            Module {view.order} of {view.moduleCount}
          </Eyebrow>
        </div>
        <h1 className="text-5xl font-semibold">{view.title}</h1>
        <p className="mt-4 max-w-2xl text-[21px] text-ink-2">{view.whyItMatters}</p>
        <div className="mt-8 max-w-md space-y-2">
          <ProgressBar done={done} total={view.concepts.length} />
          <p className="text-sm text-ink-2">
            {done} of {view.concepts.length} concepts mastered
          </p>
        </div>
        <div className="mt-8">
          {next ? (
            <ButtonLink href={`/paths/${view.pathId}/concepts/${next.slug}`}>
              {next.status === "available" || next.status === "locked" ? "Start" : "Continue"}: {next.name}
            </ButtonLink>
          ) : view.order < view.moduleCount ? (
            <ButtonLink href={`/paths/${view.pathId}/modules/${view.order + 1}`}>Module mastered. On to module {view.order + 1} ›</ButtonLink>
          ) : (
            <p className="text-xl font-semibold text-success">You’ve mastered the last module.</p>
          )}
        </div>
      </Section>

      <Section tone="mist">
        <div className="space-y-3">
          {view.concepts.map((c) => (
            <Card key={c.slug} className={`flex items-start gap-4 ${c.slug === next?.slug ? "ring-2 ring-accent" : ""}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-sm font-medium text-ink-2">{c.step}</span>
              <div className="flex-1">
                <Link href={`/paths/${view.pathId}/concepts/${c.slug}`} className="font-medium hover:underline">
                  {c.name}
                </Link>
                <p className="text-[15px] text-ink-2">{c.summary}</p>
                <MarkDone pathId={view.pathId} slug={c.slug} status={c.status} onChange={(s) => setStatus(c.slug, s)} className="mt-2" />
              </div>
              <StatusBadge status={c.status} />
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}

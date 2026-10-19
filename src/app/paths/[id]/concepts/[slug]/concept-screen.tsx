"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { MarkDone } from "@/components/mark-done";
import { InlineCode, Prose } from "@/components/prose";
import { StatusBadge } from "@/components/status";
import { Button, ButtonLink, Card, Eyebrow, Section } from "@/components/ui";
import type { ConceptView, Lesson } from "@/lib/learning-service";
import { MAX_ANSWER_CHARS, MAX_CHAT_CHARS, MAX_QUIZ_LEVEL, MIN_QUIZ_LEVEL } from "@/lib/limits";
import type { QuizGrade } from "@/lib/schemas";

export default function ConceptScreen({ initial }: { initial: ConceptView }) {
  const [view, setView] = useState(initial);
  const lesson = view.lesson!;
  const moduleHref = `/paths/${view.pathId}/modules/${view.module.order}`;

  return (
    <>
      <Section narrow className="animate-rise">
        <div className="flex flex-wrap gap-x-2 text-[15px] text-ink-3">
          <Link href={`/paths/${view.pathId}`} className="text-link hover:underline">
            {view.pathTitle}
          </Link>
          <span>›</span>
          <Link href={moduleHref} className="text-link hover:underline">
            Module {view.module.order}: {view.module.title}
          </Link>
        </div>
        <div className="mt-8 flex items-center gap-3">
          <Eyebrow>Concept</Eyebrow>
          <span className="mb-2">
            <StatusBadge status={view.status} />
          </span>
        </div>
        <h1 className="text-5xl font-semibold">{view.name}</h1>
        <p className="mt-4 text-[21px] text-ink-2">{view.summary}</p>
        {view.prerequisites.some((p) => p.status !== "mastered") && (
          <p className="mt-6 rounded-2xl bg-mist p-4 text-[15px] text-ink-2">
            This builds on{" "}
            {view.prerequisites
              .filter((p) => p.status !== "mastered")
              .map((p, i, arr) => (
                <Fragment key={p.slug}>
                  <Link href={`/paths/${view.pathId}/concepts/${p.slug}`} className="text-link hover:underline">
                    {p.name}
                  </Link>
                  {i < arr.length - 1 ? ", " : ""}
                </Fragment>
              ))}
            , which you haven’t mastered yet. You can still go ahead.
          </p>
        )}
      </Section>

      <Section narrow tone="mist">
        <h2 className="text-3xl font-semibold">What it is</h2>
        <Prose text={lesson.explanation} className="mt-5" />
      </Section>

      <Section narrow>
        <h2 className="text-3xl font-semibold">Example</h2>
        <Prose text={lesson.example.description} className="mt-5" />
        {lesson.example.code && (
          <pre className="mt-6 overflow-x-auto rounded-2xl bg-ink p-5 text-sm leading-relaxed text-white">
            {lesson.example.language && <span className="mb-3 block text-xs uppercase tracking-wide text-white/50">{lesson.example.language}</span>}
            <code>{lesson.example.code}</code>
          </pre>
        )}
      </Section>

      <AskTutor view={view} />

      <Quiz
        // New questions start a fresh quiz: empty answer boxes, no old feedback.
        key={lesson.questions.map((q) => q.prompt).join("\n")}
        view={view}
        lesson={lesson}
        onGraded={(passed) => setView((v) => ({ ...v, status: passed ? "mastered" : v.status === "mastered" ? "needs_review" : v.status, attempts: v.attempts + 1 }))}
        onStatus={(status) => setView((v) => ({ ...v, status }))}
        onLesson={(next) => setView((v) => ({ ...v, lesson: next, lastAttempt: null }))}
      />

      <Section narrow className="flex flex-wrap items-center justify-between gap-4 text-[15px]">
        {view.prev ? (
          <Link href={`/paths/${view.pathId}/concepts/${view.prev.slug}`} className="text-link hover:underline">
            ‹ {view.prev.name}
          </Link>
        ) : (
          <Link href={moduleHref} className="text-link hover:underline">
            ‹ Back to module
          </Link>
        )}
        {view.next ? (
          <Link href={`/paths/${view.pathId}/concepts/${view.next.slug}`} className="text-link hover:underline">
            {view.next.name} ›
          </Link>
        ) : (
          <Link href={moduleHref} className="text-link hover:underline">
            Back to module ›
          </Link>
        )}
      </Section>
    </>
  );
}

function Quiz({
  view,
  lesson,
  onGraded,
  onStatus,
  onLesson,
}: {
  view: ConceptView;
  lesson: Lesson;
  onGraded: (passed: boolean) => void;
  onStatus: (status: ConceptView["status"]) => void;
  onLesson: (lesson: Lesson) => void;
}) {
  const [answers, setAnswers] = useState<string[]>(() => lesson.questions.map((_, i) => view.lastAttempt?.answers[i] ?? ""));
  const [grade, setGrade] = useState<QuizGrade | null>(view.lastAttempt?.grade ?? null);
  const [busy, setBusy] = useState(false);
  const [changing, setChanging] = useState<"harder" | "easier" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const empty = answers.some((a) => !a.trim());
  const level = lesson.level ?? 2;
  // Passing the quiz and "mark as done" both mean you're ready to move on.
  const understood = grade?.passed || view.status === "mastered";

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/paths/${view.pathId}/concepts/${view.slug}/answers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers }),
    }).catch(() => null);
    setBusy(false);
    const body = await res?.json().catch(() => null);
    if (!res?.ok) return setError(body?.error ?? "Couldn’t reach the server. Is it still running?");
    setGrade(body);
    onGraded(body.passed);
  }

  async function changeLevel(direction: "harder" | "easier") {
    setChanging(direction);
    setError(null);
    const res = await fetch(`/api/paths/${view.pathId}/concepts/${view.slug}/questions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ direction }),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    setChanging(null);
    if (!res?.ok) return setError(body?.error ?? "Couldn’t reach the server. Is it still running?");
    onLesson(body);
  }

  const look = { correct: "text-success", partly: "text-warn", incorrect: "text-danger" } as const;
  const word = { correct: "Correct", partly: "Almost", incorrect: "Not yet" } as const;

  return (
    <Section narrow tone="mist">
      <h2 className="text-3xl font-semibold">Check your understanding</h2>
      <p className="mt-3 text-ink-2">Answer in your own words. You’ll get feedback on each answer, and you can revise and try again as often as you like.</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
        <span className="text-ink-3">
          Difficulty {level} of {MAX_QUIZ_LEVEL}
        </span>
        <Button variant="plain" onClick={() => changeLevel("easier")} disabled={!!changing || busy || level <= MIN_QUIZ_LEVEL}>
          {changing === "easier" ? "Writing easier questions…" : "Make the questions easier"}
        </Button>
        <Button variant="plain" onClick={() => changeLevel("harder")} disabled={!!changing || busy || level >= MAX_QUIZ_LEVEL}>
          {changing === "harder" ? "Writing harder questions…" : "Make the questions harder"}
        </Button>
      </div>
      <div className="mt-8 space-y-6">
        {lesson.questions.map((q, i) => (
          <Card key={i}>
            <p className="text-sm text-ink-3">
              Question {i + 1} · {q.kind === "code" ? "write it" : q.kind === "apply" ? "use it" : "explain it"}
            </p>
            <p className="mt-1 text-lg font-medium">
              <InlineCode text={q.prompt} />
            </p>
            <textarea
              value={answers[i]}
              onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
              rows={q.kind === "code" ? 6 : 4}
              maxLength={MAX_ANSWER_CHARS}
              placeholder={q.kind === "code" ? "Write your command or code here" : "Your answer"}
              className={`mt-4 block w-full rounded-xl border border-line p-3 outline-none focus:border-accent ${q.kind === "code" ? "font-mono text-sm" : ""}`}
            />
            {grade?.results[i]?.reply_to_question && (
              <div className="mt-3 rounded-xl bg-accent/5 p-4">
                <p className="text-sm font-semibold text-accent">You asked</p>
                <Prose text={grade.results[i].reply_to_question} className="mt-1 text-[15px]" />
              </div>
            )}
            {grade?.results[i] && (
              <p className="mt-3 text-[15px]">
                <span className={`font-semibold ${look[grade.results[i].verdict]}`}>{word[grade.results[i].verdict]}.</span>{" "}
                <span className="text-ink-2">{grade.results[i].feedback}</span>
              </p>
            )}
          </Card>
        ))}
      </div>

      {grade && (
        <div className={`mt-8 rounded-2xl p-5 ${grade.passed ? "bg-success/10" : "bg-warn/10"}`}>
          <p className={`font-semibold ${grade.passed ? "text-success" : "text-warn"}`}>
            {grade.passed ? "You’ve got it. Concept mastered." : "Not quite there yet."}
          </p>
          <p className="mt-1 text-ink-2">{grade.summary}</p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button onClick={submit} disabled={busy || empty || !!changing}>
          {busy ? "Checking your answers…" : grade ? "Check again" : "Check my answers"}
        </Button>
        <MarkDone pathId={view.pathId} slug={view.slug} status={view.status} onChange={onStatus} />
        {understood && view.next && <ButtonLink href={`/paths/${view.pathId}/concepts/${view.next.slug}`} variant="secondary">Next: {view.next.name} ›</ButtonLink>}
        {understood && !view.next && view.nextModuleOrder && (
          <ButtonLink href={`/paths/${view.pathId}/modules/${view.nextModuleOrder}`} variant="secondary">On to module {view.nextModuleOrder} ›</ButtonLink>
        )}
        {error && <p className="w-full text-danger">{error}</p>}
      </div>
    </Section>
  );
}

function AskTutor({ view }: { view: ConceptView }) {
  const [messages, setMessages] = useState(view.chat);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);

  // Keep the newest message in view. Scrolls only the chat box, not the page.
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, busy]);

  async function ask() {
    const q = question.trim();
    if (!q) return;
    setBusy(true);
    setError(null);
    setMessages((m) => [...m, { role: "user", content: q }]);
    setQuestion("");
    const res = await fetch(`/api/paths/${view.pathId}/concepts/${view.slug}/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: q }),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      // Put the question back so it isn't lost.
      setMessages((m) => m.slice(0, -1));
      setQuestion(q);
      setError(body?.error ?? "Couldn’t reach the server. Is it still running?");
      return;
    }
    setMessages((m) => [...m, { role: "assistant", content: body.reply }]);
    input.current?.focus();
  }

  return (
    <Section narrow>
      <h2 className="text-3xl font-semibold">Anything you don’t understand?</h2>
      <p className="mt-3 text-ink-2">Ask me anything about “{view.name}”, in your own words. No question is too basic.</p>
      {messages.length > 0 && (
        <div ref={log} className="mt-8 max-h-[28rem] space-y-4 overflow-y-auto rounded-2xl border border-line p-4">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl bg-accent px-4 py-3 text-[15px] text-white">
                {m.content}
              </div>
            ) : (
              <div key={i} className="max-w-[95%] rounded-2xl bg-mist px-5 py-4">
                <Prose text={m.content} className="text-[16px]" />
              </div>
            ),
          )}
          {busy && <p className="text-ink-3">Thinking…</p>}
        </div>
      )}
      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <textarea
          ref={input}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter makes a new line.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask();
            }
          }}
          rows={2}
          maxLength={MAX_CHAT_CHARS}
          placeholder="e.g. What does “read-only” mean here?"
          className="block w-full rounded-xl border border-line p-3 outline-none focus:border-accent"
        />
        <div className="mt-3 flex items-center gap-4">
          <Button type="submit" disabled={busy || !question.trim()}>
            {busy ? "Thinking…" : "Ask"}
          </Button>
          <span className="text-sm text-ink-3">Enter to send · Shift+Enter for a new line</span>
        </div>
        {error && <p className="mt-3 text-danger">{error}</p>}
      </form>
    </Section>
  );
}

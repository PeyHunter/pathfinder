import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, conceptPrereqs, concepts, modules, paths, progress, quizAttempts } from "@/db/schema";
import { generateStructured, generateText, MODEL_FAST } from "./llm";
import { computeStatuses, nextUp, type Status } from "./progress";
import { loadPrompt } from "./prompts";
import { MAX_QUIZ_LEVEL, MIN_QUIZ_LEVEL } from "./limits";
import { ModuleLessons, QuizGrade, QuizQuestions } from "./schemas";

/** What the learner sees. Rubrics live in concepts.rubricJson and never leave the server. */
export type Lesson = {
  explanation: string;
  example: { description: string; code: string; language: string };
  questions: { prompt: string; kind: "explain" | "apply" | "code" }[];
  /** Difficulty of the questions, MIN_QUIZ_LEVEL-MAX_QUIZ_LEVEL. Missing on lessons written before levels existed. */
  level?: number;
  /** Set when the questions are replaced: attempts up to this id answered the old questions. */
  sinceAttemptId?: number;
};

// Lessons from before quiz levels had medium-ish questions, so "easier" still has somewhere to go.
const quizLevel = (lesson: Lesson) => lesson.level ?? 2;

// Older turns drop off so a long chat doesn't resend (and re-bill) its whole history on every message.
const CHAT_HISTORY = 20;

/** Status of every concept in a path, and the concept to continue with. */
function pathProgress(pathId: number) {
  const cons = db
    .select({ id: concepts.id, step: concepts.step, moduleId: concepts.moduleId, slug: concepts.slug, name: concepts.name })
    .from(concepts)
    .where(eq(concepts.pathId, pathId))
    .orderBy(concepts.step)
    .all();
  const ids = cons.map((c) => c.id);
  const edges = ids.length ? db.select().from(conceptPrereqs).where(inArray(conceptPrereqs.conceptId, ids)).all() : [];
  const stored = ids.length ? db.select().from(progress).where(inArray(progress.conceptId, ids)).all() : [];

  const nodes = cons.map((c) => ({
    id: c.id,
    step: c.step,
    prereqIds: edges.filter((e) => e.conceptId === c.id).map((e) => e.prereqId),
  }));
  const statuses = computeStatuses(nodes, new Map(stored.map((s) => [s.conceptId, { status: s.status, lastSeen: s.lastSeen }])));

  // Continue with the unfinished concept you looked at last; with nothing started, the recommended next one.
  const recent = stored
    .filter((s) => s.status !== "mastered" && s.lastSeen)
    .sort((a, b) => b.lastSeen!.getTime() - a.lastSeen!.getTime())[0];
  const continueId = recent?.conceptId ?? nextUp(nodes, statuses);
  return { cons, edges, statuses, continueId, started: stored.length > 0 };
}

export function getPathProgress(pathId: number) {
  const { cons, statuses, continueId, started } = pathProgress(pathId);
  const next = cons.find((c) => c.id === continueId);
  return {
    statuses: Object.fromEntries(cons.map((c) => [c.slug, statuses.get(c.id)!])) as Record<string, Status>,
    mastered: cons.filter((c) => statuses.get(c.id) === "mastered").length,
    total: cons.length,
    started,
    next: next ? { slug: next.slug, name: next.name } : null,
  };
}

export type PathProgress = ReturnType<typeof getPathProgress>;

function getModuleRow(pathId: number, order: number) {
  return db
    .select()
    .from(modules)
    .where(and(eq(modules.pathId, pathId), eq(modules.order, order)))
    .get();
}

export function getModuleView(pathId: number, order: number) {
  const path = db.select({ id: paths.id, title: paths.title }).from(paths).where(eq(paths.id, pathId)).get();
  const mod = getModuleRow(pathId, order);
  if (!path || !mod) return null;
  const moduleCount = db.select({ n: sql<number>`count(*)` }).from(modules).where(eq(modules.pathId, pathId)).get()!.n;
  const { statuses, continueId } = pathProgress(pathId);
  const rows = db.select().from(concepts).where(eq(concepts.moduleId, mod.id)).orderBy(concepts.step).all();
  return {
    pathId,
    pathTitle: path.title,
    order,
    moduleCount,
    title: mod.title,
    whyItMatters: mod.whyItMatters,
    contentStatus: mod.contentStatus,
    contentError: mod.contentError,
    concepts: rows.map((c) => ({
      slug: c.slug,
      name: c.name,
      summary: c.summary,
      step: c.step,
      addedBySystem: c.addedBySystem,
      status: statuses.get(c.id)!,
      isNext: c.id === continueId,
    })),
  };
}

export type ModuleView = NonNullable<ReturnType<typeof getModuleView>>;

/**
 * Claims a module for lesson generation. Returns its id only if this caller should run it, so a refresh
 * or a second tab can't pay for the same lessons twice.
 */
export function claimModuleContent(pathId: number, order: number): number | null {
  const mod = getModuleRow(pathId, order);
  if (!mod) throw new Error("Module not found");
  const claimed = db
    .update(modules)
    .set({ contentStatus: "generating", contentError: null })
    .where(and(eq(modules.id, mod.id), inArray(modules.contentStatus, ["none", "failed"])))
    .run();
  return claimed.changes === 1 ? mod.id : null;
}

export async function runModuleContent(moduleId: number) {
  try {
    const mod = db.select().from(modules).where(eq(modules.id, moduleId)).get()!;
    const path = db.select().from(paths).where(eq(paths.id, mod.pathId)).get()!;
    const orderOf = new Map(
      db.select({ id: modules.id, order: modules.order }).from(modules).where(eq(modules.pathId, path.id)).all().map((m) => [m.id, m.order]),
    );
    const all = db.select().from(concepts).where(eq(concepts.pathId, path.id)).orderBy(concepts.step).all();
    const nameOf = new Map(all.map((c) => [c.id, c.name]));
    const inModule = all.filter((c) => c.moduleId === moduleId);
    const covered = all.filter((c) => orderOf.get(c.moduleId)! < mod.order);
    const edges = db
      .select()
      .from(conceptPrereqs)
      .where(inArray(conceptPrereqs.conceptId, inModule.map((c) => c.id)))
      .all();
    const slugs = inModule.map((c) => c.slug);

    const { value } = await generateStructured({
      prompt: loadPrompt("module-lessons", {
        path: path.title,
        level: path.learnerLevel,
        module: `${mod.title}: ${mod.whyItMatters}`,
        covered: covered.map((c) => `- ${c.name}`).join("\n") || "(none yet, this is the first module)",
        concepts: inModule
          .map((c) => {
            const pre = edges.filter((e) => e.conceptId === c.id).map((e) => nameOf.get(e.prereqId));
            return `- ${c.slug}: ${c.name} - ${c.summary}; prerequisites: ${pre.join(", ") || "none"}`;
          })
          .join("\n"),
      }),
      schema: ModuleLessons,
      effort: "medium",
      check: (v) => {
        const got = v.lessons.map((l) => l.slug);
        const errors = [
          ...slugs.filter((s) => !got.includes(s)).map((s) => `Missing a lesson for slug "${s}".`),
          ...got.filter((g) => !slugs.includes(g)).map((g) => `Unknown slug "${g}"; use only the slugs given.`),
          ...(new Set(got).size !== got.length ? ["Each slug must have exactly one lesson."] : []),
          ...v.lessons
            .filter((l) => l.questions.length < 2 || l.questions.length > 3)
            .map((l) => `Lesson "${l.slug}" has ${l.questions.length} questions; it needs 2-3.`),
        ];
        return errors.length ? { ok: false, errors } : { ok: true, result: null };
      },
    });

    db.transaction((tx) => {
      for (const l of value.lessons) {
        const lesson: Lesson = {
          explanation: l.explanation,
          example: l.example,
          questions: l.questions.map(({ prompt, kind }) => ({ prompt, kind })),
          level: MIN_QUIZ_LEVEL,
        };
        tx.update(concepts)
          .set({ contentJson: JSON.stringify(lesson), rubricJson: JSON.stringify(l.questions.map((q) => q.rubric)) })
          .where(and(eq(concepts.moduleId, moduleId), eq(concepts.slug, l.slug)))
          .run();
      }
      tx.update(modules).set({ contentStatus: "ready", contentError: null }).where(eq(modules.id, moduleId)).run();
    });
  } catch (e) {
    console.error(`[module ${moduleId}]`, e);
    db.update(modules)
      .set({ contentStatus: "failed", contentError: e instanceof Error ? e.message : String(e) })
      .where(eq(modules.id, moduleId))
      .run();
  }
}

function getConceptRow(pathId: number, slug: string) {
  return db
    .select()
    .from(concepts)
    .where(and(eq(concepts.pathId, pathId), eq(concepts.slug, slug)))
    .get();
}

/** Loads a concept page. Opening a concept with a lesson counts as starting it. */
export function openConcept(pathId: number, slug: string) {
  const c = getConceptRow(pathId, slug);
  if (!c) return null;
  const path = db.select({ title: paths.title }).from(paths).where(eq(paths.id, pathId)).get()!;
  const mod = db.select().from(modules).where(eq(modules.id, c.moduleId)).get()!;

  if (c.contentJson) {
    const now = new Date();
    db.insert(progress)
      .values({ conceptId: c.id, status: "in_progress", lastSeen: now })
      .onConflictDoUpdate({ target: progress.conceptId, set: { lastSeen: now } })
      .run();
    db.update(paths).set({ lastStudiedAt: now }).where(eq(paths.id, pathId)).run();
  }

  const { cons, edges, statuses } = pathProgress(pathId);
  const siblings = cons.filter((x) => x.moduleId === c.moduleId);
  const i = siblings.findIndex((x) => x.id === c.id);
  const link = (x?: { slug: string; name: string }) => (x ? { slug: x.slug, name: x.name } : null);
  const lesson = c.contentJson ? (JSON.parse(c.contentJson) as Lesson) : null;
  const last = db.select().from(quizAttempts).where(eq(quizAttempts.conceptId, c.id)).orderBy(desc(quizAttempts.id)).get();
  // Answers to questions that have since been replaced don't belong in the new answer boxes.
  const lastIsCurrent = last && last.id > (lesson?.sinceAttemptId ?? 0);
  const stored = db.select().from(progress).where(eq(progress.conceptId, c.id)).get();
  const hasNextModule = !!getModuleRow(pathId, mod.order + 1);

  return {
    pathId,
    pathTitle: path.title,
    module: { order: mod.order, title: mod.title },
    nextModuleOrder: hasNextModule ? mod.order + 1 : null,
    slug: c.slug,
    name: c.name,
    summary: c.summary,
    status: statuses.get(c.id)!,
    lesson,
    prerequisites: edges
      .filter((e) => e.conceptId === c.id)
      .map((e) => cons.find((x) => x.id === e.prereqId)!)
      .map((p) => ({ slug: p.slug, name: p.name, status: statuses.get(p.id)! })),
    prev: link(siblings[i - 1]),
    next: link(siblings[i + 1]),
    attempts: stored?.attempts ?? 0,
    chat: db
      .select({ role: chatMessages.role, content: chatMessages.content })
      .from(chatMessages)
      .where(eq(chatMessages.conceptId, c.id))
      .orderBy(chatMessages.id)
      .all(),
    lastAttempt: lastIsCurrent
      ? { answers: JSON.parse(last.answersJson) as string[], grade: JSON.parse(last.openResultsJson!) as QuizGrade, passed: last.passed }
      : null,
  };
}

export type ConceptView = NonNullable<ReturnType<typeof openConcept>>;

/**
 * "I understand this": marks a concept mastered without the quiz. Undoing keeps it in progress if you'd
 * already tried the quiz, and otherwise forgets it, so it reads as not started again.
 */
export function markConceptDone(pathId: number, slug: string, done: boolean) {
  const c = getConceptRow(pathId, slug);
  if (!c) return null;
  const now = new Date();
  if (done) {
    db.insert(progress)
      .values({ conceptId: c.id, status: "mastered", lastSeen: now })
      .onConflictDoUpdate({ target: progress.conceptId, set: { status: "mastered", lastSeen: now } })
      .run();
  } else {
    const stored = db.select().from(progress).where(eq(progress.conceptId, c.id)).get();
    if (stored?.attempts) db.update(progress).set({ status: "in_progress", lastSeen: now }).where(eq(progress.conceptId, c.id)).run();
    else db.delete(progress).where(eq(progress.conceptId, c.id)).run();
  }
  db.update(paths).set({ lastStudiedAt: now }).where(eq(paths.id, pathId)).run();
  return pathProgress(pathId).statuses.get(c.id)!;
}

export async function gradeAnswers(pathId: number, slug: string, answers: string[]) {
  const c = getConceptRow(pathId, slug);
  if (!c?.contentJson || !c.rubricJson) throw new Error("This concept has no lesson yet.");
  const lesson = JSON.parse(c.contentJson) as Lesson;
  const rubric = JSON.parse(c.rubricJson) as string[];
  if (answers.length !== lesson.questions.length) throw new Error(`Expected ${lesson.questions.length} answers.`);

  const { value } = await generateStructured({
    prompt: loadPrompt("grade-answers", {
      concept: `${c.name}: ${c.summary}`,
      lesson: lesson.explanation,
      answers: lesson.questions
        .map((q, i) => `Question ${i + 1} (${q.kind}): ${q.prompt}\nRubric: ${rubric[i]}\nLearner's answer:\n${answers[i]}`)
        .join("\n\n"),
    }),
    schema: QuizGrade,
    model: MODEL_FAST,
    effort: "medium",
    check: (v) =>
      v.results.length === answers.length
        ? { ok: true, result: null }
        : { ok: false, errors: [`Return exactly ${answers.length} results, one per answer, in order.`] },
  });

  const score = value.results.filter((r) => r.verdict === "correct").length / value.results.length;
  db.transaction((tx) => {
    tx.insert(quizAttempts)
      .values({ conceptId: c.id, answersJson: JSON.stringify(answers), openResultsJson: JSON.stringify(value), passed: value.passed })
      .run();
    const prev = tx.select({ status: progress.status }).from(progress).where(eq(progress.conceptId, c.id)).get();
    // Missing after you'd mastered it flags the concept for review rather than wiping out the mastery.
    const status = value.passed ? "mastered" : prev && prev.status !== "in_progress" ? "needs_review" : "in_progress";
    tx.insert(progress)
      .values({ conceptId: c.id, status, score, attempts: 1, lastSeen: new Date() })
      .onConflictDoUpdate({
        target: progress.conceptId,
        set: { status, score, attempts: sql`${progress.attempts} + 1`, lastSeen: new Date() },
      })
      .run();
  });
  return value;
}

/** Answers a learner's question about one concept, with its lesson and quiz as context. */
export async function askTutor(pathId: number, slug: string, question: string) {
  const c = getConceptRow(pathId, slug);
  if (!c?.contentJson) throw new Error("This concept has no lesson yet.");
  const lesson = JSON.parse(c.contentJson) as Lesson;
  const path = db.select({ level: paths.learnerLevel }).from(paths).where(eq(paths.id, pathId)).get()!;
  const history = db
    .select({ role: chatMessages.role, content: chatMessages.content })
    .from(chatMessages)
    .where(eq(chatMessages.conceptId, c.id))
    .orderBy(desc(chatMessages.id))
    .limit(CHAT_HISTORY)
    .all()
    .reverse();
  // The API expects the conversation to open with the learner, so drop a leading tutor turn left by the cut-off.
  while (history[0]?.role === "assistant") history.shift();

  const reply = await generateText({
    system: loadPrompt("tutor", {
      level: path.level,
      concept: `${c.name}: ${c.summary}`,
      lesson: `${lesson.explanation}\n\nExample:\n${lesson.example.description}\n${lesson.example.code}`,
      quiz: lesson.questions.map((q, i) => `${i + 1}. ${q.prompt}`).join("\n"),
    }),
    messages: [...history, { role: "user", content: question }],
    model: MODEL_FAST,
    effort: "low",
  });

  // Saved only once there's a reply, so a failed request never leaves an unanswered question in the history.
  db.insert(chatMessages)
    .values([
      { conceptId: c.id, role: "user", content: question },
      { conceptId: c.id, role: "assistant", content: reply },
    ])
    .run();
  return reply;
}

/**
 * Replaces a concept's quiz with new questions one level harder or easier. Progress is left alone, so a
 * mastered concept stays mastered and the new quiz is extra practice.
 */
export async function changeQuizLevel(pathId: number, slug: string, direction: "harder" | "easier") {
  const c = getConceptRow(pathId, slug);
  if (!c?.contentJson) throw new Error("This concept has no lesson yet.");
  const lesson = JSON.parse(c.contentJson) as Lesson;
  const current = quizLevel(lesson);
  const level = current + (direction === "harder" ? 1 : -1);
  if (level < MIN_QUIZ_LEVEL || level > MAX_QUIZ_LEVEL) throw new Error(`The questions are already as ${direction === "harder" ? "hard" : "easy"} as they go.`);
  const path = db.select({ level: paths.learnerLevel }).from(paths).where(eq(paths.id, pathId)).get()!;

  const { value } = await generateStructured({
    prompt: loadPrompt("quiz-questions", {
      direction: direction === "harder" ? "a little harder" : "a little easier",
      level: String(level),
      current_level: String(current),
      level_note: path.level,
      concept: `${c.name}: ${c.summary}`,
      lesson: `${lesson.explanation}\n\nExample:\n${lesson.example.description}\n${lesson.example.code}`,
      current: lesson.questions.map((q, i) => `${i + 1}. ${q.prompt}`).join("\n"),
    }),
    schema: QuizQuestions,
    model: MODEL_FAST,
    effort: "low",
    check: (v) =>
      v.questions.length >= 2 && v.questions.length <= 3
        ? { ok: true, result: null }
        : { ok: false, errors: [`Return 2-3 questions, not ${v.questions.length}.`] },
  });

  const last = db.select({ id: quizAttempts.id }).from(quizAttempts).where(eq(quizAttempts.conceptId, c.id)).orderBy(desc(quizAttempts.id)).get();
  const next: Lesson = {
    ...lesson,
    questions: value.questions.map(({ prompt, kind }) => ({ prompt, kind })),
    level,
    sinceAttemptId: last?.id ?? 0,
  };
  db.update(concepts)
    .set({ contentJson: JSON.stringify(next), rubricJson: JSON.stringify(value.questions.map((q) => q.rubric)) })
    .where(eq(concepts.id, c.id))
    .run();
  return next;
}

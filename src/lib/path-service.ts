import { eq } from "drizzle-orm";
import { db } from "@/db";
import { conceptPrereqs, concepts, modules, paths } from "@/db/schema";
import { validateGraph } from "./graph";
import { generateStructured } from "./llm";
import { loadPrompt } from "./prompts";
import { NormalizeResult, PathGraph, type Resolution } from "./schemas";

export function createPath(raw: string, level: string) {
  const [row] = db
    .insert(paths)
    .values({ title: "New path", rawInput: raw, learnerLevel: level, status: "normalizing" })
    .returning({ id: paths.id })
    .all();
  return row.id;
}

export async function runNormalize(pathId: number) {
  const path = getPathRow(pathId);
  try {
    const { value } = await generateStructured({
      prompt: loadPrompt("normalize", { raw: path.rawInput, level: path.learnerLevel }),
      schema: NormalizeResult,
      effort: "medium",
      check: (v) => {
        const bad = v.ambiguous.filter((a) => a.interpretations.length < 2 || a.likely >= a.interpretations.length);
        return bad.length
          ? { ok: false, errors: bad.map((a) => `Ambiguous item "${a.id}" needs 2+ interpretations and a valid "likely" index.`) }
          : { ok: true, result: null };
      },
    });
    db.update(paths)
      .set({ status: "awaiting_confirmation", normalizedJson: JSON.stringify(value) })
      .where(eq(paths.id, pathId))
      .run();
  } catch (e) {
    fail(pathId, e);
  }
}

/** Turns the normalized list plus the learner's answers into the final list of concept names. */
export function confirmedNames(normalized: NormalizeResult, resolutions: Resolution[]): string[] {
  const names = normalized.concepts.map((c) => c.name);
  for (const item of normalized.ambiguous) {
    const r = resolutions.find((x) => x.id === item.id)?.choice ?? { kind: "pick", index: item.likely };
    if (r.kind === "pick") names.push(item.interpretations[r.index]?.name ?? item.interpretations[item.likely].name);
    if (r.kind === "custom") names.push(r.text.trim());
  }
  return [...new Set(names)];
}

export function startBuild(pathId: number, resolutions: Resolution[]) {
  const path = getPathRow(pathId);
  if (path.status !== "awaiting_confirmation") throw new Error(`Path is ${path.status}, not awaiting confirmation`);
  db.update(paths)
    .set({ status: "generating", resolutionsJson: JSON.stringify(resolutions) })
    .where(eq(paths.id, pathId))
    .run();
}

export async function runBuild(pathId: number) {
  const path = getPathRow(pathId);
  try {
    const names = confirmedNames(
      NormalizeResult.parse(JSON.parse(path.normalizedJson!)),
      JSON.parse(path.resolutionsJson ?? "[]"),
    );
    const { value: graph, result: order } = await generateStructured({
      prompt: loadPrompt("build-path", { level: path.learnerLevel, confirmed: names.map((n) => `- ${n}`).join("\n") }),
      schema: PathGraph,
      effort: "high",
      check: (g) => {
        const r = validateGraph(g, names);
        return r.ok ? { ok: true, result: r.order } : r;
      },
    });
    savePath(pathId, graph, order);
  } catch (e) {
    fail(pathId, e);
  }
}

function savePath(pathId: number, graph: PathGraph, order: string[]) {
  db.transaction((tx) => {
    tx.delete(modules).where(eq(modules.pathId, pathId)).run(); // cascades to concepts, so a rebuild is clean

    const moduleIds = new Map<string, number>();
    graph.modules.forEach((m, i) => {
      const [row] = tx
        .insert(modules)
        .values({ pathId, order: i + 1, title: m.title, whyItMatters: m.why_it_matters })
        .returning({ id: modules.id })
        .all();
      moduleIds.set(m.key, row.id);
    });

    const conceptIds = new Map<string, number>();
    for (const c of graph.concepts) {
      const [row] = tx
        .insert(concepts)
        .values({
          pathId,
          moduleId: moduleIds.get(c.module)!,
          slug: c.slug,
          name: c.name,
          summary: c.summary,
          step: order.indexOf(c.slug) + 1,
          addedBySystem: c.added_by_system,
        })
        .returning({ id: concepts.id })
        .all();
      conceptIds.set(c.slug, row.id);
    }

    for (const c of graph.concepts) {
      for (const p of new Set(c.prerequisites)) {
        tx.insert(conceptPrereqs).values({ conceptId: conceptIds.get(c.slug)!, prereqId: conceptIds.get(p)! }).run();
      }
    }

    tx.update(paths).set({ status: "ready", title: graph.title, error: null }).where(eq(paths.id, pathId)).run();
  });
}

function fail(pathId: number, e: unknown) {
  console.error(`[path ${pathId}]`, e);
  db.update(paths)
    .set({ status: "failed", error: e instanceof Error ? e.message : String(e) })
    .where(eq(paths.id, pathId))
    .run();
}

function getPathRow(pathId: number) {
  const row = db.select().from(paths).where(eq(paths.id, pathId)).get();
  if (!row) throw new Error(`Path ${pathId} not found`);
  return row;
}

/** The stored path as one JSON document: modules in order, concepts in roadmap order with prerequisite slugs. */
export function getPathGraph(pathId: number) {
  const path = db.select().from(paths).where(eq(paths.id, pathId)).get();
  if (!path) return null;
  const mods = db.select().from(modules).where(eq(modules.pathId, pathId)).orderBy(modules.order).all();
  const cons = db.select().from(concepts).where(eq(concepts.pathId, pathId)).orderBy(concepts.step).all();
  const edges = db
    .select({ conceptId: conceptPrereqs.conceptId, prereqId: conceptPrereqs.prereqId })
    .from(conceptPrereqs)
    .innerJoin(concepts, eq(concepts.id, conceptPrereqs.conceptId))
    .where(eq(concepts.pathId, pathId))
    .all();
  const slugOf = new Map(cons.map((c) => [c.id, c.slug]));

  return {
    id: path.id,
    title: path.title,
    status: path.status,
    error: path.error,
    learnerLevel: path.learnerLevel,
    normalized: path.normalizedJson ? (JSON.parse(path.normalizedJson) as NormalizeResult) : null,
    modules: mods.map((m) => ({
      order: m.order,
      title: m.title,
      whyItMatters: m.whyItMatters,
      concepts: cons
        .filter((c) => c.moduleId === m.id)
        .map((c) => ({
          step: c.step,
          slug: c.slug,
          name: c.name,
          summary: c.summary,
          addedBySystem: c.addedBySystem,
          prerequisites: edges.filter((e) => e.conceptId === c.id).map((e) => slugOf.get(e.prereqId)!),
        })),
    })),
  };
}

export type PathView = NonNullable<ReturnType<typeof getPathGraph>>;

export function listPaths() {
  return db.select({ id: paths.id, title: paths.title, status: paths.status, createdAt: paths.createdAt }).from(paths).orderBy(paths.createdAt).all();
}

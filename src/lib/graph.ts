import { MAX_CONCEPTS_PER_MODULE } from "./limits";
import type { PathGraph } from "./schemas";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Kahn's algorithm. Returns concept slugs in dependency order, or the slugs
 * stuck in a cycle. Ties are broken by module order, then by the order the
 * model listed them, so the roadmap reads fundamentals-first.
 */
export function topoSort(
  nodes: { slug: string; prerequisites: string[]; rank: number }[],
): { order: string[] } | { cycle: string[] } {
  const indegree = new Map(nodes.map((n) => [n.slug, 0]));
  const dependents = new Map<string, string[]>(nodes.map((n) => [n.slug, []]));
  const rank = new Map(nodes.map((n) => [n.slug, n.rank]));
  for (const n of nodes) {
    for (const p of new Set(n.prerequisites)) {
      if (!indegree.has(p)) continue; // unknown prereqs are reported separately
      indegree.set(n.slug, indegree.get(n.slug)! + 1);
      dependents.get(p)!.push(n.slug);
    }
  }

  const ready = nodes.filter((n) => indegree.get(n.slug) === 0).map((n) => n.slug);
  const order: string[] = [];
  while (ready.length) {
    ready.sort((a, b) => rank.get(a)! - rank.get(b)!);
    const next = ready.shift()!;
    order.push(next);
    for (const d of dependents.get(next)!) {
      indegree.set(d, indegree.get(d)! - 1);
      if (indegree.get(d) === 0) ready.push(d);
    }
  }

  if (order.length === nodes.length) return { order };
  return { cycle: nodes.map((n) => n.slug).filter((s) => !order.includes(s)) };
}

/**
 * Checks everything the JSON schema can't express. Each error is written so it
 * can be sent straight back to the model as a repair instruction.
 */
export function validateGraph(
  graph: PathGraph,
  confirmedNames: string[],
): { ok: true; order: string[] } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  const moduleIndex = new Map<string, number>();
  graph.modules.forEach((m, i) => {
    if (moduleIndex.has(m.key)) errors.push(`Module key "${m.key}" is used twice.`);
    moduleIndex.set(m.key, i);
  });

  const bySlug = new Map<string, PathGraph["concepts"][number]>();
  for (const c of graph.concepts) {
    if (!SLUG.test(c.slug)) errors.push(`Slug "${c.slug}" is not kebab-case.`);
    if (bySlug.has(c.slug)) errors.push(`Slug "${c.slug}" is used by more than one concept.`);
    bySlug.set(c.slug, c);
    if (!moduleIndex.has(c.module))
      errors.push(`Concept "${c.slug}" is in module "${c.module}", which does not exist.`);
  }

  for (const c of graph.concepts) {
    for (const p of c.prerequisites) {
      const prereq = bySlug.get(p);
      if (p === c.slug) errors.push(`Concept "${c.slug}" lists itself as a prerequisite.`);
      else if (!prereq) errors.push(`Concept "${c.slug}" has prerequisite "${p}", which does not exist.`);
      else if ((moduleIndex.get(prereq.module) ?? 0) > (moduleIndex.get(c.module) ?? 0))
        errors.push(
          `Concept "${c.slug}" (module "${c.module}") depends on "${p}", which is in the later module "${prereq.module}". Move one of them so prerequisites are never in a later module.`,
        );
    }
  }

  const covered = new Set(graph.concepts.flatMap((c) => c.covers.map(norm)));
  for (const name of confirmedNames) {
    if (!covered.has(norm(name)))
      errors.push(`Confirmed concept "${name}" is not covered by any concept. Add it to some concept's "covers".`);
  }

  for (const m of graph.modules) {
    const n = graph.concepts.filter((c) => c.module === m.key).length;
    if (n === 0) errors.push(`Module "${m.key}" has no concepts.`);
    if (n > MAX_CONCEPTS_PER_MODULE)
      errors.push(
        `Module "${m.key}" has ${n} concepts; the maximum is ${MAX_CONCEPTS_PER_MODULE}. Split it into two modules or move concepts to a neighbouring module.`,
      );
  }

  const sorted = topoSort(
    graph.concepts.map((c, i) => ({
      slug: c.slug,
      prerequisites: c.prerequisites,
      rank: (moduleIndex.get(c.module) ?? 0) * 10_000 + i,
    })),
  );
  if ("cycle" in sorted)
    errors.push(
      `The prerequisites contain a cycle among: ${sorted.cycle.join(", ")}. Remove the edge that is least essential.`,
    );

  if (errors.length) return { ok: false, errors };
  return { ok: true, order: (sorted as { order: string[] }).order };
}

const norm = (s: string) => s.trim().toLowerCase();

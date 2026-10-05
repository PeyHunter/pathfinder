import { describe, expect, it } from "vitest";
import { topoSort, validateGraph } from "./graph";
import type { PathGraph } from "./schemas";

const concept = (
  slug: string,
  module: string,
  prerequisites: string[] = [],
  covers: string[] = [],
): PathGraph["concepts"][number] => ({
  slug,
  name: slug,
  summary: "",
  module,
  added_by_system: covers.length === 0,
  covers,
  prerequisites,
});

const graph = (concepts: PathGraph["concepts"]): PathGraph => ({
  title: "t",
  modules: [
    { key: "basics", title: "Basics", why_it_matters: "" },
    { key: "advanced", title: "Advanced", why_it_matters: "" },
  ],
  concepts,
});

describe("topoSort", () => {
  it("orders prerequisites first", () => {
    const r = topoSort([
      { slug: "c", prerequisites: ["b"], rank: 0 },
      { slug: "b", prerequisites: ["a"], rank: 1 },
      { slug: "a", prerequisites: [], rank: 2 },
    ]);
    expect(r).toEqual({ order: ["a", "b", "c"] });
  });

  it("reports the nodes in a cycle", () => {
    const r = topoSort([
      { slug: "a", prerequisites: [], rank: 0 },
      { slug: "b", prerequisites: ["c"], rank: 1 },
      { slug: "c", prerequisites: ["b"], rank: 2 },
    ]);
    expect(r).toEqual({ cycle: ["b", "c"] });
  });
});

describe("validateGraph", () => {
  it("accepts a valid graph and keeps modules together in the order", () => {
    const r = validateGraph(
      graph([
        concept("pod", "advanced", ["container"], ["Pod"]),
        concept("server", "basics"),
        concept("container", "basics", ["server"]),
        concept("terminal", "basics"),
      ]),
      ["Pod"],
    );
    expect(r).toEqual({ ok: true, order: ["server", "container", "terminal", "pod"] });
  });

  it("rejects cycles, unknown prereqs, later-module prereqs and uncovered concepts", () => {
    const r = validateGraph(
      graph([
        concept("a", "basics", ["b"]),
        concept("b", "basics", ["a"]),
        concept("c", "basics", ["ghost", "d"]),
        concept("d", "advanced"),
      ]),
      ["Helm charts"],
    );
    expect(r.ok).toBe(false);
    const errors = (r as { errors: string[] }).errors.join("\n");
    expect(errors).toMatch(/cycle among: a, b/);
    expect(errors).toMatch(/"ghost", which does not exist/);
    expect(errors).toMatch(/later module "advanced"/);
    expect(errors).toMatch(/"Helm charts" is not covered/);
  });
});

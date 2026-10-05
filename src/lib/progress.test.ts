import { describe, expect, it } from "vitest";
import { computeStatuses, nextUp, type StoredStatus } from "./progress";

// server(1) -> container(2) -> pod(3); terminal(4) has no prereqs
const nodes = [
  { id: 1, step: 1, prereqIds: [] },
  { id: 2, step: 2, prereqIds: [1] },
  { id: 3, step: 3, prereqIds: [2] },
  { id: 4, step: 4, prereqIds: [] },
];
const stored = (entries: [number, StoredStatus][]) =>
  new Map(entries.map(([id, status]) => [id, { status, lastSeen: null }]));

describe("computeStatuses", () => {
  it("starts with only prerequisite-free concepts available", () => {
    const s = computeStatuses(nodes, stored([]));
    expect([...s.values()]).toEqual(["available", "locked", "locked", "available"]);
  });

  it("in progress does not unlock dependents; mastered does", () => {
    expect(computeStatuses(nodes, stored([[1, "in_progress"]])).get(2)).toBe("locked");
    expect(computeStatuses(nodes, stored([[1, "mastered"]])).get(2)).toBe("available");
  });

  it("needs review keeps dependents unlocked", () => {
    const s = computeStatuses(nodes, stored([[1, "needs_review"], [2, "mastered"]]));
    expect(s.get(1)).toBe("needs_review");
    expect(s.get(3)).toBe("available");
  });
});

describe("nextUp", () => {
  it("prefers review, then in progress, then the earliest available step", () => {
    const pick = (entries: [number, StoredStatus][]) => nextUp(nodes, computeStatuses(nodes, stored(entries)));
    expect(pick([])).toBe(1);
    expect(pick([[1, "mastered"], [4, "in_progress"]])).toBe(4);
    expect(pick([[1, "needs_review"], [2, "mastered"], [4, "in_progress"]])).toBe(1);
  });

  it("returns null when everything is mastered", () => {
    const all = stored([[1, "mastered"], [2, "mastered"], [3, "mastered"], [4, "mastered"]]);
    expect(nextUp(nodes, computeStatuses(nodes, all))).toBeNull();
  });
});

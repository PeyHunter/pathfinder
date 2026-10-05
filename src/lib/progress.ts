export type Status = "locked" | "available" | "in_progress" | "mastered" | "needs_review";

export type StoredStatus = "in_progress" | "mastered" | "needs_review";

type Node = { id: number; step: number; prereqIds: number[] };
type Stored = { status: StoredStatus; lastSeen: Date | null };

/**
 * Locked/available are never stored; they follow from the prerequisites.
 * A concept flagged "needs review" still counts as learned for unlocking:
 * you mastered it once, and re-locking later steps would undo your progress.
 */
export function computeStatuses(nodes: Node[], stored: Map<number, Stored>): Map<number, Status> {
  const learned = (id: number) => {
    const s = stored.get(id)?.status;
    return s === "mastered" || s === "needs_review";
  };
  return new Map(
    nodes.map((n) => {
      const s = stored.get(n.id)?.status;
      if (s) return [n.id, s];
      return [n.id, n.prereqIds.every(learned) ? "available" : "locked"];
    }),
  );
}

/** Review comes first, then what you already started, then the earliest new step. */
export function nextUp(nodes: Node[], statuses: Map<number, Status>): number | null {
  const byStep = [...nodes].sort((a, b) => a.step - b.step);
  for (const want of ["needs_review", "in_progress", "available"] as const) {
    const hit = byStep.find((n) => statuses.get(n.id) === want);
    if (hit) return hit.id;
  }
  return null;
}

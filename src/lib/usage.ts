import { gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { apiUsage } from "@/db/schema";
import { type Attempt, costOf } from "./pricing";

export function recordUsage(attempts: Attempt[]) {
  if (attempts.length === 0) return;
  db.insert(apiUsage)
    .values(
      attempts.map((a) => ({
        model: a.model,
        inputTokens: a.input_tokens,
        outputTokens: a.output_tokens,
        cacheWriteTokens: a.cache_creation_input_tokens ?? 0,
        cacheReadTokens: a.cache_read_input_tokens ?? 0,
        costUsd: costOf(a),
      })),
    )
    .run();
}

export function usageSummary(now = new Date()) {
  const totals = (where?: ReturnType<typeof gte>) =>
    db
      .select({
        cost: sql<number>`coalesce(sum(${apiUsage.costUsd}), 0)`,
        tokens: sql<number>`coalesce(sum(${apiUsage.inputTokens} + ${apiUsage.outputTokens} + ${apiUsage.cacheWriteTokens} + ${apiUsage.cacheReadTokens}), 0)`,
      })
      .from(apiUsage)
      .where(where)
      .get()!;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return { month: totals(gte(apiUsage.createdAt, monthStart)), allTime: totals() };
}

/** Total tracked spend allowed before Pathfinder stops calling the API. Defaults to the $25 prepaid credit. */
export function spendLimitUsd(): number {
  const n = Number(process.env.SPEND_LIMIT_USD);
  return Number.isFinite(n) && n > 0 ? n : 25;
}

export function assertUnderSpendLimit() {
  const spent = usageSummary().allTime.cost;
  const limit = spendLimitUsd();
  if (spent >= limit)
    throw new Error(
      `Spend limit reached: $${spent.toFixed(2)} of $${limit} used. Raise SPEND_LIMIT_USD in .env.local to continue.`,
    );
}

import { connection } from "next/server";
import { spendLevel } from "@/lib/pricing";
import { spendLimitUsd, usageSummary } from "@/lib/usage";

const COLOR = { low: "text-success", medium: "text-warn", high: "text-danger" } as const;

const usd = (n: number) => `$${n < 10 ? n.toFixed(2) : n.toFixed(0)}`;
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export async function UsageFooter() {
  // better-sqlite3 is synchronous, so without this the query would run once at build time and freeze.
  await connection();
  const { month, allTime } = usageSummary();
  const limit = spendLimitUsd();
  // At the cap, new paths are refused, so show red whatever this month's spend is.
  const level = allTime.cost >= limit ? "high" : spendLevel(month.cost);
  return (
    <p className={COLOR[level]} title="Estimated from token counts; your Anthropic Console has the exact bill.">
      API: {usd(month.cost)} this month · {usd(allTime.cost)} of ${limit} used · {compact.format(allTime.tokens)} tokens
    </p>
  );
}

// USD per million tokens, Anthropic first-party rates (checked 2026-10-05).
// Cache writes are a multiple of the input rate: 1.25x for 5-minute entries, 2x for 1-hour.
type Price = { input: number; output: number; cacheRead: number };
const PRICES: Record<string, Price> = {
  "claude-fable-5-1": { input: 10, output: 50, cacheRead: 0.25 },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-opus-4-8": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheRead: 0.1 },
};
// An unknown model is priced at the top rate so the footer overstates rather than understates spend.
const FALLBACK_PRICE = PRICES["claude-fable-5-1"];

export type Attempt = {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation?: { ephemeral_5m_input_tokens: number; ephemeral_1h_input_tokens: number } | null;
};

function priceFor(model: string): Price {
  // Longest matching prefix, so "claude-opus-5-5" wins over "claude-opus-5" and dated ids still match.
  const key = Object.keys(PRICES)
    .filter((k) => model.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  if (!key) console.warn(`[usage] no price for ${model}; using the highest rate`);
  return key ? PRICES[key] : FALLBACK_PRICE;
}

export function costOf(a: Attempt): number {
  const p = priceFor(a.model);
  const write1h = a.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  const write5m = (a.cache_creation_input_tokens ?? 0) - write1h;
  const dollars =
    a.input_tokens * p.input +
    a.output_tokens * p.output +
    (a.cache_read_input_tokens ?? 0) * p.cacheRead +
    write5m * p.input * 1.25 +
    write1h * p.input * 2;
  return dollars / 1_000_000;
}

export type SpendLevel = "low" | "medium" | "high";

/** Colour band for this month's spend: under $5 is fine, $20 and up is worth a look in the Console. */
export function spendLevel(monthUsd: number): SpendLevel {
  if (monthUsd < 5) return "low";
  if (monthUsd < 20) return "medium";
  return "high";
}

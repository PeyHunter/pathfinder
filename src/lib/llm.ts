import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import type { Attempt } from "./pricing";
import { assertUnderSpendLimit, recordUsage } from "./usage";

const client = new Anthropic();

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";
export const MODEL_FAST = process.env.ANTHROPIC_MODEL_FAST ?? MODEL;

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

/**
 * Asks for JSON matching `schema`, then runs `check` for rules a schema can't
 * express (e.g. "no cycles"). On failure, the errors go back to the model as a
 * follow-up turn so it repairs its own answer instead of starting over.
 */
export async function generateStructured<S extends z.ZodType, R>(opts: {
  prompt: string;
  schema: S;
  check: (value: z.infer<S>) => { ok: true; result: R } | { ok: false; errors: string[] };
  effort?: Effort;
  maxRepairs?: number;
}): Promise<{ value: z.infer<S>; result: R; repairs: number }> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: opts.prompt }];
  const maxRepairs = opts.maxRepairs ?? 2;

  for (let attempt = 0; ; attempt++) {
    // Checked before every attempt, repairs included, so a repair loop can't run past the limit.
    assertUnderSpendLimit();
    const message = await client.beta.messages
      .stream({
        model: MODEL,
        max_tokens: 64000,
        output_config: { effort: opts.effort ?? "high", format: betaZodOutputFormat(opts.schema) },
        // If a safety classifier declines (possible with security-flavoured topics like SSH or Vault),
        // the API retries on Anthropic's recommended fallback model instead of failing.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        messages,
      })
      .finalMessage();
    recordUsage(billedAttempts(message));

    if (message.stop_reason === "refusal")
      throw new Error(`The model declined this request (${message.stop_details?.category ?? "no category"}).`);
    if (message.stop_reason === "max_tokens") throw new Error("The model ran out of output tokens.");

    const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    let errors: string[];
    try {
      const parsed = opts.schema.safeParse(JSON.parse(text));
      if (parsed.success) {
        const checked = opts.check(parsed.data);
        if (checked.ok) return { value: parsed.data, result: checked.result, repairs: attempt };
        errors = checked.errors;
      } else {
        errors = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      }
    } catch {
      errors = ["The response was not valid JSON."];
    }

    console.warn(`[llm] attempt ${attempt + 1} invalid:`, errors);
    if (attempt >= maxRepairs) throw new Error(`Output still invalid after ${maxRepairs} repairs:\n${errors.join("\n")}`);
    // Append-only: keep the model's own turn exactly as returned, then ask for a fix.
    messages.push({ role: "assistant", content: message.content as Anthropic.Beta.BetaContentBlockParam[] });
    messages.push({
      role: "user",
      content: `Your JSON has these problems:\n- ${errors.join("\n- ")}\n\nReturn the complete corrected JSON.`,
    });
  }
}

// usage.iterations lists every billed attempt (including a declined model before a fallback);
// top-level usage only covers the attempt that produced the returned message.
function billedAttempts(message: Anthropic.Beta.BetaMessage): Attempt[] {
  const iterations = (message.usage.iterations ?? []).flatMap((it) =>
    it.type === "message" || it.type === "fallback_message" ? [{ ...it, model: it.model ?? message.model }] : [],
  );
  return iterations.length > 0 ? iterations : [{ ...message.usage, model: message.model }];
}

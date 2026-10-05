import { describe, expect, it } from "vitest";
import { costOf, spendLevel } from "./pricing";

const attempt = (model: string, input: number, output: number) => ({ model, input_tokens: input, output_tokens: output });

describe("costOf", () => {
  it("prices input and output per million tokens", () => {
    // Opus 5.5: $4 in + $20 out
    expect(costOf(attempt("claude-opus-5-5", 1_000_000, 1_000_000))).toBeCloseTo(24);
    expect(costOf(attempt("claude-sonnet-5-5", 1_000_000, 0))).toBeCloseTo(2);
  });

  it("does not confuse Opus 5.5 with Opus 5", () => {
    expect(costOf(attempt("claude-opus-5", 1_000_000, 0))).toBeCloseTo(5);
    expect(costOf(attempt("claude-opus-5-5", 1_000_000, 0))).toBeCloseTo(4);
  });

  it("charges cache reads, and 5-minute vs 1-hour cache writes differently", () => {
    const cost = costOf({
      model: "claude-opus-5-5",
      input_tokens: 0,
      output_tokens: 0,
      cache_read_input_tokens: 1_000_000, // $0.20
      cache_creation_input_tokens: 2_000_000,
      cache_creation: { ephemeral_5m_input_tokens: 1_000_000, ephemeral_1h_input_tokens: 1_000_000 }, // $5 + $8
    });
    expect(cost).toBeCloseTo(13.2);
  });

  it("prices an unknown model at the highest rate rather than zero", () => {
    expect(costOf(attempt("claude-future-9", 1_000_000, 0))).toBeCloseTo(10);
  });
});

describe("spendLevel", () => {
  it("is green under $5, amber under $20, red from $20", () => {
    expect([0, 4.99, 5, 19.99, 20].map(spendLevel)).toEqual(["low", "low", "medium", "medium", "high"]);
  });
});

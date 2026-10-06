import { z } from "zod";

// Step 1 output: the cleaned-up list, plus items the model could not interpret with confidence.
export const NormalizeResult = z.object({
  concepts: z.array(
    z.object({
      name: z.string().describe("Canonical concept name in English"),
      from: z.string().describe("The original text from the raw list this came from"),
      change: z
        .string()
        .describe(
          "What was done to get here, e.g. 'fixed typo', 'translated from Danish', 'split from a combined item', 'merged duplicate'. Empty string if nothing changed.",
        ),
    }),
  ),
  ambiguous: z.array(
    z.object({
      id: z.string().describe("Short kebab-case id, e.g. 't3-code'"),
      original: z.string(),
      question: z.string().describe("A plain-language question to the learner"),
      interpretations: z.array(
        z.object({
          name: z.string().describe("Concept name if the learner picks this"),
          description: z.string().describe("One short sentence explaining this meaning"),
        }),
      ),
      likely: z.number().int().describe("Index of the most likely interpretation"),
    }),
  ),
});
export type NormalizeResult = z.infer<typeof NormalizeResult>;

// What the learner sends back for each ambiguous item.
export const Resolution = z.object({
  id: z.string(),
  choice: z.union([
    z.object({ kind: z.literal("pick"), index: z.number().int() }),
    z.object({ kind: z.literal("custom"), text: z.string().min(1) }),
    z.object({ kind: z.literal("skip") }),
  ]),
});
export type Resolution = z.infer<typeof Resolution>;

// Step 2 output: the full learning path.
export const PathGraph = z.object({
  title: z.string().describe("Short title for the path, e.g. 'DevOps foundations'"),
  modules: z.array(
    z.object({
      key: z.string().describe("kebab-case id"),
      title: z.string(),
      why_it_matters: z.string().describe("One line"),
    }),
  ),
  concepts: z.array(
    z.object({
      slug: z.string().describe("kebab-case, unique"),
      name: z.string(),
      summary: z.string().describe("One plain-language sentence"),
      module: z.string().describe("key of the module this concept belongs to"),
      added_by_system: z
        .boolean()
        .describe("true if this is a prerequisite you added, not from the learner's list"),
      covers: z
        .array(z.string())
        .describe("Exact names from the confirmed list that this concept covers. Empty if added_by_system."),
      prerequisites: z.array(z.string()).describe("slugs of concepts that must be understood first"),
    }),
  ),
});
export type PathGraph = z.infer<typeof PathGraph>;

// Lessons for every concept in one module, generated together when the module is first opened.
export const ModuleLessons = z.object({
  lessons: z.array(
    z.object({
      slug: z.string().describe("slug of the concept this lesson is for, exactly as given"),
      explanation: z
        .string()
        .describe("Plain-English definition and explanation: 4-6 short paragraphs separated by blank lines. `backticks` for commands or code."),
      example: z.object({
        description: z.string().describe("A concrete, everyday or hands-on example, 1-2 short paragraphs"),
        code: z.string().describe("A short code or terminal snippet that shows the idea. Empty string if code doesn't fit."),
        language: z.string().describe("Language of the snippet, e.g. 'bash', 'yaml', 'python'. Empty string if no code."),
      }),
      questions: z
        .array(
          z.object({
            prompt: z.string().describe("The question, answerable in the learner's own words in a few sentences or lines"),
            kind: z.enum(["explain", "apply", "code"]),
            rubric: z.string().describe("What a correct answer must show. Never shown to the learner."),
          }),
        )
        .describe("2-3 questions"),
    }),
  ),
});
export type ModuleLessons = z.infer<typeof ModuleLessons>;

export const QuizGrade = z.object({
  results: z.array(
    z.object({
      verdict: z.enum(["correct", "partly", "incorrect"]),
      feedback: z.string().describe("Plain-English feedback on this answer, written to the learner. 2-5 short sentences."),
      reply_to_question: z
        .string()
        .describe("If the learner asked you something in this answer, a direct, plain answer to it. Empty string if they didn't ask anything."),
    }),
  ),
  passed: z.boolean().describe("true only if the answers together show the learner really understands the concept"),
  summary: z.string().describe("Two or three short, plain sentences to the learner: what they've got, and exactly what to work on if not passed"),
});
export type QuizGrade = z.infer<typeof QuizGrade>;

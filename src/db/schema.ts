import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

// A path moves normalizing -> awaiting_confirmation -> generating -> ready (or failed).
export const paths = sqliteTable("paths", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  rawInput: text("raw_input").notNull(),
  learnerLevel: text("learner_level").notNull().default(""),
  status: text("status", {
    enum: ["normalizing", "awaiting_confirmation", "generating", "ready", "failed"],
  }).notNull(),
  // Output of the normalize step, kept so the confirmation screen survives a refresh.
  normalizedJson: text("normalized_json"),
  // The learner's answers to the ambiguity questions.
  resolutionsJson: text("resolutions_json"),
  error: text("error"),
  createdAt: createdAt(),
});

export const modules = sqliteTable("modules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pathId: integer("path_id")
    .notNull()
    .references(() => paths.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
});

export const concepts = sqliteTable(
  "concepts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pathId: integer("path_id")
      .notNull()
      .references(() => paths.id, { onDelete: "cascade" }),
    moduleId: integer("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    summary: text("summary").notNull(),
    // Position on the roadmap: a topological order, so a step never depends on a later one.
    step: integer("step").notNull(),
    addedBySystem: integer("added_by_system", { mode: "boolean" }).notNull(),
    // Filled lazily the first time the concept page is opened (phase 3).
    contentJson: text("content_json"),
    rubricJson: text("rubric_json"),
  },
  (t) => [uniqueIndex("concepts_path_slug").on(t.pathId, t.slug)],
);

export const conceptPrereqs = sqliteTable(
  "concept_prereqs",
  {
    conceptId: integer("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
    prereqId: integer("prereq_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.conceptId, t.prereqId] })],
);

export const progress = sqliteTable("progress", {
  conceptId: integer("concept_id")
    .primaryKey()
    .references(() => concepts.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["in_progress", "mastered", "needs_review"],
  }).notNull(),
  score: real("score"),
  attempts: integer("attempts").notNull().default(0),
  lastSeen: integer("last_seen", { mode: "timestamp" }),
});

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: integer("concept_id")
    .notNull()
    .references(() => concepts.id, { onDelete: "cascade" }),
  answersJson: text("answers_json").notNull(),
  mcScore: real("mc_score"),
  openResultsJson: text("open_results_json"),
  passed: integer("passed", { mode: "boolean" }).notNull(),
  createdAt: createdAt(),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: integer("concept_id")
    .notNull()
    .references(() => concepts.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  createdAt: createdAt(),
});

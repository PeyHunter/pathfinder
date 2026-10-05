// Applies the committed SQL migrations. With --reset, deletes the database first.
import fs from "node:fs";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const file = process.env.DATABASE_FILE ?? "data/pathfinder.db";
if (process.argv.includes("--reset")) {
  for (const f of [file, `${file}-wal`, `${file}-shm`]) fs.rmSync(f, { force: true });
  console.log(`Deleted ${file}`);
}
const { db } = await import("../src/db/index");
migrate(db, { migrationsFolder: "drizzle" });
console.log(`Database ready at ${file}`);

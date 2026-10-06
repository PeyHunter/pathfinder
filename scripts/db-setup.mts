// Applies the committed SQL migrations. With --reset, deletes the database first.
import fs from "node:fs";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const file = process.env.DATABASE_FILE ?? "data/pathfinder.db";
if (process.argv.includes("--reset")) {
  for (const f of [file, `${file}-wal`, `${file}-shm`]) fs.rmSync(f, { force: true });
  console.log(`Deleted ${file}`);
}
const { db } = await import("../src/db/index");
// Table rebuilds (DROP + recreate) would cascade-delete child rows with foreign keys on, and SQLite ignores
// the PRAGMA inside the migrator's transaction, so switch them off around it and check integrity after.
db.run(sql`PRAGMA foreign_keys = OFF`);
migrate(db, { migrationsFolder: "drizzle" });
db.run(sql`PRAGMA foreign_keys = ON`);
const broken = db.all(sql`PRAGMA foreign_key_check`);
if (broken.length) throw new Error(`Foreign key check failed after migrating: ${JSON.stringify(broken)}`);
console.log(`Database ready at ${file}`);

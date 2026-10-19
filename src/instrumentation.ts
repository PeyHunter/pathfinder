// Runs once when the server starts, before any request: brings the database up to date.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const { db } = await import("./db");
  migrate(db, { migrationsFolder: "drizzle" });
}


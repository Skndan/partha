import { drizzle } from "drizzle-orm/postgres-js";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import postgres from "postgres";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/** Valid at runtime; build/lint may run without a real DB URL. */
const databaseUrl =
  process.env.DATABASE_URL || "postgresql://build:build@127.0.0.1:5432/build";

const isNeon =
  databaseUrl.includes("neon.tech") || /@ep-[a-z0-9-]+/i.test(databaseUrl);

// Many Neon connection strings you get from the Console point to a pooler/pgBouncer
// hostname (e.g. `*-pooler...`). The Neon serverless driver doesn't always handle
// those reliably, so for pooler URLs we fall back to `postgres-js`.
const shouldUseNeonServerless = isNeon && !/pooler/i.test(databaseUrl);
let postgresClient: ReturnType<typeof postgres> | null = null;

const db = (() => {
  if (shouldUseNeonServerless) {
    const sql = neon(databaseUrl);
    return neonDrizzle(sql as any, { schema });
  }

  postgresClient = postgres(databaseUrl);
  return drizzle(postgresClient as any, { schema });
})();

export { db };
export async function closeDb() {
  if (!postgresClient) {
    return;
  }
  await postgresClient.end({ timeout: 5 });
  postgresClient = null;
}

export type User = typeof schema.user.$inferSelect;
export type Session = typeof schema.session.$inferSelect;
export type UserInsert = typeof schema.user.$inferInsert;

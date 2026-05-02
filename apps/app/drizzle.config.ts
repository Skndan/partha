import { config } from "dotenv";
import { type Config } from "drizzle-kit";

// Load .env then .env.local so DATABASE_URL is available for drizzle-kit (local or Neon).
config({ path: ".env" });
config({ path: ".env.local" });

type ConfigWithoutDriver = Omit<Config, "driver">;
export default {
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  out: "./drizzle",
  // @ts-ignore
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies ConfigWithoutDriver;

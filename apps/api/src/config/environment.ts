import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

let environmentLoaded = false;

function loadRepositoryEnvironment(): void {
  if (environmentLoaded) {
    return;
  }

  config({
    path: resolve(__dirname, "../../../..", ".env"),
    override: false,
    quiet: true,
  });
  environmentLoaded = true;
}

const databaseUrlSchema = z.string().min(1).refine(
  (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "postgres:" || url.protocol === "postgresql:";
    } catch {
      return false;
    }
  },
  {
    message: "Expected a PostgreSQL connection URL.",
  },
);

export function getDatabaseUrl(): string {
  loadRepositoryEnvironment();

  const result = databaseUrlSchema.safeParse(process.env.DATABASE_URL);
  if (!result.success) {
    throw new Error(
      "DATABASE_URL must be set to a valid PostgreSQL connection URL.",
    );
  }

  return result.data;
}

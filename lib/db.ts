import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL;

/**
 * Drizzle client backed by Neon's serverless HTTP driver.
 *
 * The app must build and boot even before a database is provisioned, so when
 * DATABASE_URL is missing we return a proxy that throws only if you actually
 * touch the DB at request time — never at import/build time.
 */
function makeDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (databaseUrl) {
    return drizzle(neon(databaseUrl), { schema });
  }
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          "DATABASE_URL is not set. Add it to .env (see .env.example) to use the database.",
        );
      },
    },
  ) as ReturnType<typeof drizzle<typeof schema>>;
}

export const db = makeDb();

export const isDbConfigured = Boolean(databaseUrl);

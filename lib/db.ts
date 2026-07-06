import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL;

/**
 * Drizzle client over a standard Postgres connection (postgres.js) — works with
 * Supabase (and any Postgres). Use the Supabase "transaction pooler" URL in
 * serverless; `prepare: false` is required for pgBouncer transaction pooling.
 *
 * The app must build and boot even before a database is provisioned, so when
 * DATABASE_URL is missing we return a proxy that throws only if you actually
 * touch the DB at request time — never at import/build time.
 */
type DB = ReturnType<typeof drizzle<typeof schema>>;

function makeDb(): DB {
  if (databaseUrl) {
    const client = postgres(databaseUrl, { prepare: false });
    return drizzle(client, { schema });
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
  ) as DB;
}

export const db = makeDb();

export const isDbConfigured = Boolean(databaseUrl);

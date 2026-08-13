import postgres from "postgres";

const localDatabaseUrl = "postgres://jusik:jusik_local@127.0.0.1:5432/jusik";

export function createDatabase(url: string = localDatabaseUrl) {
  return postgres(url, {
    idle_timeout: 20,
    max: 10,
    max_lifetime: 60 * 30,
  });
}

export type Database = ReturnType<typeof createDatabase>;

export const db = createDatabase(process.env.DATABASE_URL ?? localDatabaseUrl);

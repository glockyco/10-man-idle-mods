import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "..", "..", "..", "data", "10man-idle.db");

if (!fs.existsSync(dbPath)) {
  throw new Error(
    `Database not found at ${dbPath}. Run the DataExporter mod first.`,
  );
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath, { readonly: true });
  }
  return db;
}

export function query<T>(sql: string, params: unknown[] = []): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

export function queryOne<T>(
  sql: string,
  params: unknown[] = [],
): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "..", "..", "..", "data", "10man-idle.db");

let db: Database.Database | null = null;

export const hasDb = fs.existsSync(dbPath);

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath, { readonly: true });
    db.pragma("journal_mode = WAL");
  }
  return db;
}

export function query<T>(sql: string, params: unknown[] = []): T[] {
  if (!hasDb) return [];
  return getDb().prepare(sql).all(...params) as T[];
}

export function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
  if (!hasDb) return undefined;
  return getDb().prepare(sql).get(...params) as T | undefined;
}

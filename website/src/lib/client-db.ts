import initSqlJs, { type Database } from "sql.js";

let db: Database | null = null;
let loading = false;
let loadPromise: Promise<Database | null> | null = null;

export async function getClientDb(): Promise<Database | null> {
  if (db) return db;
  if (loadPromise) return loadPromise;

  loading = true;
  loadPromise = (async () => {
    try {
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });
      const response = await fetch("/10man-idle.db");
      if (!response.ok) return null;
      const buf = await response.arrayBuffer();
      db = new SQL.Database(new Uint8Array(buf));
      return db;
    } catch {
      return null;
    } finally {
      loading = false;
    }
  })();

  return loadPromise;
}

export function isLoading(): boolean {
  return loading;
}

export interface QueryResult {
  columns: string[];
  values: unknown[][];
}

export function runQuery(
  database: Database,
  sql: string,
  params?: unknown[],
): QueryResult | null {
  try {
    const results = database.exec(sql, params as never);
    if (results.length === 0) return { columns: [], values: [] };
    return results[0];
  } catch {
    return null;
  }
}

import { query } from "../lib/db";
import type { Suffix } from "./types";

export function getAllSuffixes(): Suffix[] {
  return query<Suffix>(
    "SELECT * FROM suffixes ORDER BY category, name",
  );
}

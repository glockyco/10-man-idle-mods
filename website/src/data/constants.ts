import { query } from "../lib/db";
import type { GameConstant } from "./types";

export function getAllConstants(): GameConstant[] {
  return query<GameConstant>("SELECT * FROM game_constants ORDER BY key");
}

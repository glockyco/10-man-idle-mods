import { query, queryOne } from "../lib/db";
import type { Dungeon, LootDrop } from "./types";

export function getAllDungeons(): Dungeon[] {
  return query<Dungeon>("SELECT * FROM dungeons ORDER BY required_guild_level, name");
}

export function getDungeon(id: string): Dungeon | undefined {
  return queryOne<Dungeon>("SELECT * FROM dungeons WHERE id = ?", [id]);
}

export function getDungeonLoot(dungeonId: string): LootDrop[] {
  return query<LootDrop>(
    `SELECT dl.item_id, i.name as item_name, i.rarity as item_rarity,
            dl.min_quantity, dl.max_quantity, dl.chance
     FROM dungeon_loot dl LEFT JOIN items i ON dl.item_id = i.id
     WHERE dl.dungeon_id = ?
     ORDER BY dl.chance DESC`,
    [dungeonId],
  );
}

export function getAllDungeonIds(): string[] {
  return query<{ id: string }>("SELECT id FROM dungeons").map((r) => r.id);
}

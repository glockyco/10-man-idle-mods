import { query, queryOne } from "../lib/db";
import type { Raid, LootDrop } from "./types";

export function getAllRaids(): Raid[] {
  return query<Raid>(
    "SELECT * FROM raids ORDER BY required_guild_level, name",
  );
}

export function getRaid(id: string): Raid | undefined {
  return queryOne<Raid>("SELECT * FROM raids WHERE id = ?", [id]);
}

export function getRaidLoot(raidId: string): LootDrop[] {
  return query<LootDrop>(
    `SELECT rl.item_id, i.name as item_name, i.rarity as item_rarity,
            rl.min_quantity, rl.max_quantity, rl.chance
     FROM raid_loot rl LEFT JOIN items i ON rl.item_id = i.id
     WHERE rl.raid_id = ?
     ORDER BY rl.chance DESC`,
    [raidId],
  );
}

export function getAllRaidIds(): string[] {
  return query<{ id: string }>("SELECT id FROM raids").map((r) => r.id);
}

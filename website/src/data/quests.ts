import { query, queryOne } from "../lib/db";
import type { LootDrop, Quest } from "./types";

export function getAllQuests(): Quest[] {
  return query<Quest>("SELECT * FROM quests ORDER BY min_character_level, name");
}

export function getQuest(id: string): Quest | undefined {
  return queryOne<Quest>("SELECT * FROM quests WHERE id = ?", [id]);
}

export function getQuestRewards(questId: string): LootDrop[] {
  return query<LootDrop>(
    `SELECT qr.item_id, i.name as item_name, i.rarity as item_rarity,
            qr.min_quantity, qr.max_quantity, qr.chance
     FROM quest_rewards qr LEFT JOIN items i ON qr.item_id = i.id
     WHERE qr.quest_id = ?
     ORDER BY qr.chance DESC`,
    [questId],
  );
}

export function getAllQuestIds(): string[] {
  return query<{ id: string }>("SELECT id FROM quests").map((r) => r.id);
}

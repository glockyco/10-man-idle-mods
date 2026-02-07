import { query, queryOne } from "../lib/db";
import {
  dungeonUrl,
  raidUrl,
  gatheringUrl,
  questUrl,
  recipeUrl,
} from "./helpers";
import type {
  Item,
  RecipeUsage,
  ItemSource,
  GatheringTool,
} from "./types";

export function getAllItems(): Item[] {
  return query<Item>(
    "SELECT * FROM items ORDER BY item_level DESC, name",
  );
}

export function getItem(id: string): Item | undefined {
  return queryOne<Item>("SELECT * FROM items WHERE id = ?", [id]);
}

export function getItemClasses(itemId: string): string[] {
  return query<{ class: string }>(
    "SELECT class FROM item_allowed_classes WHERE item_id = ?",
    [itemId],
  ).map((r) => r.class);
}

export function getRecipesProducingItem(
  itemId: string,
): { id: string; name: string }[] {
  return query<{ id: string; name: string }>(
    "SELECT id, name FROM recipes WHERE output_item_id = ?",
    [itemId],
  );
}

export function getRecipesUsingItem(itemId: string): RecipeUsage[] {
  return query<RecipeUsage>(
    `SELECT r.id as recipe_id, r.name as recipe_name
     FROM recipe_ingredients ri JOIN recipes r ON ri.recipe_id = r.id
     WHERE ri.item_id = ?`,
    [itemId],
  );
}

export function getItemSources(itemId: string): ItemSource[] {
  const sources: ItemSource[] = [];

  const dungeonDrops = query<{
    source_id: string;
    source_name: string;
    chance: number;
  }>(
    `SELECT d.id as source_id, d.name as source_name, dl.chance
     FROM dungeon_loot dl JOIN dungeons d ON dl.dungeon_id = d.id
     WHERE dl.item_id = ?`,
    [itemId],
  );
  for (const d of dungeonDrops) {
    sources.push({
      source_type: "dungeon",
      source_id: d.source_id,
      source_name: d.source_name,
      url: dungeonUrl(d.source_id),
      chance: d.chance,
    });
  }

  const raidDrops = query<{
    source_id: string;
    source_name: string;
    chance: number;
  }>(
    `SELECT r.id as source_id, r.name as source_name, rl.chance
     FROM raid_loot rl JOIN raids r ON rl.raid_id = r.id
     WHERE rl.item_id = ?`,
    [itemId],
  );
  for (const r of raidDrops) {
    sources.push({
      source_type: "raid",
      source_id: r.source_id,
      source_name: r.source_name,
      url: raidUrl(r.source_id),
      chance: r.chance,
    });
  }

  const gatheringDrops = query<{
    source_id: string;
    source_name: string;
    chance: number;
  }>(
    `SELECT gn.skill as source_id, gn.name as source_name, gd.chance
     FROM gathering_drops gd JOIN gathering_nodes gn ON gd.node_id = gn.id
     WHERE gd.item_id = ?`,
    [itemId],
  );
  for (const g of gatheringDrops) {
    sources.push({
      source_type: "gathering",
      source_id: g.source_id,
      source_name: g.source_name,
      url: gatheringUrl(g.source_id),
      chance: g.chance,
    });
  }

  const questRewards = query<{
    source_id: string;
    source_name: string;
    chance: number;
  }>(
    `SELECT q.id as source_id, q.name as source_name, qr.chance
     FROM quest_rewards qr JOIN quests q ON qr.quest_id = q.id
     WHERE qr.item_id = ?`,
    [itemId],
  );
  for (const q of questRewards) {
    sources.push({
      source_type: "quest",
      source_id: q.source_id,
      source_name: q.source_name,
      url: questUrl(q.source_id),
      chance: q.chance,
    });
  }

  const recipeOutputs = query<{
    source_id: string;
    source_name: string;
  }>(
    `SELECT id as source_id, name as source_name
     FROM recipes WHERE output_item_id = ?`,
    [itemId],
  );
  for (const r of recipeOutputs) {
    sources.push({
      source_type: "recipe",
      source_id: r.source_id,
      source_name: r.source_name,
      url: recipeUrl(r.source_id),
    });
  }

  return sources;
}

export function getAllItemIds(): string[] {
  return query<{ id: string }>("SELECT id FROM items").map((r) => r.id);
}

export function getAllToolIds(): string[] {
  return query<{ id: string }>("SELECT id FROM gathering_tools").map(
    (r) => r.id,
  );
}

export function getTool(id: string): GatheringTool | undefined {
  return queryOne<GatheringTool>(
    "SELECT * FROM gathering_tools WHERE id = ?",
    [id],
  );
}

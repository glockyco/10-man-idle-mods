// ── Core entities ─────────────────────────────────────────────────────────────

export interface Item {
  id: string;
  name: string;
  category: string;
  rarity: string;
  base_value: number;
  max_stack_size: number;
  item_level: number;
  slot: string | null;
  armor_type: string | null;
  combat_power: number;
  material_type: string | null;
  tier: number;
  consumable_type: string | null;
  duration: number;
  effect_value: number;
}

export interface GatheringTool {
  id: string;
  name: string;
  skill: string;
  speed_bonus: number;
}

export interface GatheringNode {
  id: string;
  name: string;
  skill: string;
  required_level: number;
  base_duration: number;
}

export interface Recipe {
  id: string;
  name: string;
  skill: string;
  required_level: number;
  duration: number;
  output_item_id: string;
  output_quantity: number;
  gold_cost: number;
}

export interface Dungeon {
  id: string;
  name: string;
  description: string | null;
  required_guild_level: number;
  difficulty: string;
  recommended_combat_power: number;
  base_duration: number;
  gold_reward: number;
  experience_reward: number;
}

export interface Raid {
  id: string;
  name: string;
  description: string | null;
  required_guild_level: number;
  difficulty: string;
  recommended_combat_power: number;
  base_duration: number;
  gold_reward: number;
  experience_reward: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string | null;
  type: string;
  min_character_level: number;
  recommended_combat_power: number;
  base_duration: number;
  gold_reward: number;
  experience_reward: number;
}

export interface CharacterClass {
  name: string;
  armor_type: string;
  roles: string;
}

export interface Suffix {
  id: string;
  name: string;
  category: string;
  combat_power_multiplier: number;
}

export interface GameConstant {
  key: string;
  value: string;
}

// ── Join / computed types ────────────────────────────────────────────────────

export interface LootDrop {
  item_id: string;
  item_name: string | null;
  item_rarity: string | null;
  min_quantity: number;
  max_quantity: number;
  chance: number;
}

export interface GatheringDrop {
  node_id: string;
  item_id: string;
  item_name: string | null;
  item_rarity: string | null;
  min_quantity: number;
  max_quantity: number;
  chance: number;
}

export interface RecipeIngredient {
  item_id: string;
  item_name: string | null;
  quantity: number;
}

export interface RecipeWithOutput extends Recipe {
  output_item_name: string | null;
}

export interface RecipeUsage {
  recipe_id: string;
  recipe_name: string;
}

/** Union result from resolving a recipe's output_item_id */
export type RecipeOutput =
  | { kind: "item"; item: Item; url: string }
  | { kind: "tool"; tool: GatheringTool; url: string }
  | { kind: "unknown"; id: string };

export interface ItemSource {
  source_type: "dungeon" | "raid" | "gathering" | "quest" | "recipe";
  source_id: string;
  source_name: string;
  url: string;
  chance?: number;
}

export interface ClassItem {
  id: string;
  name: string;
  rarity: string;
  item_level: number;
  slot: string | null;
  combat_power: number;
}

import { query } from "../lib/db";
import type { GatheringNode, GatheringTool, GatheringDrop } from "./types";

export function getAllNodes(): GatheringNode[] {
  return query<GatheringNode>(
    "SELECT * FROM gathering_nodes ORDER BY skill, required_level, name",
  );
}

export function getNodesBySkill(skill: string): GatheringNode[] {
  return query<GatheringNode>(
    "SELECT * FROM gathering_nodes WHERE skill = ? ORDER BY required_level, name",
    [skill],
  );
}

export function getAllTools(): GatheringTool[] {
  return query<GatheringTool>(
    "SELECT * FROM gathering_tools ORDER BY skill, speed_bonus",
  );
}

export function getToolsBySkill(skill: string): GatheringTool[] {
  return query<GatheringTool>(
    "SELECT * FROM gathering_tools WHERE skill = ? ORDER BY speed_bonus",
    [skill],
  );
}

export function getDropsBySkill(skill: string): GatheringDrop[] {
  return query<GatheringDrop>(
    `SELECT gd.node_id, gd.item_id, i.name as item_name, i.rarity as item_rarity,
            gd.min_quantity, gd.max_quantity, gd.chance
     FROM gathering_drops gd
     LEFT JOIN items i ON gd.item_id = i.id
     JOIN gathering_nodes gn ON gd.node_id = gn.id
     WHERE gn.skill = ?
     ORDER BY gd.node_id, gd.chance DESC`,
    [skill],
  );
}

export function getDistinctSkills(): string[] {
  return query<{ skill: string }>(
    "SELECT DISTINCT skill FROM gathering_nodes ORDER BY skill",
  ).map((r) => r.skill);
}

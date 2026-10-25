import { getAllDungeons } from "./dungeons";
import { getAllTools } from "./gathering";
import { formatDuration, formatGold, formatSpeedBonus } from "./helpers";
import { getAllItems } from "./items";
import { getAllQuests } from "./quests";
import { getAllRaids } from "./raids";
import { getAllRecipes } from "./recipes";

export interface PreviewEntry {
  name: string;
  type: string;
  props: [string, string][];
}

export function buildPreviewData(): Record<string, PreviewEntry> {
  const data: Record<string, PreviewEntry> = {};

  for (const item of getAllItems()) {
    data[`item:${item.id}`] = {
      name: item.name,
      type: item.category,
      props: [
        ["Rarity", item.rarity],
        ["Level", String(item.item_level)],
        ...(item.slot ? [["Slot", item.slot] as [string, string]] : []),
        ...(item.combat_power > 0 ? [["CP", String(item.combat_power)] as [string, string]] : []),
      ],
    };
  }

  for (const tool of getAllTools()) {
    data[`tool:${tool.id}`] = {
      name: tool.name,
      type: "Gathering Tool",
      props: [
        ["Skill", tool.skill],
        ["Speed", formatSpeedBonus(tool.speed_bonus)],
      ],
    };
  }

  for (const d of getAllDungeons()) {
    data[`dungeon:${d.id}`] = {
      name: d.name,
      type: "Dungeon",
      props: [
        ["Difficulty", d.difficulty],
        ["Rec. CP", String(d.recommended_combat_power)],
        ["Duration", formatDuration(d.base_duration)],
      ],
    };
  }

  for (const r of getAllRaids()) {
    data[`raid:${r.id}`] = {
      name: r.name,
      type: "Raid",
      props: [
        ["Difficulty", r.difficulty],
        ["Rec. CP", String(r.recommended_combat_power)],
        ["Duration", formatDuration(r.base_duration)],
      ],
    };
  }

  for (const q of getAllQuests()) {
    data[`quest:${q.id}`] = {
      name: q.name,
      type: "Quest",
      props: [
        ["Type", q.type],
        ["Level", String(q.min_character_level)],
        ["Rec. CP", String(q.recommended_combat_power)],
      ],
    };
  }

  for (const r of getAllRecipes()) {
    data[`recipe:${r.id}`] = {
      name: r.name,
      type: "Recipe",
      props: [
        ["Profession", r.skill],
        ["Level", String(r.required_level)],
        ["Duration", formatDuration(r.duration)],
        ["Cost", formatGold(r.gold_cost)],
      ],
    };
  }

  return data;
}

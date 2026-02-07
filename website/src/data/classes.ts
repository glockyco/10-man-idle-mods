import { query, queryOne } from "../lib/db";
import type { CharacterClass, ClassItem } from "./types";

export function getAllClasses(): CharacterClass[] {
  return query<CharacterClass>(
    "SELECT * FROM character_classes ORDER BY name",
  );
}

export function getClass(name: string): CharacterClass | undefined {
  return queryOne<CharacterClass>(
    "SELECT * FROM character_classes WHERE name = ?",
    [name],
  );
}

export function getClassEquipment(className: string): ClassItem[] {
  return query<ClassItem>(
    `SELECT i.id, i.name, i.rarity, i.item_level, i.slot, i.combat_power
     FROM items i
     JOIN item_allowed_classes iac ON i.id = iac.item_id
     WHERE iac.class = ? AND i.category = 'Equipment'
     ORDER BY i.item_level DESC, i.name`,
    [className],
  );
}

export function getAllClassNames(): string[] {
  return query<{ name: string }>(
    "SELECT name FROM character_classes",
  ).map((r) => r.name);
}

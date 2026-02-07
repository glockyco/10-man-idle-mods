// ── URL builders ─────────────────────────────────────────────────────────────

export function itemUrl(id: string): string {
  return `/items/${id}/`;
}

export function toolUrl(id: string): string {
  return `/gathering/tools/${id}/`;
}

export function recipeUrl(id: string): string {
  return `/recipes/${id}/`;
}

export function dungeonUrl(id: string): string {
  return `/dungeons/${id}/`;
}

export function raidUrl(id: string): string {
  return `/raids/${id}/`;
}

export function questUrl(id: string): string {
  return `/quests/${id}/`;
}

export function gatheringUrl(skill: string): string {
  return `/gathering/${skill}/`;
}

export function classUrl(name: string): string {
  return `/classes/${name}/`;
}

// ── Tailwind class maps ──────────────────────────────────────────────────────

export const RARITY_CLASSES: Record<string, string> = {
  Common: "text-rarity-common",
  Uncommon: "text-rarity-uncommon",
  Rare: "text-rarity-rare",
  Epic: "text-rarity-epic",
  Legendary: "text-rarity-legendary",
};

export const ROLE_CLASSES: Record<string, string> = {
  Tank: "text-role-tank",
  Healer: "text-role-healer",
  DPS: "text-role-dps",
};

export function rarityClass(rarity: string | null | undefined): string {
  return (rarity && RARITY_CLASSES[rarity]) ?? "text-foreground";
}

export function roleClass(role: string): string {
  return ROLE_CLASSES[role] ?? "text-foreground";
}

// ── Formatters ───────────────────────────────────────────────────────────────

export function formatChance(chance: number): string {
  return `${(chance * 100).toFixed(0)}%`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

export function formatGold(amount: number): string {
  return `${amount.toLocaleString()}g`;
}

export function formatQuantityRange(min: number, max: number): string {
  return min === max ? `${min}` : `${min}-${max}`;
}

export function formatSpeedBonus(bonus: number): string {
  return `+${(bonus * 100).toFixed(0)}%`;
}

<script lang="ts">
  import { getClientDb, runQuery } from "../lib/client-db";
  import type { Database } from "sql.js";

  interface FilteredItem {
    id: string;
    name: string;
    category: string;
    rarity: string;
    item_level: number;
    slot: string | null;
    combat_power: number;
  }

  const rarityColors: Record<string, string> = {
    Common: "var(--common)",
    Uncommon: "var(--uncommon)",
    Rare: "var(--rare)",
    Epic: "var(--epic)",
    Legendary: "var(--legendary)",
  };

  let db = $state<Database | null>(null);
  let loading = $state(true);
  let error = $state("");

  let category = $state("");
  let rarity = $state("");
  let slot = $state("");
  let className = $state("");
  let minLevel = $state(0);
  let maxLevel = $state(100);
  let nameSearch = $state("");

  let items = $state<FilteredItem[]>([]);
  let categories = $state<string[]>([]);
  let rarities = $state<string[]>([]);
  let slots = $state<string[]>([]);
  let classes = $state<string[]>([]);

  $effect(() => {
    getClientDb().then((d) => {
      db = d;
      loading = false;
      if (!d) {
        error = "Could not load database.";
        return;
      }

      const catResult = runQuery(d, "SELECT DISTINCT category FROM items ORDER BY category");
      if (catResult) categories = catResult.values.map((r) => r[0] as string);

      const rarResult = runQuery(d, "SELECT DISTINCT rarity FROM items WHERE rarity IS NOT NULL ORDER BY rarity");
      if (rarResult) rarities = rarResult.values.map((r) => r[0] as string);

      const slotResult = runQuery(d, "SELECT DISTINCT slot FROM items WHERE slot IS NOT NULL ORDER BY slot");
      if (slotResult) slots = slotResult.values.map((r) => r[0] as string);

      const clsResult = runQuery(d, "SELECT DISTINCT class FROM item_allowed_classes ORDER BY class");
      if (clsResult) classes = clsResult.values.map((r) => r[0] as string);
    });
  });

  $effect(() => {
    if (!db) return;

    const conditions: string[] = ["1=1"];
    const params: unknown[] = [];

    if (category) {
      conditions.push("i.category = ?");
      params.push(category);
    }
    if (rarity) {
      conditions.push("i.rarity = ?");
      params.push(rarity);
    }
    if (slot) {
      conditions.push("i.slot = ?");
      params.push(slot);
    }
    if (minLevel > 0) {
      conditions.push("i.item_level >= ?");
      params.push(minLevel);
    }
    if (maxLevel < 100) {
      conditions.push("i.item_level <= ?");
      params.push(maxLevel);
    }
    if (nameSearch.length >= 2) {
      conditions.push("i.name LIKE ?");
      params.push(`%${nameSearch}%`);
    }

    let sql: string;
    if (className) {
      sql = `SELECT DISTINCT i.id, i.name, i.category, i.rarity, i.item_level, i.slot, i.combat_power
             FROM items i
             JOIN item_allowed_classes iac ON i.id = iac.item_id
             WHERE iac.class = ? AND ${conditions.join(" AND ")}
             ORDER BY i.item_level DESC, i.name
             LIMIT 200`;
      params.unshift(className);
    } else {
      sql = `SELECT i.id, i.name, i.category, i.rarity, i.item_level, i.slot, i.combat_power
             FROM items i
             WHERE ${conditions.join(" AND ")}
             ORDER BY i.item_level DESC, i.name
             LIMIT 200`;
    }

    const result = runQuery(db, sql, params);
    if (result) {
      items = result.values.map((row) => ({
        id: row[0] as string,
        name: row[1] as string,
        category: row[2] as string,
        rarity: row[3] as string,
        item_level: row[4] as number,
        slot: row[5] as string | null,
        combat_power: row[6] as number,
      }));
    }
  });
</script>

<div class="filter-container">
  {#if loading}
    <p class="filter-status">Loading database...</p>
  {:else if error}
    <p class="filter-error">{error}</p>
  {:else}
    <div class="filter-controls">
      <input
        type="text"
        bind:value={nameSearch}
        placeholder="Filter by name..."
        class="filter-input"
      />
      <select bind:value={category} class="filter-select">
        <option value="">All Categories</option>
        {#each categories as cat}
          <option value={cat}>{cat}</option>
        {/each}
      </select>
      <select bind:value={rarity} class="filter-select">
        <option value="">All Rarities</option>
        {#each rarities as rar}
          <option value={rar}>{rar}</option>
        {/each}
      </select>
      <select bind:value={slot} class="filter-select">
        <option value="">All Slots</option>
        {#each slots as s}
          <option value={s}>{s}</option>
        {/each}
      </select>
      <select bind:value={className} class="filter-select">
        <option value="">All Classes</option>
        {#each classes as cls}
          <option value={cls}>{cls}</option>
        {/each}
      </select>
      <div class="level-range">
        <label>
          Level {minLevel}–{maxLevel}
          <input type="range" bind:value={minLevel} min="0" max="100" />
          <input type="range" bind:value={maxLevel} min="0" max="100" />
        </label>
      </div>
    </div>

    <p class="filter-count">{items.length} items{items.length === 200 ? " (showing max 200)" : ""}</p>

    <table class="filter-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Rarity</th>
          <th>Level</th>
          <th>Slot</th>
          <th>CP</th>
        </tr>
      </thead>
      <tbody>
        {#each items as item}
          <tr>
            <td>
              <a href={`/items/${item.id}/`} style="color: {rarityColors[item.rarity] ?? 'var(--text)'}">
                {item.name}
              </a>
            </td>
            <td class="dim">{item.category}</td>
            <td style="color: {rarityColors[item.rarity] ?? 'var(--text)'}">{item.rarity}</td>
            <td>{item.item_level}</td>
            <td class="dim">{item.slot ?? "—"}</td>
            <td>{item.combat_power || "—"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .filter-container {
    margin-top: 1rem;
  }

  .filter-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .filter-input {
    padding: 0.5rem 0.75rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text);
    font-size: 0.875rem;
    min-width: 200px;
  }

  .filter-input:focus {
    outline: none;
    border-color: var(--link);
  }

  .filter-select {
    padding: 0.5rem 0.75rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text);
    font-size: 0.875rem;
  }

  .level-range {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-dim);
  }

  .level-range input[type="range"] {
    width: 80px;
  }

  .filter-count {
    color: var(--text-dim);
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .filter-table {
    width: 100%;
    border-collapse: collapse;
  }

  .filter-table thead tr {
    border-bottom: 2px solid var(--border);
    text-align: left;
  }

  .filter-table th,
  .filter-table td {
    padding: 0.5rem;
  }

  .filter-table tbody tr {
    border-bottom: 1px solid var(--border);
  }

  .dim {
    color: var(--text-dim);
  }

  .filter-status,
  .filter-error {
    font-size: 0.875rem;
  }

  .filter-status {
    color: var(--text-dim);
  }

  .filter-error {
    color: var(--accent);
  }
</style>

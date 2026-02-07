<script lang="ts">
  import { getClientDb, runQuery, type QueryResult } from "../lib/client-db";
  import type { Database } from "sql.js";

  interface SearchResult {
    name: string;
    type: string;
    url: string;
    detail: string;
  }

  let query = $state("");
  let results = $state<SearchResult[]>([]);
  let db = $state<Database | null>(null);
  let loading = $state(true);
  let error = $state("");

  $effect(() => {
    getClientDb().then((d) => {
      db = d;
      loading = false;
      if (!d) error = "Could not load database.";
    });
  });

  function search(term: string): SearchResult[] {
    if (!db || term.length < 2) return [];

    const like = `%${term}%`;
    const found: SearchResult[] = [];

    const items = runQuery(
      db,
      "SELECT id, name, category, rarity FROM items WHERE name LIKE ? LIMIT 20",
      [like],
    );
    if (items) {
      for (const row of items.values) {
        found.push({
          name: row[1] as string,
          type: "Item",
          url: `/items/${row[0]}/`,
          detail: `${row[3]} ${row[2]}`,
        });
      }
    }

    const recipes = runQuery(
      db,
      "SELECT id, name, skill FROM recipes WHERE name LIKE ? LIMIT 10",
      [like],
    );
    if (recipes) {
      for (const row of recipes.values) {
        found.push({
          name: row[1] as string,
          type: "Recipe",
          url: `/recipes/${row[0]}/`,
          detail: row[2] as string,
        });
      }
    }

    const dungeons = runQuery(
      db,
      "SELECT id, name, difficulty FROM dungeons WHERE name LIKE ? LIMIT 10",
      [like],
    );
    if (dungeons) {
      for (const row of dungeons.values) {
        found.push({
          name: row[1] as string,
          type: "Dungeon",
          url: `/dungeons/${row[0]}/`,
          detail: row[2] as string,
        });
      }
    }

    const raids = runQuery(
      db,
      "SELECT id, name, difficulty FROM raids WHERE name LIKE ? LIMIT 10",
      [like],
    );
    if (raids) {
      for (const row of raids.values) {
        found.push({
          name: row[1] as string,
          type: "Raid",
          url: `/raids/${row[0]}/`,
          detail: row[2] as string,
        });
      }
    }

    const quests = runQuery(
      db,
      "SELECT id, name, type FROM quests WHERE name LIKE ? LIMIT 10",
      [like],
    );
    if (quests) {
      for (const row of quests.values) {
        found.push({
          name: row[1] as string,
          type: "Quest",
          url: `/quests/${row[0]}/`,
          detail: row[2] as string,
        });
      }
    }

    return found;
  }

  $effect(() => {
    results = search(query);
  });
</script>

<div class="search-container">
  <input
    type="text"
    bind:value={query}
    placeholder={loading ? "Loading database..." : "Search items, recipes, dungeons..."}
    disabled={loading || !!error}
    class="search-input"
  />
  {#if error}
    <p class="search-error">{error}</p>
  {/if}
  {#if results.length > 0}
    <ul class="search-results">
      {#each results as result}
        <li>
          <a href={result.url}>
            <span class="result-name">{result.name}</span>
            <span class="result-meta">
              <span class="result-type">{result.type}</span>
              <span class="result-detail">{result.detail}</span>
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {:else if query.length >= 2 && !loading}
    <p class="search-empty">No results found.</p>
  {/if}
</div>

<style>
  .search-container {
    position: relative;
    max-width: 600px;
    margin: 1rem 0;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-size: 1rem;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--link);
  }

  .search-input:disabled {
    opacity: 0.5;
  }

  .search-results {
    list-style: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 0 0 6px 6px;
    max-height: 400px;
    overflow-y: auto;
    z-index: 10;
    margin: 0;
    padding: 0;
  }

  .search-results li a {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    color: var(--text);
    text-decoration: none;
    border-bottom: 1px solid var(--border);
  }

  .search-results li a:hover {
    background: var(--bg-elevated);
  }

  .result-name {
    color: var(--link);
  }

  .result-meta {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .result-type {
    color: var(--text-highlight);
  }

  .result-detail {
    color: var(--text-dim);
  }

  .search-error {
    color: var(--accent);
    margin-top: 0.5rem;
    font-size: 0.875rem;
  }

  .search-empty {
    color: var(--text-dim);
    margin-top: 0.5rem;
    font-size: 0.875rem;
  }
</style>

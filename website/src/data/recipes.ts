import { query, queryOne } from "../lib/db";
import { itemUrl, toolUrl } from "./helpers";
import type {
  GatheringTool,
  Item,
  Recipe,
  RecipeIngredient,
  RecipeOutput,
  RecipeWithOutput,
} from "./types";

export function getAllRecipes(): RecipeWithOutput[] {
  return query<RecipeWithOutput>(
    `SELECT r.*, i.name as output_item_name
     FROM recipes r LEFT JOIN items i ON r.output_item_id = i.id
     ORDER BY r.skill, r.required_level, r.name`,
  );
}

export function getRecipe(id: string): Recipe | undefined {
  return queryOne<Recipe>("SELECT * FROM recipes WHERE id = ?", [id]);
}

export function getRecipeIngredients(recipeId: string): RecipeIngredient[] {
  return query<RecipeIngredient>(
    `SELECT ri.item_id, i.name as item_name, ri.quantity
     FROM recipe_ingredients ri LEFT JOIN items i ON ri.item_id = i.id
     WHERE ri.recipe_id = ?`,
    [recipeId],
  );
}

export function getRecipeOutput(recipe: Recipe): RecipeOutput {
  if (!recipe.output_item_id) {
    return { kind: "unknown", id: "" };
  }

  const item = queryOne<Item>("SELECT * FROM items WHERE id = ?", [recipe.output_item_id]);
  if (item) {
    return { kind: "item", item, url: itemUrl(item.id) };
  }

  const tool = queryOne<GatheringTool>("SELECT * FROM gathering_tools WHERE id = ?", [
    recipe.output_item_id,
  ]);
  if (tool) {
    return { kind: "tool", tool, url: toolUrl(tool.id) };
  }

  return { kind: "unknown", id: recipe.output_item_id };
}

export function getAllRecipeIds(): string[] {
  return query<{ id: string }>("SELECT id FROM recipes").map((r) => r.id);
}

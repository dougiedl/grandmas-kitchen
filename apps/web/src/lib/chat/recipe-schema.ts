export type Recipe = {
  title: string;
  cuisine: string;
  servings: number;
  totalMinutes: number;
  ingredients: Array<{ amount: string; item: string }>;
  steps: string[];
  grandmaTips: string[];
};

export const REGENERATION_STYLES = ["faster", "traditional", "vegetarian"] as const;
export type RegenerationStyle = (typeof REGENERATION_STYLES)[number];

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isValidIngredient(value: unknown): value is { amount: string; item: string } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return isString(record.amount) && record.amount.length > 0 && isString(record.item) && record.item.length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => isString(entry) && entry.length > 0);
}

export function parseRegenerationStyle(value: unknown): RegenerationStyle | undefined {
  if (!isString(value)) {
    return undefined;
  }

  return REGENERATION_STYLES.find((style) => style === value);
}

export function validateRecipe(raw: unknown): Recipe {
  if (!raw || typeof raw !== "object") {
    throw new Error("Recipe must be an object");
  }

  const record = raw as Record<string, unknown>;

  if (!isString(record.title) || record.title.length < 3) {
    throw new Error("Recipe.title is invalid");
  }

  if (!isString(record.cuisine) || record.cuisine.length < 2) {
    throw new Error("Recipe.cuisine is invalid");
  }

  if (typeof record.servings !== "number" || !Number.isInteger(record.servings) || record.servings < 1 || record.servings > 20) {
    throw new Error("Recipe.servings is invalid");
  }

  if (
    typeof record.totalMinutes !== "number" ||
    !Number.isInteger(record.totalMinutes) ||
    record.totalMinutes < 5 ||
    record.totalMinutes > 600
  ) {
    throw new Error("Recipe.totalMinutes is invalid");
  }

  if (!Array.isArray(record.ingredients) || record.ingredients.length < 3 || record.ingredients.length > 30 || !record.ingredients.every(isValidIngredient)) {
    throw new Error("Recipe.ingredients are invalid");
  }

  if (!isStringArray(record.steps) || record.steps.length < 2 || record.steps.length > 20) {
    throw new Error("Recipe.steps are invalid");
  }

  if (!isStringArray(record.grandmaTips) || record.grandmaTips.length < 1 || record.grandmaTips.length > 8) {
    throw new Error("Recipe.grandmaTips are invalid");
  }

  return {
    title: record.title,
    cuisine: record.cuisine,
    servings: record.servings,
    totalMinutes: record.totalMinutes,
    ingredients: record.ingredients,
    steps: record.steps,
    grandmaTips: record.grandmaTips,
  };
}

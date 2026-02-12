import type { Recipe } from "@/lib/chat/recipe-schema";

type EvalInput = {
  prompt: string;
  recipe: Recipe;
};

export type EvalScore = {
  totalScore: number;
  realismScore: number;
  structureScore: number;
  grandmaScore: number;
  speedAlignmentScore: number;
  notes: string;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function speedTarget(prompt: string): number | null {
  const text = prompt.toLowerCase();
  if (text.includes("30-minute") || text.includes("30 minute") || text.includes("quick") || text.includes("weeknight")) {
    return 30;
  }
  if (text.includes("sunday") || text.includes("slow") || text.includes("comfort")) {
    return 60;
  }
  return null;
}

function regionalTokens(prompt: string): string[] {
  const text = prompt.toLowerCase();
  const tokens: string[] = [];
  if (text.includes("sicilian")) tokens.push("sicilian");
  if (text.includes("neapolitan") || text.includes("naples")) tokens.push("neapolitan");
  if (text.includes("italian-american") || text.includes("new york")) tokens.push("italian-american");
  if (text.includes("oaxacan")) tokens.push("oaxacan");
  return tokens;
}

const CUISINE_AUTH_TOKENS: Record<string, string[]> = {
  italian: ["soffritto", "ragu", "passata", "basil", "pecorino", "parmigiano", "olive oil"],
  mexican: ["chile", "cilantro", "lime", "beans", "tomato", "comal", "guisado"],
  greek: ["lemon", "oregano", "olive oil", "feta", "dill", "fasolada"],
  spanish: ["sofrito", "paprika", "saffron", "olive oil", "cocido", "paella"],
  french: ["shallot", "butter", "thyme", "ragout", "potage"],
  lebanese: ["lemon", "mint", "parsley", "chickpea", "lentil", "warm spices"],
  persian: ["saffron", "turmeric", "dried lime", "pomegranate", "walnut", "tahdig"],
};

export function scoreRecipe({ prompt, recipe }: EvalInput): EvalScore {
  const notes: string[] = [];

  let structure = 100;
  if (recipe.ingredients.length < 5) {
    structure -= 20;
    notes.push("low ingredient count");
  }
  if (recipe.steps.length < 4) {
    structure -= 20;
    notes.push("few steps");
  }
  if (recipe.grandmaTips.length < 2) {
    structure -= 15;
    notes.push("few grandma tips");
  }

  let realism = 100;
  if (recipe.totalMinutes < 15) {
    realism -= 20;
    notes.push("time may be too short");
  }
  if (recipe.totalMinutes > 180) {
    realism -= 20;
    notes.push("time may be too long");
  }
  let grandma = 70;
  const grandmaText = recipe.grandmaTips.join(" ").toLowerCase();
  const titleText = recipe.title.toLowerCase();
  const cuisineText = recipe.cuisine.toLowerCase();
  const recipeText = `${recipe.title} ${recipe.steps.join(" ")} ${recipe.grandmaTips.join(" ")}`.toLowerCase();
  if (grandmaText.includes("taste") || grandmaText.includes("season")) grandma += 10;
  if (grandmaText.includes("slow") || grandmaText.includes("aromatic")) grandma += 10;
  if (grandmaText.includes("serve") || grandmaText.includes("table")) grandma += 10;
  if (
    titleText.includes("family") ||
    titleText.includes("sunday") ||
    titleText.includes("village") ||
    titleText.includes("rustic")
  ) {
    grandma += 8;
  }
  if (titleText.includes("grandma kitchen skillet")) {
    grandma -= 12;
    notes.push("generic title");
  }

  const promptRegionalTokens = regionalTokens(prompt);
  if (promptRegionalTokens.length > 0 && !promptRegionalTokens.some((token) => recipeText.includes(token))) {
    realism -= 15;
    grandma -= 10;
    notes.push("regional cue missing");
  }

  const expectedAuthTokens = CUISINE_AUTH_TOKENS[cuisineText];
  if (expectedAuthTokens && expectedAuthTokens.length > 0) {
    const matches = expectedAuthTokens.filter((token) => recipeText.includes(token)).length;
    if (matches < 2) {
      realism -= 12;
      grandma -= 8;
      notes.push("authenticity_weak");
    } else if (matches >= 4) {
      grandma += 6;
    }
  }

  if (cuisineText.length > 2) {
    const promptText = prompt.toLowerCase();
    const cuisineMentions = ["italian", "mexican", "greek", "spanish", "french", "lebanese", "persian"].filter((cuisine) =>
      promptText.includes(cuisine),
    );
    if (cuisineMentions.length > 0 && !promptText.includes(cuisineText)) {
      realism -= 5;
      notes.push("cuisine mismatch risk");
    }
  }

  let speed = 85;
  const target = speedTarget(prompt);
  if (target !== null) {
    const diff = Math.abs(recipe.totalMinutes - target);
    speed = clamp(100 - diff * 2);
    if (diff > 15) notes.push("time misaligned with prompt");
  }

  structure = clamp(structure);
  realism = clamp(realism);
  grandma = clamp(grandma);
  speed = clamp(speed);

  const total = clamp(structure * 0.25 + realism * 0.3 + grandma * 0.3 + speed * 0.15);

  return {
    totalScore: round2(total),
    realismScore: round2(realism),
    structureScore: round2(structure),
    grandmaScore: round2(grandma),
    speedAlignmentScore: round2(speed),
    notes: notes.join(", "),
  };
}

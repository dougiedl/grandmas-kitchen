type MockRecipeInput = {
  personaName: string;
  cuisine: string;
  prompt: string;
};

export type MockRecipe = {
  title: string;
  cuisine: string;
  servings: number;
  totalMinutes: number;
  ingredients: Array<{ amount: string; item: string }>;
  steps: string[];
  grandmaTips: string[];
};

export function createMockRecipe({ personaName, cuisine, prompt }: MockRecipeInput): MockRecipe {
  const lowerPrompt = prompt.toLowerCase();
  const title = lowerPrompt.includes("soup")
    ? `${cuisine} Home Kitchen Soup`
    : `${cuisine} Grandma Night Skillet`;

  return {
    title,
    cuisine,
    servings: 4,
    totalMinutes: 40,
    ingredients: [
      { amount: "2 tbsp", item: "olive oil" },
      { amount: "1", item: "yellow onion, chopped" },
      { amount: "3 cloves", item: "garlic, minced" },
      { amount: "2 cups", item: "seasonal vegetables" },
      { amount: "1 can", item: "tomatoes or broth base" },
      { amount: "to taste", item: "salt and black pepper" },
    ],
    steps: [
      "Warm olive oil over medium heat and soften the onion for 6 to 8 minutes.",
      "Add garlic and cook until fragrant, about 30 seconds.",
      "Add vegetables and base ingredients, then simmer until tender.",
      "Taste and adjust seasoning, then rest for 2 minutes before serving.",
    ],
    grandmaTips: [
      `${personaName} says: season in small layers, not all at once.`,
      "If it tastes flat, add acidity first (lemon or vinegar) before extra salt.",
    ],
  };
}

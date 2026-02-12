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

type CuisineDefaults = {
  fat: string;
  acid: string;
  herb: string;
  garnish: string;
  pantryBase: string;
};

const CUISINE_DEFAULTS: Record<string, CuisineDefaults> = {
  italian: {
    fat: "olive oil",
    acid: "red wine vinegar",
    herb: "oregano",
    garnish: "parmesan and basil",
    pantryBase: "crushed tomatoes",
  },
  mexican: {
    fat: "neutral oil",
    acid: "lime juice",
    herb: "cilantro",
    garnish: "cilantro and queso fresco",
    pantryBase: "fire-roasted tomatoes",
  },
  greek: {
    fat: "olive oil",
    acid: "lemon juice",
    herb: "dried oregano",
    garnish: "feta and dill",
    pantryBase: "tomato and broth mix",
  },
  spanish: {
    fat: "olive oil",
    acid: "sherry vinegar",
    herb: "parsley",
    garnish: "parsley and paprika oil",
    pantryBase: "tomato sofrito",
  },
  default: {
    fat: "olive oil",
    acid: "lemon juice",
    herb: "mixed herbs",
    garnish: "fresh herbs",
    pantryBase: "tomatoes or broth",
  },
};

function hashString(input: string): number {
  let hash = 0;
  for (const char of input) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function detectProtein(prompt: string): string {
  if (hasAny(prompt, ["chicken", "thigh", "breast"])) return "chicken";
  if (hasAny(prompt, ["beef", "steak", "ground beef"])) return "beef";
  if (hasAny(prompt, ["pork", "sausage"])) return "pork";
  if (hasAny(prompt, ["shrimp", "fish", "salmon", "tuna"])) return "seafood";
  if (hasAny(prompt, ["lentil", "chickpea", "bean", "tofu"])) return "plant protein";
  if (hasAny(prompt, ["egg", "eggs"])) return "eggs";
  return "seasonal vegetables";
}

function detectStyle(prompt: string): "soup" | "pasta" | "stew" | "rice" | "sheet-pan" | "skillet" {
  if (hasAny(prompt, ["soup", "broth"])) return "soup";
  if (hasAny(prompt, ["pasta", "spaghetti", "noodle", "ravioli", "gravy"])) return "pasta";
  if (hasAny(prompt, ["stew", "braise", "slow", "comfort", "sunday"])) return "stew";
  if (hasAny(prompt, ["rice", "risotto", "paella"])) return "rice";
  if (hasAny(prompt, ["tray", "sheet", "roast"])) return "sheet-pan";
  return "skillet";
}

function titleFor(cuisine: string, style: ReturnType<typeof detectStyle>, protein: string): string {
  const cuisineLabel = cuisine || "Home";

  if (style === "soup") return `${cuisineLabel} Grandma Comfort Soup`;
  if (style === "pasta") return `${cuisineLabel} Sunday ${protein} Pasta`;
  if (style === "stew") return `${cuisineLabel} Slow-Simmer Family Stew`;
  if (style === "rice") return `${cuisineLabel} Hearthside Rice Pot`;
  if (style === "sheet-pan") return `${cuisineLabel} Rustic Sheet-Pan Supper`;
  return `${cuisineLabel} Grandma Kitchen Skillet`;
}

function minutesFor(style: ReturnType<typeof detectStyle>, prompt: string): number {
  if (hasAny(prompt, ["quick", "fast", "30", "weeknight"])) return 30;
  if (style === "stew") return 70;
  if (style === "soup") return 45;
  if (style === "sheet-pan") return 35;
  return 40;
}

function servingsFromPrompt(prompt: string): number {
  const match = prompt.match(/\b([2-9]|1\d)\s*(people|servings|portion|portions)\b/);
  if (!match) return 4;
  const num = Number.parseInt(match[1], 10);
  if (Number.isNaN(num)) return 4;
  return Math.max(1, Math.min(20, num));
}

function stepsFor(style: ReturnType<typeof detectStyle>, protein: string, defaults: CuisineDefaults): string[] {
  if (style === "soup") {
    return [
      `Warm ${defaults.fat} over medium heat and soften onions until translucent.`,
      `Add garlic, ${protein}, and cook until lightly browned and fragrant.`,
      `Add ${defaults.pantryBase}, water or stock, then simmer gently until flavors meld.`,
      `Finish with ${defaults.acid} and ${defaults.herb}, then rest 2 minutes before serving.`,
    ];
  }

  if (style === "pasta") {
    return [
      `Start a pot of salted water for pasta while warming ${defaults.fat} in a wide pan.`,
      `Cook onion, garlic, and ${protein} until the base is deeply aromatic.`,
      `Add ${defaults.pantryBase} and simmer until thickened, then fold in al dente pasta.`,
      `Finish with ${defaults.acid} and serve with ${defaults.garnish}.`,
    ];
  }

  if (style === "stew") {
    return [
      `Brown ${protein} in ${defaults.fat} to build flavor, then set aside.`,
      `Cook onion and garlic low and slow, scraping up browned bits.`,
      `Return ${protein}, add ${defaults.pantryBase} and enough liquid to cover, then simmer gently.`,
      `Adjust seasoning with ${defaults.acid} and ${defaults.herb}; rest before serving.`,
    ];
  }

  if (style === "rice") {
    return [
      `Warm ${defaults.fat} and saute onion, garlic, and ${protein} until aromatic.`,
      `Stir in rice and toast briefly so each grain is coated with fat.`,
      `Add ${defaults.pantryBase} and stock in batches, cooking until rice is tender.`,
      `Finish with ${defaults.acid} and top with ${defaults.garnish}.`,
    ];
  }

  if (style === "sheet-pan") {
    return [
      `Heat oven to 425F and toss vegetables and ${protein} with ${defaults.fat}, salt, and pepper.`,
      `Spread on a sheet pan so ingredients roast instead of steam.`,
      `Roast until browned and cooked through, turning once halfway.`,
      `Finish with ${defaults.acid}, ${defaults.herb}, and ${defaults.garnish}.`,
    ];
  }

  return [
    `Warm ${defaults.fat} and cook onion until soft and lightly golden.`,
    `Add garlic and ${protein}, then cook until well seasoned and aromatic.`,
    `Add ${defaults.pantryBase} and simmer until thick and glossy.`,
    `Balance with ${defaults.acid}, finish with ${defaults.garnish}, and serve warm.`,
  ];
}

export function createMockRecipe({ personaName, cuisine, prompt }: MockRecipeInput): MockRecipe {
  const lowerPrompt = prompt.toLowerCase();
  const cuisineKey = cuisine.toLowerCase();
  const defaults = CUISINE_DEFAULTS[cuisineKey] ?? CUISINE_DEFAULTS.default;
  const protein = detectProtein(lowerPrompt);
  const style = detectStyle(lowerPrompt);
  const hash = hashString(`${cuisine}|${prompt}`);

  const sideOptions = ["rustic bread", "simple salad", "roasted potatoes", "steamed greens"];
  const side = sideOptions[hash % sideOptions.length];
  const sweetnessAddOn = hash % 2 === 0 ? "a pinch of sugar" : "a small knob of butter";

  return {
    title: titleFor(cuisine, style, protein),
    cuisine,
    servings: servingsFromPrompt(lowerPrompt),
    totalMinutes: minutesFor(style, lowerPrompt),
    ingredients: [
      { amount: "2 tbsp", item: defaults.fat },
      { amount: "1", item: "yellow onion, chopped" },
      { amount: "3 cloves", item: "garlic, minced" },
      { amount: "2 cups", item: protein },
      { amount: "1.5 cups", item: defaults.pantryBase },
      { amount: "1 tsp", item: defaults.herb },
      { amount: "1 tbsp", item: defaults.acid },
      { amount: "to taste", item: `salt, black pepper, and ${sweetnessAddOn}` },
      { amount: "for serving", item: side },
    ],
    steps: stepsFor(style, protein, defaults),
    grandmaTips: [
      `${personaName} says: start with onions and salt so the whole pot has flavor from the first minute.`,
      `Taste before serving and adjust with ${defaults.acid} first, then salt if needed.`,
      `Serve with ${side} so nobody leaves the table hungry.`,
    ],
  };
}

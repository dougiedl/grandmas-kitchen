type MockRecipeInput = {
  personaName: string;
  cuisine: string;
  prompt: string;
  regionalStyle?: string;
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

type CuisineMemory = {
  displayName: string;
  fat: string;
  acid: string;
  herbs: string;
  aromatics: string;
  pantryBase: string;
  finish: string;
  technique: string;
  familyLine: string;
  signatureTitles: {
    pasta: string[];
    soup: string[];
    stew: string[];
    rice: string[];
    sheetPan: string[];
    skillet: string[];
  };
};

type RecipeStyle = "soup" | "pasta" | "stew" | "rice" | "sheet-pan" | "skillet";

const CUISINE_MEMORY: Record<string, CuisineMemory> = {
  italian: {
    displayName: "Italian",
    fat: "extra-virgin olive oil",
    acid: "red wine vinegar",
    herbs: "oregano and basil",
    aromatics: "onion and garlic",
    pantryBase: "crushed San Marzano-style tomatoes",
    finish: "parmigiano and torn basil",
    technique: "build the soffritto slowly before adding tomatoes",
    familyLine: "Sunday gravy patience and weeknight practicality",
    signatureTitles: {
      pasta: ["Sunday Gravy Spaghetti", "Rustic Ragu Rigatoni", "Nonna Pantry Pasta"],
      soup: ["Tuscan White Bean Soup", "Garden Minestra", "Ribollita-Style Comfort Soup"],
      stew: ["Slow-Simmer Cacciatore", "Braised Family Meatball Pot", "Sunday Market Stew"],
      rice: ["Creamy Weeknight Risotto", "Tomato Rice Pot", "Nonna Rice and Greens"],
      sheetPan: ["Roasted Chicken and Peppers", "Rustic Sausage Tray Bake", "Herbed Family Sheet Pan"],
      skillet: ["Skillet Sugo Supper", "Pantry Polpetta Skillet", "Garlic Herb Family Skillet"],
    },
  },
  mexican: {
    displayName: "Mexican",
    fat: "neutral oil or lard",
    acid: "fresh lime juice",
    herbs: "cilantro and oregano",
    aromatics: "white onion and garlic",
    pantryBase: "toasted tomato-chile base",
    finish: "cilantro, crema, and crumbled queso fresco",
    technique: "toast chiles and spices before blending for depth",
    familyLine: "slow layered flavor with generous table food",
    signatureTitles: {
      pasta: ["Sopa Seca Roja", "Chile Tomato Noodle Cazuela", "Abuelita Pantry Fideos"],
      soup: ["Caldo de Casa", "Pozole-Style Pantry Soup", "Frijol and Vegetable Broth"],
      stew: ["Chile Braised Family Pot", "Weeknight Tinga-Style Stew", "Abuelita Comfort Guisado"],
      rice: ["Arroz Rojo de Casa", "One-Pot Tomato Rice", "Cilantro Lime Family Rice"],
      sheetPan: ["Roasted Pollo con Papas", "Sheet-Pan Fajita Supper", "Chile Lime Family Tray"],
      skillet: ["Comal Skillet Supper", "Quick Picadillo-Style Pan", "Abuelita Home Skillet"],
    },
  },
  greek: {
    displayName: "Greek",
    fat: "olive oil",
    acid: "fresh lemon juice",
    herbs: "oregano and dill",
    aromatics: "onion and garlic",
    pantryBase: "tomato and stock",
    finish: "feta, olives, and fresh herbs",
    technique: "season in layers and brighten at the end with lemon",
    familyLine: "big Sunday platters and bright coastal flavors",
    signatureTitles: {
      pasta: ["Lemon Herb Orzo", "Yiayia Tomato Pasta", "Village Pantry Noodles"],
      soup: ["Fasolada-Style Soup", "Lemon Chicken Broth", "Village Lentil Soup"],
      stew: ["Rustic Stifado-Style Pot", "Braised Herb Chicken", "Yiayia Sunday Stew"],
      rice: ["Herbed Rice Pilafi", "Lemony Rice Pot", "Tomato Dill Rice"],
      sheetPan: ["Lemon Oregano Chicken Pan", "Village Sheet-Pan Potatoes", "Olive Oil Family Tray"],
      skillet: ["Skillet Spanakopita-Inspired Supper", "Herb Tomato Pan", "Yiayia Night Skillet"],
    },
  },
  spanish: {
    displayName: "Spanish",
    fat: "olive oil",
    acid: "sherry vinegar",
    herbs: "parsley and thyme",
    aromatics: "onion, garlic, and sweet paprika",
    pantryBase: "sofrito",
    finish: "parsley, olive oil, and smoked paprika",
    technique: "cook sofrito until sweet before adding broth or rice",
    familyLine: "rustic pantry classics with saffron warmth",
    signatureTitles: {
      pasta: ["Sofrito Noodle Cazuela", "Sunday Pantry Pasta", "Abuela Tomato Fideos"],
      soup: ["Cocido-Style Vegetable Soup", "Garlicky Bean Broth", "Abuela Winter Soup"],
      stew: ["Rustic Cocido Pot", "Saffron Family Stew", "Paprika Braised Supper"],
      rice: ["Weeknight Paella-Style Rice", "Sofrito Rice Pan", "Abuela Arroz de Casa"],
      sheetPan: ["Roasted Paprika Chicken", "Olive Oil Potato Tray", "Spanish Family Sheet Pan"],
      skillet: ["Tortilla-Inspired Skillet", "Sofrito Family Pan", "Abuela Rustic Skillet"],
    },
  },
  french: {
    displayName: "French",
    fat: "butter and olive oil",
    acid: "white wine vinegar",
    herbs: "thyme and parsley",
    aromatics: "shallot, onion, and garlic",
    pantryBase: "tomato and stock reduction",
    finish: "fresh herbs and a small knob of butter",
    technique: "sweat aromatics gently, then reduce for concentration",
    familyLine: "comforting bistro home cooking with restraint",
    signatureTitles: {
      pasta: ["Provencal Family Pasta", "Market Herb Noodles", "Sunday Tomato Tagliatelle"],
      soup: ["Country Vegetable Potage", "Herb Lentil Soup", "Mamie Comfort Broth"],
      stew: ["Coq-au-Vin-Inspired Stew", "Sunday Braised Chicken", "Rustic Village Ragout"],
      rice: ["Herbed French Rice Pot", "Tomato Thyme Pilaf", "Family Weeknight Rice"],
      sheetPan: ["Herb Roasted Chicken Tray", "Provencal Vegetable Pan", "Rustic Bistro Sheet Pan"],
      skillet: ["Shallot Butter Skillet", "Country Chicken Pan", "Mamie Weeknight Skillet"],
    },
  },
  lebanese: {
    displayName: "Lebanese",
    fat: "olive oil",
    acid: "lemon juice",
    herbs: "mint and parsley",
    aromatics: "onion, garlic, and warm spices",
    pantryBase: "tomato, stock, and cinnamon-spice blend",
    finish: "fresh herbs and toasted nuts",
    technique: "build warm spice aroma first, then simmer gently",
    familyLine: "mezze generosity and mountain village warmth",
    signatureTitles: {
      pasta: ["Lebanese-Style Vermicelli Pasta", "Lemon Herb Family Noodles", "Village Pantry Pasta"],
      soup: ["Lentil Lemon Village Soup", "Chickpea Herb Broth", "Teta Comfort Soup"],
      stew: ["Home Kifta-Inspired Stew", "Tomato Chickpea Family Pot", "Village Braised Supper"],
      rice: ["Spiced Vermicelli Rice", "Lemon Herb Rice Pot", "Family Rice and Chickpeas"],
      sheetPan: ["Sumac Chicken Tray", "Village Roasted Potatoes", "Lebanese Family Sheet Pan"],
      skillet: ["Skillet Kifta-Inspired Supper", "Warm Spice Family Pan", "Teta Night Skillet"],
    },
  },
  persian: {
    displayName: "Persian",
    fat: "ghee or neutral oil",
    acid: "lemon juice or mild verjuice-style acid",
    herbs: "parsley, cilantro, and dried fenugreek-style herbs",
    aromatics: "onion, garlic, and turmeric",
    pantryBase: "tomato paste, saffron water, and stock",
    finish: "saffron, herbs, and optional barberries",
    technique: "brown onions patiently and bloom turmeric before adding liquids",
    familyLine: "rice-and-stew table comfort with sweet-sour balance",
    signatureTitles: {
      pasta: ["Persian Pantry Noodles", "Saffron Herb Family Pasta", "Maman Weeknight Noodles"],
      soup: ["Aromatic Lentil Soup", "Herb and Bean Persian Soup", "Maman Comfort Broth"],
      stew: ["Ghormeh-Inspired Family Stew", "Walnut Pomegranate Pot", "Maman Sunday Stew"],
      rice: ["Saffron Family Rice Pot", "Tahdig-Inspired Rice Supper", "Herb Rice and Beans"],
      sheetPan: ["Saffron Chicken Tray", "Roasted Vegetable Persian Pan", "Maman Sheet-Pan Supper"],
      skillet: ["Turmeric Onion Family Skillet", "Saffron Tomato Pan", "Maman Night Skillet"],
    },
  },
  default: {
    displayName: "Home Style",
    fat: "olive oil",
    acid: "lemon juice",
    herbs: "mixed herbs",
    aromatics: "onion and garlic",
    pantryBase: "tomatoes or broth",
    finish: "fresh herbs",
    technique: "build flavor in layers and taste often",
    familyLine: "comfort food that is easy to repeat",
    signatureTitles: {
      pasta: ["Family Pasta Night", "Home Pantry Noodles", "Comfort Tomato Pasta"],
      soup: ["Grandma Comfort Soup", "Pantry Vegetable Soup", "Warm Family Broth"],
      stew: ["Slow-Simmer Family Stew", "Cozy Braised Pot", "Sunday Comfort Stew"],
      rice: ["Hearthside Rice Pot", "Pantry Rice Supper", "Home Herb Rice"],
      sheetPan: ["Rustic Sheet-Pan Supper", "Family Roast Tray", "Weeknight Oven Supper"],
      skillet: ["Grandma Kitchen Skillet", "One-Pan Family Dinner", "Home Comfort Skillet"],
    },
  },
};

const INGREDIENT_ALIASES: Array<{ words: string[]; canonical: string; defaultAmount: string }> = [
  { words: ["chicken", "thigh", "breast"], canonical: "chicken", defaultAmount: "2 cups" },
  { words: ["ground beef", "beef", "steak"], canonical: "beef", defaultAmount: "2 cups" },
  { words: ["pork", "sausage"], canonical: "pork", defaultAmount: "2 cups" },
  { words: ["fish", "salmon", "tuna", "cod", "white fish"], canonical: "fish", defaultAmount: "2 cups" },
  { words: ["shrimp", "prawn"], canonical: "shrimp", defaultAmount: "2 cups" },
  { words: ["lentil", "lentils"], canonical: "lentils", defaultAmount: "1.5 cups" },
  { words: ["chickpea", "chickpeas", "garbanzo"], canonical: "chickpeas", defaultAmount: "1.5 cups" },
  { words: ["bean", "beans"], canonical: "beans", defaultAmount: "1.5 cups" },
  { words: ["egg", "eggs"], canonical: "eggs", defaultAmount: "4" },
  { words: ["rice"], canonical: "rice", defaultAmount: "1.5 cups" },
  { words: ["pasta", "spaghetti", "rigatoni", "orzo", "noodle", "fideos"], canonical: "pasta", defaultAmount: "12 oz" },
  { words: ["potato", "potatoes"], canonical: "potatoes", defaultAmount: "2 cups" },
  { words: ["tomato", "tomatoes"], canonical: "tomatoes", defaultAmount: "2 cups" },
  { words: ["pepper", "peppers", "chile", "chili"], canonical: "peppers", defaultAmount: "1 cup" },
  { words: ["zucchini"], canonical: "zucchini", defaultAmount: "1 cup" },
  { words: ["spinach"], canonical: "spinach", defaultAmount: "3 cups" },
  { words: ["mushroom", "mushrooms"], canonical: "mushrooms", defaultAmount: "1.5 cups" },
];

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

function detectStyle(prompt: string): RecipeStyle {
  if (hasAny(prompt, ["soup", "broth", "caldo", "potage"])) return "soup";
  if (hasAny(prompt, ["pasta", "spaghetti", "orzo", "noodle", "fideos", "gravy"])) return "pasta";
  if (hasAny(prompt, ["stew", "braise", "slow", "comfort", "sunday"])) return "stew";
  if (hasAny(prompt, ["rice", "risotto", "pilaf", "paella"])) return "rice";
  if (hasAny(prompt, ["tray", "sheet", "roast", "oven", "bake"])) return "sheet-pan";
  return "skillet";
}

function servingsFromPrompt(prompt: string): number {
  const match = prompt.match(/\b([2-9]|1\d)\s*(people|servings|portion|portions)\b/);
  if (!match) return 4;
  const parsed = Number.parseInt(match[1], 10);
  if (Number.isNaN(parsed)) return 4;
  return Math.max(1, Math.min(20, parsed));
}

function minutesFor(style: RecipeStyle, prompt: string): number {
  if (hasAny(prompt, ["quick", "fast", "30", "weeknight"])) return 30;
  if (style === "stew") return 75;
  if (style === "soup") return 50;
  if (style === "sheet-pan") return 40;
  if (style === "rice") return 45;
  return 35;
}

function pickFrom<T>(items: T[], hash: number): T {
  return items[hash % items.length];
}

function detectRequestedIngredients(prompt: string): Array<{ amount: string; item: string }> {
  const found: Array<{ amount: string; item: string }> = [];

  for (const alias of INGREDIENT_ALIASES) {
    if (alias.words.some((word) => prompt.includes(word))) {
      if (!found.some((item) => item.item === alias.canonical)) {
        found.push({ amount: alias.defaultAmount, item: alias.canonical });
      }
    }
  }

  return found.slice(0, 5);
}

function titleFor(style: RecipeStyle, memory: CuisineMemory, hash: number): string {
  if (style === "soup") return pickFrom(memory.signatureTitles.soup, hash);
  if (style === "pasta") return pickFrom(memory.signatureTitles.pasta, hash);
  if (style === "stew") return pickFrom(memory.signatureTitles.stew, hash);
  if (style === "rice") return pickFrom(memory.signatureTitles.rice, hash);
  if (style === "sheet-pan") return pickFrom(memory.signatureTitles.sheetPan, hash);
  return pickFrom(memory.signatureTitles.skillet, hash);
}

function stepsFor(style: RecipeStyle, memory: CuisineMemory, proteinOrBase: string): string[] {
  if (style === "soup") {
    return [
      `Warm ${memory.fat} and cook ${memory.aromatics} gently for 8 to 10 minutes; do not rush this base.`,
      `Add ${proteinOrBase}, season lightly, and cook until aromatic, then stir in ${memory.pantryBase}.`,
      "Add broth, bring to a gentle simmer, and cook until everything is tender and cohesive.",
      `Finish with ${memory.acid}, ${memory.herbs}, and ${memory.finish} before serving.`,
    ];
  }

  if (style === "pasta") {
    return [
      "Boil well-salted water for pasta while you build the sauce in a wide pan.",
      `Cook ${memory.aromatics} in ${memory.fat}, then add ${proteinOrBase} and season to build depth.`,
      `Stir in ${memory.pantryBase} and simmer until thick, then toss in pasta and a splash of pasta water.`,
      `Finish with ${memory.acid}, ${memory.herbs}, and ${memory.finish}.`,
    ];
  }

  if (style === "stew") {
    return [
      `Brown ${proteinOrBase} in ${memory.fat}, then remove to keep the fond in the pot.`,
      `Cook ${memory.aromatics} low and slow, scraping the pot to capture every bit of flavor.`,
      `Return ${proteinOrBase}, add ${memory.pantryBase} and stock, then simmer gently until rich and tender.`,
      `Adjust with ${memory.acid}, then finish with ${memory.herbs} and ${memory.finish}.`,
    ];
  }

  if (style === "rice") {
    return [
      `Cook ${memory.aromatics} in ${memory.fat} until soft and fragrant, then add ${proteinOrBase}.`,
      "Toast the rice in the pot for 1 to 2 minutes to coat each grain.",
      `Add ${memory.pantryBase} and hot stock in stages, simmering until the rice is tender.`,
      `Finish with ${memory.acid}, ${memory.herbs}, and ${memory.finish}.`,
    ];
  }

  if (style === "sheet-pan") {
    return [
      "Heat oven to 425F and line a tray for easy cleanup.",
      `Toss ${proteinOrBase} and vegetables with ${memory.fat}, salt, and pepper; spread in one layer.`,
      "Roast until browned and cooked through, turning once halfway.",
      `Finish with ${memory.acid}, ${memory.herbs}, and ${memory.finish}.`,
    ];
  }

  return [
    `Warm ${memory.fat} and cook ${memory.aromatics} until soft, sweet, and deeply fragrant.`,
    `Add ${proteinOrBase}, season well, and cook until lightly browned.`,
    `Stir in ${memory.pantryBase} and simmer until glossy and balanced.`,
    `Taste and adjust with ${memory.acid}; finish with ${memory.herbs} and ${memory.finish}.`,
  ];
}

function normalizeCuisineKey(cuisine: string): string {
  const key = cuisine.trim().toLowerCase();
  if (key.includes("ital")) return "italian";
  if (key.includes("mex")) return "mexican";
  if (key.includes("greek")) return "greek";
  if (key.includes("span")) return "spanish";
  if (key.includes("french")) return "french";
  if (key.includes("leban")) return "lebanese";
  if (key.includes("pers")) return "persian";
  if (key.includes("chin")) return "chinese";
  if (key.includes("ind")) return "indian";
  if (key.includes("japan")) return "japanese";
  if (key.includes("jama")) return "jamaican";
  return key;
}

function applyRegionalProfile(memory: CuisineMemory, cuisineKey: string, regionalStyle?: string): CuisineMemory {
  if (!regionalStyle) {
    return memory;
  }

  const style = regionalStyle.toLowerCase();

  if (cuisineKey === "italian" && style.includes("sicilian")) {
    return {
      ...memory,
      pantryBase: "tomatoes, anchovy, and caper base",
      herbs: "oregano, parsley, and basil",
      finish: "toasted breadcrumbs and basil",
      familyLine: "bold sweet-sour balance and pantry seafood accents",
    };
  }

  if (cuisineKey === "italian" && style.includes("neapolitan")) {
    return {
      ...memory,
      pantryBase: "slow-cooked tomato passata",
      herbs: "basil and oregano",
      finish: "parmigiano and basil",
      familyLine: "Naples-style tomato depth and restrained ingredient lists",
    };
  }

  if (cuisineKey === "italian" && (style.includes("new york") || style.includes("italian-american"))) {
    return {
      ...memory,
      pantryBase: "garlic-forward tomato gravy",
      herbs: "oregano and parsley",
      finish: "pecorino and fresh parsley",
      familyLine: "red-sauce Sunday comfort with generous portions",
    };
  }

  if (cuisineKey === "mexican" && style.includes("oax")) {
    return {
      ...memory,
      pantryBase: "toasted chile-tomato base with warm spices",
      finish: "cilantro, lime, and crumbled queso",
      familyLine: "deep chile layering and earthy, slow-built flavor",
    };
  }

  if (cuisineKey === "spanish" && style.includes("valenc")) {
    return {
      ...memory,
      pantryBase: "saffron sofrito and broth base",
      finish: "olive oil and parsley",
      familyLine: "Valencian rice tradition with saffron warmth",
    };
  }

  return memory;
}

export function createMockRecipe({ personaName, cuisine, prompt, regionalStyle }: MockRecipeInput): MockRecipe {
  const lowerPrompt = prompt.toLowerCase();
  const style = detectStyle(lowerPrompt);
  const cuisineKey = normalizeCuisineKey(cuisine);
  const memoryBase = CUISINE_MEMORY[cuisineKey] ?? CUISINE_MEMORY.default;
  const memory = applyRegionalProfile(memoryBase, cuisineKey, regionalStyle);
  const hash = hashString(`${memory.displayName}|${prompt}`);

  const requested = detectRequestedIngredients(lowerPrompt);
  const hasPastaMention = requested.some((item) => item.item === "pasta");
  const hasRiceMention = requested.some((item) => item.item === "rice");
  const coreItem =
    requested.find((item) => !["pasta", "rice", "tomatoes"].includes(item.item))?.item ??
    (hasPastaMention ? "pasta" : hasRiceMention ? "rice" : "seasonal vegetables");

  const ingredients: Array<{ amount: string; item: string }> = [
    { amount: "2 tbsp", item: memory.fat },
    { amount: "1 cup", item: memory.aromatics },
  ];

  for (const item of requested) {
    if (!ingredients.some((entry) => entry.item === item.item)) {
      ingredients.push(item);
    }
  }

  const defaults = [
    { amount: "1.5 cups", item: memory.pantryBase },
    { amount: "1 tbsp", item: memory.acid },
    { amount: "1 tsp", item: memory.herbs },
    { amount: "to taste", item: "salt and black pepper" },
    { amount: "for serving", item: memory.finish },
  ];

  for (const item of defaults) {
    if (!ingredients.some((entry) => entry.item === item.item)) {
      ingredients.push(item);
    }
  }

  if (style === "pasta" && !ingredients.some((item) => item.item === "pasta")) {
    ingredients.splice(2, 0, { amount: "12 oz", item: "pasta" });
  }

  if (style === "rice" && !ingredients.some((item) => item.item === "rice")) {
    ingredients.splice(2, 0, { amount: "1.5 cups", item: "rice" });
  }

  return {
    title: titleFor(style, memory, hash),
    cuisine: memory.displayName,
    servings: servingsFromPrompt(lowerPrompt),
    totalMinutes: minutesFor(style, lowerPrompt),
    ingredients: ingredients.slice(0, 14),
    steps: stepsFor(style, memory, coreItem),
    grandmaTips: [
      regionalStyle ? `Regional note: leaning ${regionalStyle} for familiar family flavor cues.` : `Regional note: classic ${memory.displayName} home-style profile.`,
      `${personaName} says: ${memory.technique}.`,
      `Taste near the end and correct with ${memory.acid} before adding extra salt.`,
      `Cook and serve family-style: ${memory.familyLine}.`,
    ],
  };
}

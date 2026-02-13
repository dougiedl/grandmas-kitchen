export type BaselineCase = {
  slug: string;
  cuisine:
    | "Italian"
    | "Mexican"
    | "Greek"
    | "Spanish"
    | "French"
    | "Lebanese"
    | "Persian"
    | "Chinese"
    | "Indian"
    | "Japanese"
    | "Jamaican"
    | "Russian"
    | "Puerto Rican"
    | "Dominican"
    | "Korean"
    | "Filipino"
    | "Jewish"
    | "West African";
  personaName: string;
  prompt: string;
  tags: string[];
};

export const BASELINE_CASES: BaselineCase[] = [
  {
    slug: "it-weeknight-chicken",
    cuisine: "Italian",
    personaName: "Nonna Rosa",
    prompt: "I have chicken thighs, tomatoes, garlic, and onion. Need a 30-minute weeknight dinner.",
    tags: ["weeknight", "protein", "time-bound"],
  },
  {
    slug: "it-sunday-gravy",
    cuisine: "Italian",
    personaName: "Nonna Rosa",
    prompt: "I want a Sunday gravy-style comfort dinner for 6 that feels nostalgic. My grandma was Sicilian.",
    tags: ["sunday", "comfort", "batch", "regional-sicilian"],
  },
  {
    slug: "mx-veg-comfort",
    cuisine: "Mexican",
    personaName: "Abuelita Carmen",
    prompt: "Make a vegetarian comfort meal with beans, corn, and peppers.",
    tags: ["vegetarian", "comfort"],
  },
  {
    slug: "mx-spice-balance",
    cuisine: "Mexican",
    personaName: "Abuelita Carmen",
    prompt: "I like deep flavor but mild heat. Pantry has tomatoes, onion, garlic, rice.",
    tags: ["mild", "spice-control"],
  },
  {
    slug: "gr-quick-fish",
    cuisine: "Greek",
    personaName: "Yiayia Eleni",
    prompt: "I have white fish, lemon, olive oil, and herbs. Need a quick dinner.",
    tags: ["seafood", "quick"],
  },
  {
    slug: "gr-hearty-lentils",
    cuisine: "Greek",
    personaName: "Yiayia Eleni",
    prompt: "Give me a hearty lentil dish for a rainy night and leftovers.",
    tags: ["lentils", "leftovers", "comfort"],
  },
  {
    slug: "es-rice-pan",
    cuisine: "Spanish",
    personaName: "Abuela Lucia",
    prompt: "I have rice, chicken, peas, paprika, and garlic. I want a one-pan dinner.",
    tags: ["rice", "one-pan"],
  },
  {
    slug: "es-budget",
    cuisine: "Spanish",
    personaName: "Abuela Lucia",
    prompt: "Budget-friendly dinner with potatoes, eggs, onion, and pantry staples.",
    tags: ["budget", "pantry"],
  },
  {
    slug: "it-kid-friendly",
    cuisine: "Italian",
    personaName: "Nonna Rosa",
    prompt: "Need kid-friendly dinner with pasta and ground beef, not spicy. Lean Neapolitan.",
    tags: ["kid-friendly", "pasta", "regional-neapolitan"],
  },
  {
    slug: "mx-leftover-rice",
    cuisine: "Mexican",
    personaName: "Abuelita Carmen",
    prompt: "I have leftover rice and eggs. Make something quick and comforting.",
    tags: ["leftovers", "quick"],
  },
  {
    slug: "gr-sheet-pan",
    cuisine: "Greek",
    personaName: "Yiayia Eleni",
    prompt: "Create a sheet-pan dinner with chicken, potatoes, lemon, oregano.",
    tags: ["sheet-pan", "weeknight"],
  },
  {
    slug: "es-soup",
    cuisine: "Spanish",
    personaName: "Abuela Lucia",
    prompt: "I want a warm soup with beans and vegetables for 4 people.",
    tags: ["soup", "vegetables"],
  },
  {
    slug: "it-ny-red-sauce",
    cuisine: "Italian",
    personaName: "Nonna Rosa",
    prompt: "Italian-American from New York style red-sauce comfort with meatballs and Sunday table energy.",
    tags: ["regional-italian-american", "comfort", "sunday"],
  },
  {
    slug: "fr-rustic-chicken",
    cuisine: "French",
    personaName: "Mamie Colette",
    prompt: "Rustic French-style chicken and vegetables for a cozy Sunday dinner.",
    tags: ["french", "comfort", "sunday"],
  },
  {
    slug: "lb-lentil-comfort",
    cuisine: "Lebanese",
    personaName: "Teta Miriam",
    prompt: "Lebanese comfort meal with lentils, lemon, garlic, and herbs.",
    tags: ["lebanese", "comfort", "lentils"],
  },
  {
    slug: "ir-saffron-rice",
    cuisine: "Persian",
    personaName: "Maman Parisa",
    prompt: "Persian-inspired saffron rice dinner with chicken and herbs, family style.",
    tags: ["persian", "saffron", "family-style"],
  },
  {
    slug: "ru-dumpling-comfort",
    cuisine: "Russian",
    personaName: "Babushka Anya",
    prompt: "My babushka made pelmeni. I want a comforting dumpling dinner with broth.",
    tags: ["russian", "dumpling", "comfort"],
  },
  {
    slug: "pr-sofrito-sunday",
    cuisine: "Puerto Rican",
    personaName: "Abuela Marisol",
    prompt: "Puerto Rican Sunday comfort with arroz con gandules and pollo guisado vibes.",
    tags: ["puerto-rican", "sofrito", "sunday"],
  },
  {
    slug: "do-sancocho-family",
    cuisine: "Dominican",
    personaName: "Abuela Yolanda",
    prompt: "Dominican family comfort like sancocho for a rainy day.",
    tags: ["dominican", "sancocho", "comfort"],
  },
  {
    slug: "kr-jjigae-weeknight",
    cuisine: "Korean",
    personaName: "Halmeoni Soon",
    prompt: "I want a Korean kimchi jjigae style weeknight dinner with rice.",
    tags: ["korean", "jjigae", "weeknight"],
  },
  {
    slug: "ph-adobo-home",
    cuisine: "Filipino",
    personaName: "Lola Maria",
    prompt: "Filipino adobo home-style dinner with garlic rice comfort.",
    tags: ["filipino", "adobo", "comfort"],
  },
  {
    slug: "jw-brisket-comfort",
    cuisine: "Jewish",
    personaName: "Bubbe Rivka",
    prompt: "Jewish family-style brisket comfort dinner with soup-first energy.",
    tags: ["jewish", "brisket", "comfort"],
  },
  {
    slug: "wa-jollof-pot",
    cuisine: "West African",
    personaName: "Mama Efua",
    prompt: "West African jollof-style family pot dinner with pepper depth.",
    tags: ["west-african", "jollof", "comfort"],
  },
];

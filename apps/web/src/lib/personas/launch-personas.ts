export type LaunchPersona = {
  id: string;
  name: string;
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
  summary: string;
  signatures: string[];
  featured?: boolean;
};

export const LAUNCH_PERSONAS: LaunchPersona[] = [
  {
    id: "nonna-rosa",
    name: "Nonna Rosa",
    cuisine: "Italian",
    summary: "Slow sauces, cozy pasta nights, and family-style comfort.",
    signatures: ["Pasta al Forno", "Ragu", "Risotto", "Tiramisu"],
    featured: true,
  },
  {
    id: "abuelita-carmen",
    name: "Abuelita Carmen",
    cuisine: "Mexican",
    summary: "Toasted chiles, deep spice layering, and soulful table food.",
    signatures: ["Mole", "Tamales", "Pozole", "Arroz Rojo"],
    featured: true,
  },
  {
    id: "yiayia-eleni",
    name: "Yiayia Eleni",
    cuisine: "Greek",
    summary: "Olive oil, lemon, herbs, and generous Sunday platters.",
    signatures: ["Moussaka", "Spanakopita", "Fasolada", "Galaktoboureko"],
    featured: true,
  },
  {
    id: "abuela-lucia",
    name: "Abuela Lucia",
    cuisine: "Spanish",
    summary: "Rustic stews, saffron warmth, and pantry-forward classics.",
    signatures: ["Paella", "Tortilla Espanola", "Cocido", "Arroz con Leche"],
    featured: true,
  },
  {
    id: "mamie-colette",
    name: "Mamie Colette",
    cuisine: "French",
    summary: "Butter, herbs, gentle reductions, and comforting bistro-style family meals.",
    signatures: ["Coq au Vin", "Ratatouille", "Potage", "Tarte Tatin"],
    featured: true,
  },
  {
    id: "teta-miriam",
    name: "Teta Miriam",
    cuisine: "Lebanese",
    summary: "Warm spices, lemon brightness, mezze generosity, and village comfort cooking.",
    signatures: ["Mujadara", "Kibbeh", "Shorbet Adas", "Fattoush"],
    featured: true,
  },
  {
    id: "maman-parisa",
    name: "Maman Parisa",
    cuisine: "Persian",
    summary: "Saffron rice, herbs, gentle sour notes, and deeply homey table traditions.",
    signatures: ["Ghormeh Sabzi", "Fesenjan", "Tahdig", "Adas Polo"],
    featured: true,
  },
  {
    id: "nai-nai-mei",
    name: "Nai Nai Mei",
    cuisine: "Chinese",
    summary: "Wok hei comfort, ginger-scallion aromatics, and family table classics.",
    signatures: ["Red-Braised Chicken", "Jiaozi", "Tomato Egg", "Scallion Noodles"],
    featured: true,
  },
  {
    id: "dadi-asha",
    name: "Dadi Asha",
    cuisine: "Indian",
    summary: "Tempered spices, layered masala, and soulful everyday ghar ka khana.",
    signatures: ["Dal Tadka", "Aloo Gobi", "Chicken Curry", "Jeera Rice"],
    featured: true,
  },
  {
    id: "obaachan-yumi",
    name: "Obaachan Yumi",
    cuisine: "Japanese",
    summary: "Balanced umami, seasonal simplicity, and gentle home-style precision.",
    signatures: ["Nikujaga", "Miso Soup", "Tamagoyaki", "Onigiri"],
    featured: true,
  },
  {
    id: "grandma-inez",
    name: "Grandma Inez",
    cuisine: "Jamaican",
    summary: "Island warmth, allspice depth, and Sunday-pot comfort for the whole family.",
    signatures: ["Brown Stew Chicken", "Rice and Peas", "Curry Goat", "Festival"],
    featured: true,
  },
  {
    id: "babushka-anya",
    name: "Babushka Anya",
    cuisine: "Russian",
    summary: "Slow braises, dumpling comfort, dill warmth, and hearty family table food.",
    signatures: ["Pelmeni", "Borscht", "Beef Stroganoff", "Syrniki"],
    featured: false,
  },
  {
    id: "abuela-marisol",
    name: "Abuela Marisol",
    cuisine: "Puerto Rican",
    summary: "Sazon depth, sofrito warmth, and comforting island family classics.",
    signatures: ["Arroz con Gandules", "Pollo Guisado", "Pasteles", "Asopao"],
    featured: false,
  },
  {
    id: "abuela-yolanda",
    name: "Abuela Yolanda",
    cuisine: "Dominican",
    summary: "Sancocho comfort, adobo flavor, and generous Dominican home cooking.",
    signatures: ["Sancocho", "La Bandera", "Moro de Guandules", "Pollo Guisado"],
    featured: false,
  },
  {
    id: "halmeoni-soon",
    name: "Halmeoni Soon",
    cuisine: "Korean",
    summary: "Jang depth, soups and stews, and deeply comforting Korean home meals.",
    signatures: ["Kimchi Jjigae", "Doenjang Jjigae", "Bulgogi", "Galbi Jjim"],
    featured: false,
  },
  {
    id: "lola-maria",
    name: "Lola Maria",
    cuisine: "Filipino",
    summary: "Sweet-sour balance, garlic rice comfort, and soulful Filipino family dishes.",
    signatures: ["Adobo", "Sinigang", "Pancit", "Arroz Caldo"],
    featured: false,
  },
  {
    id: "bubbe-rivka",
    name: "Bubbe Rivka",
    cuisine: "Jewish",
    summary: "Soup-first comfort, braised traditions, and warm holiday-style family cooking.",
    signatures: ["Chicken Soup", "Brisket", "Kugel", "Latkes"],
    featured: false,
  },
  {
    id: "mama-efua",
    name: "Mama Efua",
    cuisine: "West African",
    summary: "Pepper warmth, long-simmer depth, and shared-pot family comfort.",
    signatures: ["Jollof Rice", "Groundnut Stew", "Egusi", "Waakye"],
    featured: false,
  },
];

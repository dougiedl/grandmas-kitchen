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
    | "Jamaican";
  summary: string;
  signatures: string[];
};

export const LAUNCH_PERSONAS: LaunchPersona[] = [
  {
    id: "nonna-rosa",
    name: "Nonna Rosa",
    cuisine: "Italian",
    summary: "Slow sauces, cozy pasta nights, and family-style comfort.",
    signatures: ["Pasta al Forno", "Ragu", "Risotto", "Tiramisu"],
  },
  {
    id: "abuelita-carmen",
    name: "Abuelita Carmen",
    cuisine: "Mexican",
    summary: "Toasted chiles, deep spice layering, and soulful table food.",
    signatures: ["Mole", "Tamales", "Pozole", "Arroz Rojo"],
  },
  {
    id: "yiayia-eleni",
    name: "Yiayia Eleni",
    cuisine: "Greek",
    summary: "Olive oil, lemon, herbs, and generous Sunday platters.",
    signatures: ["Moussaka", "Spanakopita", "Fasolada", "Galaktoboureko"],
  },
  {
    id: "abuela-lucia",
    name: "Abuela Lucia",
    cuisine: "Spanish",
    summary: "Rustic stews, saffron warmth, and pantry-forward classics.",
    signatures: ["Paella", "Tortilla Espanola", "Cocido", "Arroz con Leche"],
  },
  {
    id: "mamie-colette",
    name: "Mamie Colette",
    cuisine: "French",
    summary: "Butter, herbs, gentle reductions, and comforting bistro-style family meals.",
    signatures: ["Coq au Vin", "Ratatouille", "Potage", "Tarte Tatin"],
  },
  {
    id: "teta-miriam",
    name: "Teta Miriam",
    cuisine: "Lebanese",
    summary: "Warm spices, lemon brightness, mezze generosity, and village comfort cooking.",
    signatures: ["Mujadara", "Kibbeh", "Shorbet Adas", "Fattoush"],
  },
  {
    id: "maman-parisa",
    name: "Maman Parisa",
    cuisine: "Persian",
    summary: "Saffron rice, herbs, gentle sour notes, and deeply homey table traditions.",
    signatures: ["Ghormeh Sabzi", "Fesenjan", "Tahdig", "Adas Polo"],
  },
  {
    id: "nai-nai-mei",
    name: "Nai Nai Mei",
    cuisine: "Chinese",
    summary: "Wok hei comfort, ginger-scallion aromatics, and family table classics.",
    signatures: ["Red-Braised Chicken", "Jiaozi", "Tomato Egg", "Scallion Noodles"],
  },
  {
    id: "dadi-asha",
    name: "Dadi Asha",
    cuisine: "Indian",
    summary: "Tempered spices, layered masala, and soulful everyday ghar ka khana.",
    signatures: ["Dal Tadka", "Aloo Gobi", "Chicken Curry", "Jeera Rice"],
  },
  {
    id: "obaachan-yumi",
    name: "Obaachan Yumi",
    cuisine: "Japanese",
    summary: "Balanced umami, seasonal simplicity, and gentle home-style precision.",
    signatures: ["Nikujaga", "Miso Soup", "Tamagoyaki", "Onigiri"],
  },
  {
    id: "grandma-inez",
    name: "Grandma Inez",
    cuisine: "Jamaican",
    summary: "Island warmth, allspice depth, and Sunday-pot comfort for the whole family.",
    signatures: ["Brown Stew Chicken", "Rice and Peas", "Curry Goat", "Festival"],
  },
];

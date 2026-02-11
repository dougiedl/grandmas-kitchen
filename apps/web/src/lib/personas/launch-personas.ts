export type LaunchPersona = {
  id: string;
  name: string;
  cuisine: "Italian" | "Mexican" | "Greek" | "Spanish";
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
];

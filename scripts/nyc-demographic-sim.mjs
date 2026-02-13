#!/usr/bin/env node

const BASELINE_SUPPORTED = new Set([
  "Italian",
  "Mexican",
  "Greek",
  "Spanish",
  "French",
  "Lebanese",
  "Persian",
  "Chinese",
  "Indian",
  "Japanese",
  "Jamaican",
]);

const EXPANDED_SUPPORTED = new Set([
  ...BASELINE_SUPPORTED,
  "Russian",
  "Puerto Rican",
  "Dominican",
  "Korean",
  "Filipino",
  "Jewish",
  "West African",
]);

const NYC_CASES = [
  { id: "it-nonna-sunday", expected: "Italian", prompt: "I miss my nonna's sunday fish with garlic and tomatoes." },
  { id: "mx-abuelita-mole", expected: "Mexican", prompt: "My abuelita made mole on Sundays. Can you help?" },
  { id: "es-abuela-paella", expected: "Spanish", prompt: "Miss mi abuela's paella and saffron rice." },
  { id: "gr-yiayia-stew", expected: "Greek", prompt: "I want yiayia-style lemony stew and potatoes." },
  { id: "fr-mamie-rustic", expected: "French", prompt: "Mamie used to make rustic chicken pot style dinners." },
  { id: "lb-teta-lentils", expected: "Lebanese", prompt: "Teta comfort with lentils, lemon, and warm spices." },
  { id: "ir-maman-fesenjan", expected: "Persian", prompt: "Maman's fesenjan and saffron rice style meal." },
  { id: "cn-nai-nai-dumpling", expected: "Chinese", prompt: "Nai nai dumpling soup comfort, garlic vinegar side." },
  { id: "in-dadi-dal", expected: "Indian", prompt: "Dadi's dal with tadka and cumin rice comfort." },
  { id: "jp-obaachan-soup", expected: "Japanese", prompt: "Obaachan style miso soup and rice set meal." },
  { id: "jm-jerk-comfort", expected: "Jamaican", prompt: "My grandma's jerk chicken with rice and peas." },
  { id: "ru-babushka-pelmeni", expected: "Russian", prompt: "My Russian babushka's pelmeni dumplings in broth." },
  { id: "pr-boricua-sofrito", expected: "Puerto Rican", prompt: "Boricua sofrito comfort like arroz con gandules." },
  { id: "do-dominican-sancocho", expected: "Dominican", prompt: "Dominican sancocho rainy-day family comfort." },
  { id: "kr-halmeoni-jjigae", expected: "Korean", prompt: "Halmeoni kimchi jjigae and rice comfort dinner." },
  { id: "ph-lola-adobo", expected: "Filipino", prompt: "Lola's adobo and garlic rice, very nostalgic." },
  { id: "jw-bubbe-brisket", expected: "Jewish", prompt: "Bubbe brisket and soup-first holiday comfort." },
  { id: "wa-jollof-family", expected: "West African", prompt: "West African jollof rice with pepper stew flavor." },
];

function summarize(supportedSet) {
  const servedWell = [];
  const notServed = [];

  for (const item of NYC_CASES) {
    if (supportedSet.has(item.expected)) {
      servedWell.push(item);
    } else {
      notServed.push(item);
    }
  }

  return {
    total: NYC_CASES.length,
    served: servedWell.length,
    missed: notServed.length,
    servedWell,
    notServed,
  };
}

function printPhase(label, summary) {
  console.log(`\n=== ${label} ===`);
  console.log(`Coverage: ${summary.served}/${summary.total} (${Math.round((summary.served / summary.total) * 100)}%)`);
  if (summary.notServed.length > 0) {
    console.log("Not served:");
    for (const item of summary.notServed) {
      console.log(`- ${item.id}: ${item.expected}`);
    }
  }
}

const baseline = summarize(BASELINE_SUPPORTED);
const expanded = summarize(EXPANDED_SUPPORTED);

printPhase("NYC Simulation Baseline", baseline);
printPhase("NYC Simulation Expanded", expanded);

console.log("\n=== UX Notes ===");
console.log("- Keep onboarding broad (no giant persona wall).");
console.log("- Infer cuisine from cultural cues first, then pick style.");
console.log("- If confidence is low, ask one clarifying question before guessing.");

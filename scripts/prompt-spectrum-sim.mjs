#!/usr/bin/env node

const SUPPORTED_CUISINES = [
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
  "Russian",
  "Puerto Rican",
  "Dominican",
  "Korean",
  "Filipino",
  "Jewish",
  "West African",
];

const CUE_PATTERNS = [
  { cuisine: "Italian", pattern: /\bnonna\b|\bitalian\b|\b(sicilian|siclian)\b|\bneapolitan\b|\bragu\b|\bgravy\b/i },
  { cuisine: "Mexican", pattern: /\babuelita\b|\bmole\b|\bpozole\b|\boaxacan\b|\bmexican\b/i },
  { cuisine: "Greek", pattern: /\byiayia\b|\byiaya\b|\byaya\b|\bmoussaka\b|\bspanakopita\b|\bgreek\b/i },
  { cuisine: "Spanish", pattern: /\babuela\b|\bpaella\b|\bspanish\b|\bcocido\b/i },
  { cuisine: "French", pattern: /\bmamie\b|\bcoq au vin\b|\bfrench\b|\bprovencal\b/i },
  { cuisine: "Lebanese", pattern: /\bteta\b|\blebanese\b|\bmujadara\b|\bkibbeh\b/i },
  { cuisine: "Persian", pattern: /\bmaman\b|\bpersian\b|\bfesenjan\b|\btahdig\b/i },
  { cuisine: "Chinese", pattern: /\bnai nai\b|\bchinese\b|\bcantonese\b|\bjiaozi\b|\bwok\b/i },
  { cuisine: "Indian", pattern: /\bdadi\b|\bindian\b|\bdal\b|\bmasala\b/i },
  { cuisine: "Japanese", pattern: /\bobaachan\b|\bjapanese\b|\bmiso\b|\bonigiri\b|\bkansai\b|\bdashi\b/i },
  { cuisine: "Jamaican", pattern: /\bjamaican\b|\bjerk\b|\brace and peas\b/i },
  { cuisine: "Russian", pattern: /\brussian\b|\bbabushka\b|\bpelmeni\b|\bborscht\b/i },
  { cuisine: "Puerto Rican", pattern: /\bpuerto rican\b|\bboricua\b|\barroz con gandules\b|\basopao\b/i },
  { cuisine: "Dominican", pattern: /\bdominican\b|\bsancocho\b|\bla bandera\b/i },
  { cuisine: "Korean", pattern: /\bkorean\b|\bhalmeoni\b|\bkimchi\b|\bjjigae\b/i },
  { cuisine: "Filipino", pattern: /\bfilipino\b|\blola\b|\badobo\b|\bsinigang\b/i },
  { cuisine: "Jewish", pattern: /\bjewish\b|\bbubbe\b|\bbrisket\b|\bkugel\b|\bmatzo\b/i },
  { cuisine: "West African", pattern: /\bwest african\b|\bjollof\b|\begusi\b|\bgroundnut\b/i },
];

const UNSUPPORTED_HINTS = [
  /\bukrainian\b/i,
  /\bpolish\b/i,
  /\bhaitian\b/i,
  /\btrinidadian\b|\btrinbago\b/i,
  /\bguyanese\b/i,
];

const LOW_INFO_PATTERNS = [
  /\bi need dinner\b/i,
  /\bwhat should i cook\b/i,
  /\bmake me something\b/i,
  /\bi'm hungry\b/i,
];

const CASES = [
  { segment: "novice-vague", prompt: "I'm hungry, what should I cook tonight?", expect: "clarification" },
  { segment: "novice-vague", prompt: "Need something warm for this weather", expect: "clarification" },
  { segment: "novice-vague", prompt: "Can you help me make dinner?", expect: "clarification" },

  { segment: "memory-low-specificity", prompt: "I miss my nonna's sunday fish", expect: "Italian" },
  { segment: "memory-low-specificity", prompt: "Miss mi abuela's paella", expect: "Spanish" },
  { segment: "memory-low-specificity", prompt: "My abuelita used to make mole", expect: "Mexican" },
  { segment: "memory-low-specificity", prompt: "Need yiayia comfort food", expect: "Greek" },
  { segment: "memory-low-specificity", prompt: "My babushka made pelmeni", expect: "Russian" },
  { segment: "memory-low-specificity", prompt: "Boricua arroz con gandules vibes", expect: "Puerto Rican" },
  { segment: "memory-low-specificity", prompt: "Dominican sancocho like my grandma", expect: "Dominican" },
  { segment: "memory-low-specificity", prompt: "Halmeoni kimchi stew comfort", expect: "Korean" },
  { segment: "memory-low-specificity", prompt: "Lola adobo dinner please", expect: "Filipino" },
  { segment: "memory-low-specificity", prompt: "Bubbe brisket and soup", expect: "Jewish" },
  { segment: "memory-low-specificity", prompt: "Jollof like my West African grandma", expect: "West African" },

  { segment: "typo-heavy", prompt: "My grandma is siclian-american, miss sunday dinners", expect: "Italian" },
  { segment: "typo-heavy", prompt: "I want oaxcan abuelita style", expect: "Mexican" },
  { segment: "typo-heavy", prompt: "Need yiaya lemon stew", expect: "Greek" },
  { segment: "typo-heavy", prompt: "puertorican asopao comfort", expect: "Puerto Rican" },

  { segment: "expert-specific", prompt: "Neapolitan tomato-forward Sunday fish stew with garlic and basil only", expect: "Italian" },
  { segment: "expert-specific", prompt: "Valencian paella-style rice with saffron and sofrito", expect: "Spanish" },
  { segment: "expert-specific", prompt: "Cantonese ginger-scallion chicken, clean home style", expect: "Chinese" },
  { segment: "expert-specific", prompt: "Punjabi dal tadka with jeera rice and weeknight timing", expect: "Indian" },
  { segment: "expert-specific", prompt: "Kansai dashi-forward home bowl with restrained seasoning", expect: "Japanese" },

  { segment: "unsupported", prompt: "My Ukrainian grandma made varenyky", expect: "clarification" },
  { segment: "unsupported", prompt: "I want Polish pierogi like grandma", expect: "clarification" },
  { segment: "unsupported", prompt: "Haitian griot style from my family", expect: "clarification" },
];

function infer(prompt) {
  const text = prompt.toLowerCase();

  for (const unsupported of UNSUPPORTED_HINTS) {
    if (unsupported.test(text)) {
      return "clarification";
    }
  }

  const matches = CUE_PATTERNS.filter((entry) => entry.pattern.test(text));
  if (matches.length === 0) {
    if (LOW_INFO_PATTERNS.some((pattern) => pattern.test(text))) {
      return "clarification";
    }
    return "clarification";
  }

  return matches[0].cuisine;
}

function run() {
  const bySegment = new Map();
  const failures = [];

  for (const testCase of CASES) {
    const actual = infer(testCase.prompt);
    const pass = actual === testCase.expect;
    const key = testCase.segment;
    const stats = bySegment.get(key) ?? { total: 0, pass: 0 };
    stats.total += 1;
    if (pass) stats.pass += 1;
    bySegment.set(key, stats);

    if (!pass) {
      failures.push({
        segment: testCase.segment,
        prompt: testCase.prompt,
        expect: testCase.expect,
        actual,
      });
    }
  }

  const total = CASES.length;
  const passed = CASES.filter((item) => infer(item.prompt) === item.expect).length;
  const passRate = Math.round((passed / total) * 100);

  console.log("\n=== Prompt Spectrum Simulation ===");
  console.log(`Supported cuisines in scope: ${SUPPORTED_CUISINES.length}`);
  console.log(`Cases: ${total}`);
  console.log(`Pass: ${passed}/${total} (${passRate}%)`);

  console.log("\nBy segment:");
  for (const [segment, stats] of bySegment.entries()) {
    const rate = Math.round((stats.pass / stats.total) * 100);
    console.log(`- ${segment}: ${stats.pass}/${stats.total} (${rate}%)`);
  }

  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const item of failures) {
      console.log(`- [${item.segment}] expected=${item.expect}, actual=${item.actual}, prompt="${item.prompt}"`);
    }
  } else {
    console.log("\nNo failures in this simulation set.");
  }
}

run();

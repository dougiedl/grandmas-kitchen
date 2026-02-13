import { generateGuidanceReply } from "@/lib/chat/generate-guidance";
import type { Recipe } from "@/lib/chat/recipe-schema";

type ConversationEvalInput = {
  personaName: string;
  cuisine: string;
  prompt: string;
  recipe: Recipe;
  regionalStyle?: string;
  preferenceNotes?: string[];
};

type ConversationProbeType = "salty_fix" | "substitute";

type ConversationProbeScore = {
  score: number;
  notes: string[];
};

export type ConversationEvalResult = {
  averageScore: number;
  notes: string;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function hasAny(text: string, tokens: string[]): boolean {
  return tokens.some((token) => text.includes(token));
}

function recipeAnchorTokens(recipe: Recipe): string[] {
  const titleWords = recipe.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 5)
    .slice(0, 3);
  return [...titleWords, recipe.cuisine.toLowerCase()];
}

function scoreGuidanceReply(params: {
  reply: string;
  probeType: ConversationProbeType;
  recipe: Recipe;
}): ConversationProbeScore {
  const { reply, probeType, recipe } = params;
  const text = reply.toLowerCase();
  const notes: string[] = [];
  let score = 100;

  if (reply.trim().length < 60) {
    score -= 14;
    notes.push("conversation_actionability_weak");
  }

  const actionabilityTokens = ["first", "then", "next", "add", "reduce", "stir", "simmer", "taste"];
  if (!hasAny(text, actionabilityTokens)) {
    score -= 18;
    notes.push("conversation_actionability_weak");
  }

  const anchors = recipeAnchorTokens(recipe);
  if (!hasAny(text, anchors) && !text.includes("sauce") && !text.includes("dish")) {
    score -= 20;
    notes.push("conversation_context_weak");
  }

  if (probeType === "salty_fix") {
    const saltyTokens = ["salt", "dilute", "acid", "lemon", "vinegar", "broth", "water", "unsalted"];
    if (!hasAny(text, saltyTokens)) {
      score -= 28;
      notes.push("conversation_troubleshoot_weak");
    }
  }

  if (probeType === "substitute") {
    const substituteTokens = [
      "substitute",
      "swap",
      "replace",
      "parmesan",
      "pecorino",
      "yes",
      "can",
      "ratio",
      "start with",
    ];
    if (!hasAny(text, substituteTokens)) {
      score -= 28;
      notes.push("conversation_troubleshoot_weak");
    }
  }

  return {
    score: round2(clamp(score)),
    notes: [...new Set(notes)],
  };
}

function formatRecipeSnapshot(recipe: Recipe): string {
  const ingredients = recipe.ingredients
    .slice(0, 10)
    .map((item) => `${item.amount} ${item.item}`)
    .join(", ");
  const steps = recipe.steps.slice(0, 4).join(" | ");
  return [
    `Current recipe: ${recipe.title} (${recipe.cuisine})`,
    `Servings: ${recipe.servings}, Total minutes: ${recipe.totalMinutes}`,
    `Ingredients: ${ingredients || "n/a"}`,
    `Key steps: ${steps || "n/a"}`,
  ].join("\n");
}

export async function evaluateConversationQuality(
  input: ConversationEvalInput,
): Promise<ConversationEvalResult> {
  const { personaName, cuisine, prompt, recipe, regionalStyle, preferenceNotes } = input;

  const baseContext = [
    `User: ${prompt}`,
    `Grandma: Here is your recipe for ${recipe.title}.`,
  ].join("\n");

  const probes: Array<{ type: ConversationProbeType; userPrompt: string }> = [
    {
      type: "salty_fix",
      userPrompt: "I started cooking and the sauce tastes too salty. What should I do right now?",
    },
    {
      type: "substitute",
      userPrompt: "I only have parmesan instead of pecorino. Is that okay and how much should I use?",
    },
  ];

  const probeScores: number[] = [];
  const allNotes: string[] = [];

  for (const probe of probes) {
    const reply = await generateGuidanceReply({
      personaName,
      cuisine,
      userPrompt: probe.userPrompt,
      conversationContext: baseContext,
      recipeSnapshot: formatRecipeSnapshot(recipe),
      regionalStyle,
      preferenceNotes,
    });

    const scored = scoreGuidanceReply({
      reply,
      probeType: probe.type,
      recipe,
    });

    probeScores.push(scored.score);
    allNotes.push(...scored.notes);
  }

  const averageScore =
    probeScores.length > 0
      ? round2(probeScores.reduce((sum, value) => sum + value, 0) / probeScores.length)
      : 0;

  allNotes.push(`conversation_score=${averageScore.toFixed(2)}`);
  return {
    averageScore,
    notes: [...new Set(allNotes)].join(", "),
  };
}

export function parseConversationScore(notes: string | null | undefined): number | null {
  if (!notes) {
    return null;
  }
  const match = notes.match(/conversation_score=([0-9]+(?:\.[0-9]+)?)/);
  if (!match) {
    return null;
  }
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

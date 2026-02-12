import { createMockRecipe } from "@/lib/chat/mock-recipe";
import { validateRecipe, type Recipe, type RegenerationStyle } from "@/lib/chat/recipe-schema";
import { buildKnowledgeContext, formatKnowledgeForPrompt } from "@/lib/chat/cuisine-knowledge";

type GenerateRecipeInput = {
  personaName: string;
  cuisine: string;
  prompt: string;
  regenerationStyle?: RegenerationStyle;
  regionalStyle?: string;
  preferenceNotes?: string[];
  useSemanticRerank?: boolean;
};

export type RecipeGenerationMeta = {
  modelName: string;
  usedOpenAI: boolean;
  knowledgePackId: string;
  knowledgePackVersion: string;
  knowledgeCuisine: string;
  selectedSnippetIds: string[];
};

export type GenerateRecipeResult = {
  recipe: Recipe;
  meta: RecipeGenerationMeta;
};

function styleInstruction(style?: RegenerationStyle): string {
  if (!style) {
    return "";
  }

  if (style === "faster") {
    return "Make it faster: target <= 30 minutes and reduce step complexity.";
  }

  if (style === "traditional") {
    return "Make it more traditional: favor classic home techniques and pantry staples for the cuisine.";
  }

  return "Make it vegetarian: no meat, poultry, or seafood ingredients.";
}

function grandmaKnowledgeInstruction(cuisine: string): string {
  return [
    "Write as a practical home cook, not a restaurant chef.",
    "Ground the recipe in grandma-style techniques: patient aromatics, layered seasoning, and table-friendly portions.",
    `Cuisine focus: ${cuisine}. Use culturally consistent pantry choices and flavor combinations for this cuisine.`,
    "Respect user-provided ingredients whenever possible and avoid introducing niche ingredients unless clearly optional.",
    "Return exactly: title, cuisine, servings, totalMinutes, ingredients, steps, grandmaTips.",
  ].join(" ");
}

function personalizationInstruction(input: Pick<GenerateRecipeInput, "regionalStyle" | "preferenceNotes">): string {
  const lines: string[] = [];

  if (input.regionalStyle) {
    lines.push(`Regional style target: ${input.regionalStyle}.`);
  }

  if (input.preferenceNotes && input.preferenceNotes.length > 0) {
    lines.push(`Known user preference notes: ${input.preferenceNotes.join(" ")}`);
  }

  return lines.join(" ");
}

function applyFallbackStyle(recipe: Recipe, style?: RegenerationStyle): Recipe {
  if (!style) {
    return recipe;
  }

  if (style === "faster") {
    return {
      ...recipe,
      totalMinutes: Math.min(recipe.totalMinutes, 30),
      grandmaTips: [...recipe.grandmaTips, "Use one pan and prep ingredients before heat to save time."],
    };
  }

  if (style === "traditional") {
    return {
      ...recipe,
      grandmaTips: [...recipe.grandmaTips, "Cook aromatics slowly and taste as you go for old-school depth."],
    };
  }

  return {
    ...recipe,
    title: recipe.title.includes("Vegetarian") ? recipe.title : `Vegetarian ${recipe.title}`,
    grandmaTips: [...recipe.grandmaTips, "Use mushrooms or lentils for savory depth in place of meat."],
  };
}

export async function generateRecipeDetailed(input: GenerateRecipeInput): Promise<GenerateRecipeResult> {
  const knowledgeContext = await buildKnowledgeContext({
    cuisine: input.cuisine,
    personaName: input.personaName,
    prompt: input.prompt,
    regionalStyle: input.regionalStyle,
    regenerationStyle: input.regenerationStyle,
    useSemanticRerank: input.useSemanticRerank,
  });

  const knowledgePrompt = formatKnowledgeForPrompt(knowledgeContext);

  const mockRecipe = applyFallbackStyle(
    validateRecipe(
      createMockRecipe({
        personaName: input.personaName,
        cuisine: knowledgeContext.cuisine,
        prompt: input.prompt,
        regionalStyle: input.regionalStyle,
      }),
    ),
    input.regenerationStyle,
  );

  const apiKey = process.env.OPENAI_API_KEY;
  const fallbackMeta: RecipeGenerationMeta = {
    modelName: "mock-fallback",
    usedOpenAI: false,
    knowledgePackId: knowledgeContext.packId,
    knowledgePackVersion: knowledgeContext.packVersion,
    knowledgeCuisine: knowledgeContext.cuisine,
    selectedSnippetIds: knowledgeContext.selectedSnippetIds,
  };
  if (!apiKey) {
    return { recipe: mockRecipe, meta: fallbackMeta };
  }

  try {
    const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "You are Grandma's Kitchen recipe engine.",
              grandmaKnowledgeInstruction(knowledgeContext.cuisine),
              "Strict output contract: output ONLY valid JSON. No markdown. No extra keys.",
              "JSON schema expectations: title string, cuisine string, servings integer 1-20, totalMinutes integer 5-240, ingredients array of {amount,item}, steps string[], grandmaTips string[].",
              "Recipe must reflect the matched cuisine memory snippets and avoid listed anti-patterns.",
            ].join(" "),
          },
          {
            role: "user",
            content: [
              `Grandma persona: ${input.personaName}`,
              `Cuisine: ${knowledgeContext.cuisine}`,
              personalizationInstruction(input),
              "Use this deterministic cuisine memory pack:",
              knowledgePrompt,
              `User prompt: ${input.prompt}`,
              styleInstruction(input.regenerationStyle),
              "Hard requirements: 1) Ground recipe in user ingredients and intent. 2) Keep home-cook realism. 3) Preserve cuisine authenticity.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      return { recipe: mockRecipe, meta: fallbackMeta };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      return { recipe: mockRecipe, meta: fallbackMeta };
    }

    return {
      recipe: validateRecipe(JSON.parse(raw)),
      meta: {
        modelName: model,
        usedOpenAI: true,
        knowledgePackId: knowledgeContext.packId,
        knowledgePackVersion: knowledgeContext.packVersion,
        knowledgeCuisine: knowledgeContext.cuisine,
        selectedSnippetIds: knowledgeContext.selectedSnippetIds,
      },
    };
  } catch (error) {
    console.error("Recipe generation fallback", error);
    return { recipe: mockRecipe, meta: fallbackMeta };
  }
}

export async function generateRecipe(input: GenerateRecipeInput): Promise<Recipe> {
  const result = await generateRecipeDetailed(input);
  return result.recipe;
}

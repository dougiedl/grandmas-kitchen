import { createMockRecipe } from "@/lib/chat/mock-recipe";
import { validateRecipe, type Recipe, type RegenerationStyle } from "@/lib/chat/recipe-schema";

type GenerateRecipeInput = {
  personaName: string;
  cuisine: string;
  prompt: string;
  regenerationStyle?: RegenerationStyle;
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

export async function generateRecipe(input: GenerateRecipeInput): Promise<Recipe> {
  const mockRecipe = applyFallbackStyle(
    validateRecipe(
      createMockRecipe({
        personaName: input.personaName,
        cuisine: input.cuisine,
        prompt: input.prompt,
      }),
    ),
    input.regenerationStyle,
  );

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return mockRecipe;
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
            content:
              "You are Grandma's Kitchen recipe engine. Return only valid JSON with keys: title, cuisine, servings, totalMinutes, ingredients, steps, grandmaTips.",
          },
          {
            role: "user",
            content: [
              `Grandma persona: ${input.personaName}`,
              `Cuisine: ${input.cuisine}`,
              `User prompt: ${input.prompt}`,
              styleInstruction(input.regenerationStyle),
              "Recipe must be practical and home-cook friendly.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      return mockRecipe;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      return mockRecipe;
    }

    return validateRecipe(JSON.parse(raw));
  } catch (error) {
    console.error("Recipe generation fallback", error);
    return mockRecipe;
  }
}

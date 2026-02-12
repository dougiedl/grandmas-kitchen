import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { generateRecipeDetailed } from "@/lib/chat/generate-recipe";
import { parseRegenerationStyle, type RegenerationStyle } from "@/lib/chat/recipe-schema";
import { getPool } from "@/lib/db/pool";
import {
  extractRegionalSignals,
  loadPersonalizationContext,
  persistSignals,
  upsertTasteProfile,
} from "@/lib/personalization/profile";
import { checkRateLimit } from "@/lib/security/rate-limit";

type RegeneratePayload = {
  regenerationStyle?: RegenerationStyle;
  instruction?: string;
};

type SourceRecipeRow = {
  id: string;
  user_id: string;
  thread_id: string | null;
  title: string;
  cuisine: string | null;
  recipe_json: {
    ingredients?: Array<{ amount: string; item: string }>;
  } | null;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as RegeneratePayload;
  const regenerationStyle = parseRegenerationStyle(body.regenerationStyle);
  const instruction = body.instruction?.trim();
  const { id } = await params;

  const pool = getPool();
  const sourceResult = await pool.query<SourceRecipeRow>(
    `
      select r.id, r.user_id, r.thread_id, r.title, r.cuisine, r.recipe_json
      from recipes r
      join users u on u.id = r.user_id
      where r.id = $1 and u.email = $2
      limit 1
    `,
    [id, email],
  );

  const source = sourceResult.rows[0];
  if (!source) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const limiter = checkRateLimit({
    request,
    userKey: source.user_id,
    routeKey: "recipe_regenerate",
    max: 20,
    windowMs: 60_000,
  });
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait and try again." }, { status: 429 });
  }

  const baseIngredients = (source.recipe_json?.ingredients ?? [])
    .slice(0, 8)
    .map((item) => `${item.amount} ${item.item}`)
    .join(", ");

  const prompt = [
    `Regenerate this recipe: ${source.title}`,
    baseIngredients ? `Ingredients: ${baseIngredients}` : "",
    instruction ? `User edits: ${instruction}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const cuisine = source.cuisine ?? "Home Style";
  const promptSignals = extractRegionalSignals(prompt, cuisine);
  const personalizationContext = await loadPersonalizationContext({
    pool,
    userId: source.user_id,
    cuisine,
    prompt,
  });

  await persistSignals({
    pool,
    userId: source.user_id,
    threadId: source.thread_id,
    cuisine,
    source: "recipe_regenerate",
    signals: promptSignals,
  });

  const generation = await generateRecipeDetailed({
    personaName: "Grandma",
    cuisine,
    prompt,
    regenerationStyle,
    regionalStyle: personalizationContext.regionalStyle,
    preferenceNotes: personalizationContext.preferenceNotes,
  });
  const recipe = generation.recipe;

  const newRecipeId = randomUUID();
  await pool.query(
    `
      insert into recipes (id, user_id, thread_id, title, cuisine, servings, total_minutes, recipe_json)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      newRecipeId,
      source.user_id,
      source.thread_id,
      recipe.title,
      recipe.cuisine,
      recipe.servings,
      recipe.totalMinutes,
      JSON.stringify(recipe),
    ],
  );

  await upsertTasteProfile({
    pool,
    userId: source.user_id,
    lastCuisine: cuisine,
    lastRegionalStyle: personalizationContext.regionalStyle ?? null,
    incrementGenerations: true,
  });

  await pool.query(
    `
      insert into analytics_events (id, user_id, event_name, event_props)
      values ($1, $2, 'recipe_regenerated_from_detail', $3::jsonb)
    `,
    [
      randomUUID(),
      source.user_id,
      JSON.stringify({
        sourceRecipeId: source.id,
        newRecipeId,
        regenerationStyle: regenerationStyle ?? null,
        generationMeta: generation.meta,
      }),
    ],
  );

  return NextResponse.json({
    recipeId: newRecipeId,
    recipe,
  });
}

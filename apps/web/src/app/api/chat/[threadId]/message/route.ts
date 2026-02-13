import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { generateRecipeDetailed } from "@/lib/chat/generate-recipe";
import {
  parseRegenerationStyle,
  type RegenerationStyle,
} from "@/lib/chat/recipe-schema";
import { getPool } from "@/lib/db/pool";
import {
  extractRegionalSignals,
  loadPersonalizationContext,
  persistSignals,
  upsertTasteProfile,
} from "@/lib/personalization/profile";
import { checkRateLimit } from "@/lib/security/rate-limit";

type MessagePayload = {
  content?: string;
  regenerationStyle?: RegenerationStyle;
  regenerateFromLatest?: boolean;
  instruction?: string;
};

type ConversationRow = {
  role: "user" | "assistant" | "system";
  content: string;
  parsed_entities?: {
    recipe?: {
      title?: string;
      cuisine?: string;
      servings?: number;
      totalMinutes?: number;
      ingredients?: Array<{ amount?: string; item?: string }>;
      steps?: string[];
      grandmaTips?: string[];
    };
  } | null;
};

type RecipeLike = NonNullable<NonNullable<ConversationRow["parsed_entities"]>["recipe"]>;

function looksLikeRecipeRequest(input: string): boolean {
  const text = input.toLowerCase();
  return [
    "what should i cook",
    "what can i make",
    "make me",
    "i have",
    "recipe",
    "dinner",
    "lunch",
    "breakfast",
    "meal",
    "craving",
    "ingredients",
    "sunday gravy",
    "ragu",
    "pasta",
    "stew",
    "soup",
  ].some((token) => text.includes(token));
}

function looksLikeCookingHelp(input: string): boolean {
  const text = input.toLowerCase();
  return [
    "help",
    "too salty",
    "too bland",
    "too spicy",
    "burnt",
    "burning",
    "watery",
    "too thick",
    "too thin",
    "substitute",
    "swap",
    "replace",
    "can i use",
    "what temp",
    "temperature",
    "how long",
    "when do i",
    "next step",
    "what do i do now",
  ].some((token) => text.includes(token));
}

function formatConversationContext(rows: ConversationRow[]): string {
  return rows
    .slice(-8)
    .map((row) => `${row.role === "assistant" ? "Grandma" : "User"}: ${row.content}`)
    .join("\n");
}

function extractLatestRecipe(rows: ConversationRow[]): RecipeLike | null {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const recipe = rows[i]?.parsed_entities?.recipe;
    if (recipe) {
      return recipe;
    }
  }
  return null;
}

function formatRecipeSnapshot(recipe: RecipeLike | null): string {
  if (!recipe) {
    return "No active recipe in this thread yet.";
  }
  const ingredients = (recipe.ingredients ?? [])
    .slice(0, 10)
    .map((item) => `${item.amount ?? ""} ${item.item ?? ""}`.trim())
    .filter(Boolean)
    .join(", ");
  const steps = (recipe.steps ?? []).slice(0, 4).join(" | ");
  return [
    `Current recipe: ${recipe.title ?? "Untitled"} (${recipe.cuisine ?? "Unknown cuisine"})`,
    `Servings: ${recipe.servings ?? "?"}, Total minutes: ${recipe.totalMinutes ?? "?"}`,
    `Ingredients: ${ingredients || "n/a"}`,
    `Key steps: ${steps || "n/a"}`,
  ].join("\n");
}

async function generateGuidanceReply(params: {
  personaName: string;
  cuisine: string;
  userPrompt: string;
  conversationContext: string;
  recipeSnapshot: string;
  regionalStyle?: string;
  preferenceNotes?: string[];
}): Promise<string> {
  const {
    personaName,
    cuisine,
    userPrompt,
    conversationContext,
    recipeSnapshot,
    regionalStyle,
    preferenceNotes,
  } = params;

  const fallback = [
    `I’m here with you. Let’s keep this ${cuisine} and homey.`,
    "Tell me what you’re seeing right now (texture, taste, and heat level), and I’ll give you the exact next 1-2 steps.",
  ].join(" ");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallback;
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
        temperature: 0.65,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "You are Grandma's Kitchen conversational cooking coach.",
              "Be warm and practical like a grandma, but concise and precise.",
              "Do not generate a full new recipe unless explicitly asked.",
              "Respect cuisine authenticity and user's regional/cultural signals.",
              "When user asks a fix, provide concrete corrective actions with amounts/timing when possible.",
              "Output JSON only with key: reply (string).",
            ].join(" "),
          },
          {
            role: "user",
            content: [
              `Persona: ${personaName}`,
              `Cuisine: ${cuisine}`,
              regionalStyle ? `Regional style: ${regionalStyle}` : "",
              preferenceNotes && preferenceNotes.length > 0
                ? `User preference notes: ${preferenceNotes.join(" ")}`
                : "",
              "Conversation so far:",
              conversationContext || "No prior messages.",
              "Active recipe snapshot:",
              recipeSnapshot,
              `Latest user message: ${userPrompt}`,
              "Return one coaching reply that advances the cooking process.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as { reply?: string };
    if (typeof parsed.reply !== "string" || parsed.reply.trim().length < 5) {
      return fallback;
    }
    return parsed.reply.trim();
  } catch {
    return fallback;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const body = (await request.json()) as MessagePayload;
  const regenerationStyle = parseRegenerationStyle(body.regenerationStyle);

  const pool = getPool();
  const threadResult = await pool.query(
    `
      select t.id, t.user_id, t.persona_id, p.name as persona_name, p.cuisine
      from conversation_threads t
      join users u on u.id = t.user_id
      left join grandma_personas p on p.id = t.persona_id
      where t.id = $1 and u.email = $2
      limit 1
    `,
    [threadId, email],
  );

  const thread = threadResult.rows[0];

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const limiter = checkRateLimit({
    request,
    userKey: thread.user_id as string,
    routeKey: "chat_message",
    max: 40,
    windowMs: 60_000,
  });
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait and try again." }, { status: 429 });
  }

  let basePrompt = body.content?.trim();
  if (!basePrompt || body.regenerateFromLatest) {
    const latestUserMessage = await pool.query(
      `
        select content
        from messages
        where thread_id = $1 and role = 'user'
        order by created_at desc
        limit 1
      `,
      [threadId],
    );

    basePrompt = basePrompt || (latestUserMessage.rows[0]?.content as string | undefined);
  }

  if (!basePrompt) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  const instruction = body.instruction?.trim();
  const cuisine = thread.cuisine ?? "Home Style";
  const recentConversationResult = await pool.query<ConversationRow>(
    `
      select role, content, parsed_entities
      from messages
      where thread_id = $1
      order by created_at asc
      limit 50
    `,
    [threadId],
  );
  const conversationRows = recentConversationResult.rows;
  const conversationContext = formatConversationContext(conversationRows);
  const latestRecipeFromThread = extractLatestRecipe(conversationRows);

  const generationPromptBase = instruction
    ? `${basePrompt}\n\nRequested adjustment: ${instruction}`
    : basePrompt;
  const generationPrompt =
    conversationContext.length > 0
      ? `${generationPromptBase}\n\nConversation context:\n${conversationContext}`
      : generationPromptBase;

  const promptSignals = extractRegionalSignals(generationPromptBase, cuisine);
  const personalizationContext = await loadPersonalizationContext({
    pool,
    userId: thread.user_id,
    cuisine,
    prompt: generationPromptBase,
  });

  await persistSignals({
    pool,
    userId: thread.user_id,
    threadId,
    cuisine,
    source: "chat_prompt",
    signals: promptSignals,
  });

  let userMessageId: string | null = null;
  if (!body.regenerateFromLatest) {
    userMessageId = randomUUID();
    await pool.query(
      `insert into messages (id, thread_id, role, content) values ($1, $2, 'user', $3)`,
      [userMessageId, threadId, basePrompt],
    );
  }

  const shouldGenerateRecipe =
    Boolean(body.regenerateFromLatest) ||
    Boolean(regenerationStyle) ||
    (!latestRecipeFromThread && looksLikeRecipeRequest(generationPromptBase)) ||
    (!looksLikeCookingHelp(generationPromptBase) && looksLikeRecipeRequest(generationPromptBase));

  const assistantMessageId = randomUUID();
  let recipeId: string | null = null;
  let recipe: Awaited<ReturnType<typeof generateRecipeDetailed>>["recipe"] | null = null;
  let assistantContent = "";
  let generationMeta: Awaited<ReturnType<typeof generateRecipeDetailed>>["meta"] | null = null;

  if (shouldGenerateRecipe) {
    const generation = await generateRecipeDetailed({
      personaName: thread.persona_name ?? "Grandma",
      cuisine,
      prompt: generationPrompt,
      regenerationStyle,
      regionalStyle: personalizationContext.regionalStyle,
      preferenceNotes: personalizationContext.preferenceNotes,
    });
    recipe = generation.recipe;
    generationMeta = generation.meta;
    recipeId = randomUUID();

    const styleText =
      regenerationStyle === "faster"
        ? "I made it faster"
        : regenerationStyle === "traditional"
          ? "I made it more traditional"
          : regenerationStyle === "vegetarian"
            ? "I made it vegetarian"
            : "Here is your recipe";

    assistantContent = [
      `${styleText}: let's make ${recipe.title}.`,
      `This is a ${recipe.cuisine} grandma-inspired dish for ${recipe.servings} servings.`,
      `Total time: ${recipe.totalMinutes} minutes.`,
    ].join(" ");

    await pool.query(
      `insert into messages (id, thread_id, role, content, parsed_entities) values ($1, $2, 'assistant', $3, $4)`,
      [assistantMessageId, threadId, assistantContent, JSON.stringify({ recipe, regenerationStyle, recipeId })],
    );
  } else {
    assistantContent = await generateGuidanceReply({
      personaName: thread.persona_name ?? "Grandma",
      cuisine,
      userPrompt: generationPromptBase,
      conversationContext,
      recipeSnapshot: formatRecipeSnapshot(latestRecipeFromThread),
      regionalStyle: personalizationContext.regionalStyle,
      preferenceNotes: personalizationContext.preferenceNotes,
    });
    await pool.query(
      `insert into messages (id, thread_id, role, content, parsed_entities) values ($1, $2, 'assistant', $3, $4)`,
      [assistantMessageId, threadId, assistantContent, JSON.stringify({ assistantMode: "guidance" })],
    );
  }

  await upsertTasteProfile({
    pool,
    userId: thread.user_id,
    lastPersonaId: thread.persona_id,
    lastCuisine: cuisine,
    lastRegionalStyle: personalizationContext.regionalStyle ?? null,
    incrementGenerations: true,
  });

  if (recipe && recipeId) {
    await pool.query(
      `
        insert into recipes (id, user_id, thread_id, title, cuisine, servings, total_minutes, recipe_json)
        values ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        recipeId,
        thread.user_id,
        threadId,
        recipe.title,
        recipe.cuisine,
        recipe.servings,
        recipe.totalMinutes,
        JSON.stringify(recipe),
      ],
    );
  }

  try {
    await pool.query(
      `
        insert into analytics_events (id, user_id, event_name, event_props)
        values ($1, $2, $3, $4::jsonb)
      `,
      [
        randomUUID(),
        thread.user_id,
        recipe ? "recipe_generated" : "chat_guidance_issued",
        JSON.stringify({
          threadId,
          recipeId,
          regenerationStyle: regenerationStyle ?? null,
          generationMeta,
          mode: recipe ? "recipe" : "guidance",
        }),
      ],
    );
  } catch {
    // Analytics should never break chat.
  }

  return NextResponse.json({
    userMessage: userMessageId
      ? {
          id: userMessageId,
          role: "user",
          content: basePrompt,
        }
      : null,
    assistantMessage: {
      id: assistantMessageId,
      role: "assistant",
      content: assistantContent,
      parsed_entities: recipe ? { recipe, regenerationStyle, recipeId } : { assistantMode: "guidance" },
    },
    recipeId,
    recipe: recipe ?? undefined,
  });
}

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { generateRecipe } from "@/lib/chat/generate-recipe";
import {
  parseRegenerationStyle,
  type RegenerationStyle,
} from "@/lib/chat/recipe-schema";
import { getPool } from "@/lib/db/pool";

type MessagePayload = {
  content?: string;
  regenerationStyle?: RegenerationStyle;
  regenerateFromLatest?: boolean;
};

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
      select t.id, t.user_id, p.name as persona_name, p.cuisine
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

  let userMessageId: string | null = null;
  if (!body.regenerateFromLatest) {
    userMessageId = randomUUID();
    await pool.query(
      `insert into messages (id, thread_id, role, content) values ($1, $2, 'user', $3)`,
      [userMessageId, threadId, basePrompt],
    );
  }

  const recipe = await generateRecipe({
    personaName: thread.persona_name ?? "Grandma",
    cuisine: thread.cuisine ?? "Home Style",
    prompt: basePrompt,
    regenerationStyle,
  });

  const styleText =
    regenerationStyle === "faster"
      ? "I made it faster"
      : regenerationStyle === "traditional"
        ? "I made it more traditional"
        : regenerationStyle === "vegetarian"
          ? "I made it vegetarian"
          : "Here is your recipe";

  const assistantContent = [
    `${styleText}: let's make ${recipe.title}.`,
    `This is a ${recipe.cuisine} grandma-inspired dish for ${recipe.servings} servings.`,
    `Total time: ${recipe.totalMinutes} minutes.`,
  ].join(" ");

  const assistantMessageId = randomUUID();
  const recipeId = randomUUID();
  await pool.query(
    `insert into messages (id, thread_id, role, content, parsed_entities) values ($1, $2, 'assistant', $3, $4)`,
    [assistantMessageId, threadId, assistantContent, JSON.stringify({ recipe, regenerationStyle, recipeId })],
  );

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

  await pool.query(
    `
      insert into analytics_events (id, user_id, event_name, event_props)
      values ($1, $2, 'recipe_generated', $3::jsonb)
    `,
    [
      randomUUID(),
      thread.user_id,
      JSON.stringify({ threadId, recipeId, regenerationStyle: regenerationStyle ?? null }),
    ],
  );

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
      parsed_entities: { recipe, regenerationStyle, recipeId },
    },
    recipeId,
    recipe,
  });
}

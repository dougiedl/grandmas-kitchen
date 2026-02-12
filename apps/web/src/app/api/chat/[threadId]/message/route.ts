import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createMockRecipe } from "@/lib/chat/mock-recipe";
import { getPool } from "@/lib/db/pool";

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
  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim();

  if (!content) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

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

  const userMessageId = randomUUID();
  await pool.query(
    `insert into messages (id, thread_id, role, content) values ($1, $2, 'user', $3)`,
    [userMessageId, threadId, content],
  );

  const recipe = createMockRecipe({
    personaName: thread.persona_name ?? "Grandma",
    cuisine: thread.cuisine ?? "Home Style",
    prompt: content,
  });

  const assistantContent = [
    `Tonight, let's make ${recipe.title}.`,
    `This is a ${recipe.cuisine} grandma-inspired dish for ${recipe.servings} servings.`,
    `Total time: ${recipe.totalMinutes} minutes.`,
  ].join(" ");

  const assistantMessageId = randomUUID();
  await pool.query(
    `insert into messages (id, thread_id, role, content, parsed_entities) values ($1, $2, 'assistant', $3, $4)`,
    [assistantMessageId, threadId, assistantContent, JSON.stringify({ recipe })],
  );

  await pool.query(
    `
      insert into recipes (id, user_id, thread_id, title, cuisine, servings, total_minutes, recipe_json)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      randomUUID(),
      thread.user_id,
      threadId,
      recipe.title,
      recipe.cuisine,
      recipe.servings,
      recipe.totalMinutes,
      JSON.stringify(recipe),
    ],
  );

  return NextResponse.json({
    userMessage: {
      id: userMessageId,
      role: "user",
      content,
    },
    assistantMessage: {
      id: assistantMessageId,
      role: "assistant",
      content: assistantContent,
      parsed_entities: { recipe },
    },
    recipe,
  });
}

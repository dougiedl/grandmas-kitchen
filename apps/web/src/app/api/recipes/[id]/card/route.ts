import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const pool = getPool();
  const result = await pool.query<{
    title: string;
    cuisine: string | null;
    servings: number | null;
    total_minutes: number | null;
    recipe_json: {
      ingredients?: Array<{ amount: string; item: string }>;
      steps?: string[];
      grandmaTips?: string[];
    } | null;
  }>(
    `
      select r.title, r.cuisine, r.servings, r.total_minutes, r.recipe_json
      from recipes r
      join users u on u.id = r.user_id
      where r.id = $1 and u.email = $2
      limit 1
    `,
    [id, email],
  );

  const recipe = result.rows[0];
  if (!recipe) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ingredients = (recipe.recipe_json?.ingredients ?? [])
    .map((item) => `<li>${item.amount} ${item.item}</li>`)
    .join("");
  const steps = (recipe.recipe_json?.steps ?? [])
    .map((step, idx) => `<li>${idx + 1}. ${step}</li>`)
    .join("");
  const tips = (recipe.recipe_json?.grandmaTips ?? [])
    .map((tip) => `<li>${tip}</li>`)
    .join("");

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${recipe.title}</title>
    <style>
      body { font-family: Georgia, serif; margin: 32px; color: #3d2b21; }
      .meta { color: #6a4a3a; margin-bottom: 16px; }
      h1, h2 { margin-bottom: 6px; }
      h2 { margin-top: 20px; }
      ul, ol { padding-left: 20px; }
      @media print { .print-hint { display: none; } }
    </style>
  </head>
  <body>
    <p class="print-hint">Use browser Print and select "Save as PDF".</p>
    <h1>${recipe.title}</h1>
    <p class="meta">${recipe.cuisine ?? "Home Style"} • ${recipe.servings ?? "-"} servings • ${recipe.total_minutes ?? "-"} min</p>
    <h2>Ingredients</h2>
    <ul>${ingredients}</ul>
    <h2>Steps</h2>
    <ol>${steps}</ol>
    <h2>Grandma Tips</h2>
    <ul>${tips}</ul>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

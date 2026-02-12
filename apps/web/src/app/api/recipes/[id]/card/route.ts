import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
    .map((item) => `<li><strong>${escapeHtml(item.amount)}</strong> ${escapeHtml(item.item)}</li>`)
    .join("");
  const steps = (recipe.recipe_json?.steps ?? [])
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join("");
  const tips = (recipe.recipe_json?.grandmaTips ?? [])
    .map((tip) => `<li>${escapeHtml(tip)}</li>`)
    .join("");

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(recipe.title)}</title>
    <style>
      body {
        background: #f8f1e7;
        color: #2e1f18;
        font-family: "Palatino Linotype", Palatino, Georgia, serif;
        margin: 0;
        padding: 28px;
      }
      .card {
        background: #fffaf2;
        border: 1px solid #d4a774;
        border-radius: 18px;
        box-shadow: 0 10px 24px rgba(71, 41, 28, 0.12);
        margin: 0 auto;
        max-width: 820px;
        padding: 20px 24px;
      }
      .brand {
        color: #8c5635;
        font-size: 12px;
        letter-spacing: 1px;
        margin: 0;
        text-transform: uppercase;
      }
      h1 {
        font-family: "Garamond", "Times New Roman", serif;
        font-size: 42px;
        margin: 6px 0 8px;
      }
      .meta {
        color: #654636;
        margin-bottom: 20px;
      }
      .divider {
        border: 0;
        border-top: 1px solid #e6c8a3;
        margin: 18px 0;
      }
      .section-title {
        color: #5a3828;
        font-family: "Garamond", "Times New Roman", serif;
        font-size: 26px;
        margin: 0 0 8px;
      }
      ul, ol {
        line-height: 1.5;
        margin: 0;
        padding-left: 20px;
      }
      li { margin-bottom: 6px; }
      .hint {
        color: #8d6b57;
        font-size: 14px;
        margin-bottom: 10px;
      }
      @media print {
        body {
          background: #fff;
          padding: 0;
        }
        .card {
          border: 0;
          box-shadow: none;
          max-width: none;
          padding: 0;
        }
        .hint { display: none; }
      }
    </style>
  </head>
  <body>
    <article class="card">
      <p class="brand">Grandma's Kitchen</p>
      <p class="hint">Print this card to keep a family copy in your recipe binder.</p>
      <h1>${escapeHtml(recipe.title)}</h1>
      <p class="meta">${escapeHtml(recipe.cuisine ?? "Home Style")} • ${escapeHtml(String(recipe.servings ?? "-"))} servings • ${escapeHtml(String(recipe.total_minutes ?? "-"))} min</p>
      <hr class="divider" />
      <h2 class="section-title">Ingredients</h2>
      <ul>${ingredients}</ul>
      <hr class="divider" />
      <h2 class="section-title">Steps</h2>
      <ol>${steps}</ol>
      <hr class="divider" />
      <h2 class="section-title">Grandma Tips</h2>
      <ul>${tips}</ul>
    </article>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

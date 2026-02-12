import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

type RecipeDetailRecord = {
  id: string;
  title: string;
  cuisine: string | null;
  servings: number | null;
  total_minutes: number | null;
  is_favorite: boolean;
  created_at: string;
  recipe_json: {
    ingredients?: Array<{ amount: string; item: string }>;
    steps?: string[];
    grandmaTips?: string[];
  } | null;
};

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return (
      <section>
        <h2>Recipe Details</h2>
        <p>Please sign in to view recipe details.</p>
      </section>
    );
  }

  const { id } = await params;
  const pool = getPool();
  const result = await pool.query<RecipeDetailRecord>(
    `
      select r.id, r.title, r.cuisine, r.servings, r.total_minutes, r.is_favorite, r.created_at, r.recipe_json
      from recipes r
      join users u on u.id = r.user_id
      where r.id = $1 and u.email = $2
      limit 1
    `,
    [id, email],
  );

  const recipe = result.rows[0];
  if (!recipe) {
    notFound();
  }

  const ingredients = recipe.recipe_json?.ingredients ?? [];
  const steps = recipe.recipe_json?.steps ?? [];
  const tips = recipe.recipe_json?.grandmaTips ?? [];

  return (
    <section className="recipe-detail">
      <p>
        <Link href="/recipes">Back to Recipes</Link>
      </p>
      <h2>{recipe.title}</h2>
      <p>
        {recipe.cuisine ?? "Home Style"} • {recipe.servings ?? "-"} servings • {recipe.total_minutes ?? "-"} min
      </p>
      <p>{recipe.is_favorite ? "Favorite recipe" : "Not marked favorite"}</p>
      <p className="recipe-list-date">Saved {new Date(recipe.created_at).toLocaleString()}</p>

      <h3>Ingredients</h3>
      <ul>
        {ingredients.map((ingredient) => (
          <li key={`${ingredient.amount}-${ingredient.item}`}>{ingredient.amount} {ingredient.item}</li>
        ))}
      </ul>

      <h3>Steps</h3>
      <ol>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <h3>Grandma Tips</h3>
      <ul>
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </section>
  );
}

import { auth } from "@/lib/auth/auth";
import { RecipesListClient } from "@/components/recipes-list-client";
import { getPool } from "@/lib/db/pool";

type RecipeRecord = {
  id: string;
  title: string;
  cuisine: string | null;
  servings: number | null;
  total_minutes: number | null;
  is_favorite: boolean;
  created_at: string;
  recipe_json: {
    ingredients?: Array<{ amount: string; item: string }>;
  } | null;
};

export default async function RecipesPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return (
      <section>
        <h2>Recipes</h2>
        <p>Please sign in to see your saved recipes.</p>
      </section>
    );
  }

  const pool = getPool();
  const result = await pool.query<RecipeRecord>(
    `
      select r.id, r.title, r.cuisine, r.servings, r.total_minutes, r.is_favorite, r.created_at, r.recipe_json
      from recipes r
      join users u on u.id = r.user_id
      where u.email = $1
      order by r.created_at desc
      limit 30
    `,
    [email],
  );

  return (
    <RecipesListClient initialRecipes={result.rows} />
  );
}

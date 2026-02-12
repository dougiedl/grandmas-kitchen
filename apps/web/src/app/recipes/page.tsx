import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

type RecipeRecord = {
  id: string;
  title: string;
  cuisine: string | null;
  servings: number | null;
  total_minutes: number | null;
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
      select r.id, r.title, r.cuisine, r.servings, r.total_minutes, r.created_at, r.recipe_json
      from recipes r
      join users u on u.id = r.user_id
      where u.email = $1
      order by r.created_at desc
      limit 30
    `,
    [email],
  );

  return (
    <section>
      <h2>Recipes</h2>
      <p>Your saved grandma-inspired recipes.</p>

      {result.rows.length === 0 ? <p>No recipes saved yet. Start cooking in Chat.</p> : null}

      <div className="recipe-list-grid">
        {result.rows.map((recipe) => (
          <article className="recipe-list-card" key={recipe.id}>
            <h3>{recipe.title}</h3>
            <p>
              {recipe.cuisine ?? "Home Style"} • {recipe.servings ?? "-"} servings • {recipe.total_minutes ?? "-"} min
            </p>
            <p className="recipe-list-date">
              Saved {new Date(recipe.created_at).toLocaleString()}
            </p>
            <h4>Ingredients</h4>
            <ul>
              {(recipe.recipe_json?.ingredients ?? []).slice(0, 6).map((ingredient) => (
                <li key={`${recipe.id}-${ingredient.amount}-${ingredient.item}`}>
                  {ingredient.amount} {ingredient.item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

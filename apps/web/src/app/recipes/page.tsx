import { auth } from "@/lib/auth/auth";
import { CommunityTrendsClient } from "@/components/community-trends-client";
import { RecipesListClient } from "@/components/recipes-list-client";
import { getPool } from "@/lib/db/pool";

type RecipeRecord = {
  id: string;
  title: string;
  cuisine: string | null;
  servings: number | null;
  total_minutes: number | null;
  is_favorite: boolean;
  is_promoted: boolean;
  created_at: string;
  recipe_json: {
    ingredients?: Array<{ amount: string; item: string }>;
  } | null;
};

type DiscoveryRow = {
  cuisine: string;
  title: string;
  recipe_count: string;
};

export default async function RecipesPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return (
      <section>
        <h2>Recipes</h2>
        <p>Sign in to view your saved recipes, family versions, and personal cooking history.</p>
      </section>
    );
  }

  const pool = getPool();
  const result = await pool.query<RecipeRecord>(
    `
      select r.id, r.title, r.cuisine, r.servings, r.total_minutes, r.is_favorite, r.is_promoted, r.created_at, r.recipe_json
      from recipes r
      join users u on u.id = r.user_id
      where u.email = $1
      order by r.created_at desc
      limit 30
    `,
    [email],
  );

  const discoveryResult = await pool.query<DiscoveryRow>(
    `
      select
        coalesce(cuisine, 'Home Style') as cuisine,
        title,
        count(*)::text as recipe_count
      from recipes
      where created_at > now() - interval '30 days'
      group by coalesce(cuisine, 'Home Style'), title
      order by count(*) desc, max(created_at) desc
      limit 12
    `,
  );

  return (
    <section className="kitchen-theme kitchen-theme-home">
      <RecipesListClient initialRecipes={result.rows} />
      <CommunityTrendsClient rows={discoveryResult.rows} />
    </section>
  );
}

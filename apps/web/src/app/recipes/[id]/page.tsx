import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeDetailActions } from "@/components/recipe-detail-actions";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

type RecipeJson = {
  ingredients?: Array<{ amount: string; item: string }>;
  steps?: string[];
  grandmaTips?: string[];
};

type RecipeDetailRecord = {
  id: string;
  user_id: string;
  thread_id: string | null;
  title: string;
  cuisine: string | null;
  servings: number | null;
  total_minutes: number | null;
  is_favorite: boolean;
  is_promoted: boolean;
  created_at: string;
  recipe_json: RecipeJson | null;
};

type VersionRow = {
  id: string;
  title: string;
  total_minutes: number | null;
  is_promoted: boolean;
  created_at: string;
  recipe_json: RecipeJson | null;
};

function summarizeCompare(current: RecipeDetailRecord, compare?: VersionRow): string {
  if (!compare) {
    return "No comparison selected";
  }

  const changes: string[] = [];
  if (current.title !== compare.title) {
    changes.push("title changed");
  }
  if (current.total_minutes !== compare.total_minutes) {
    changes.push(`time ${compare.total_minutes ?? "-"}m -> ${current.total_minutes ?? "-"}m`);
  }

  const currentIngredients = current.recipe_json?.ingredients?.length ?? 0;
  const compareIngredients = compare.recipe_json?.ingredients?.length ?? 0;
  if (currentIngredients !== compareIngredients) {
    changes.push(`ingredients ${compareIngredients} -> ${currentIngredients}`);
  }

  return changes.length ? changes.join(" • ") : "Minor wording or method differences";
}

export default async function RecipeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ compare?: string }>;
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
  const search = await searchParams;
  const compareId = search?.compare;

  const pool = getPool();
  const result = await pool.query<RecipeDetailRecord>(
    `
      select r.id, r.user_id, r.thread_id, r.title, r.cuisine, r.servings, r.total_minutes, r.is_favorite, r.is_promoted, r.created_at, r.recipe_json
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

  const versionsResult = await pool.query<VersionRow>(
    `
      select r.id, r.title, r.total_minutes, r.is_promoted, r.created_at, r.recipe_json
      from recipes r
      where r.user_id = $1 and (
        (r.thread_id is not distinct from $2)
        or r.id = $3
      )
      order by r.created_at desc
      limit 30
    `,
    [recipe.user_id, recipe.thread_id, recipe.id],
  );

  const versions = versionsResult.rows;
  let compareRecipe: VersionRow | undefined;

  if (compareId) {
    compareRecipe = versions.find((item) => item.id === compareId);
  } else {
    compareRecipe = versions.find((item) => item.id !== recipe.id);
  }

  const ingredients = recipe.recipe_json?.ingredients ?? [];
  const steps = recipe.recipe_json?.steps ?? [];
  const tips = recipe.recipe_json?.grandmaTips ?? [];
  const compareIngredients = compareRecipe?.recipe_json?.ingredients ?? [];
  const compareSteps = compareRecipe?.recipe_json?.steps ?? [];

  const versionOptions = versions
    .filter((version) => version.id !== recipe.id)
    .map((version) => ({
      id: version.id,
      label: `${new Date(version.created_at).toLocaleString()} • ${version.title}`,
    }));

  return (
    <section className="recipe-detail">
      <p>
        <Link href="/recipes">Back to Recipes</Link>
      </p>
      <h2>{recipe.title}</h2>
      <p>
        {recipe.cuisine ?? "Home Style"} • {recipe.servings ?? "-"} servings • {recipe.total_minutes ?? "-"} min
      </p>
      <p>
        {recipe.is_promoted ? "Promoted" : ""}
        {recipe.is_promoted && recipe.is_favorite ? " • " : ""}
        {recipe.is_favorite ? "Favorite recipe" : "Not marked favorite"}
      </p>
      <p className="recipe-list-date">Saved {new Date(recipe.created_at).toLocaleString()}</p>

      <RecipeDetailActions
        recipeId={recipe.id}
        compareId={compareRecipe?.id}
        compareIsPromoted={compareRecipe?.is_promoted}
        versions={versionOptions}
        exportData={{
          title: recipe.title,
          cuisine: recipe.cuisine ?? "Home Style",
          servings: String(recipe.servings ?? "-"),
          totalMinutes: String(recipe.total_minutes ?? "-"),
          ingredients,
          steps,
          grandmaTips: tips,
        }}
      />

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

      <h3>Version Compare</h3>
      <p>{summarizeCompare(recipe, compareRecipe)}</p>
      {compareRecipe ? (
        <div className="compare-grid">
          <article className="compare-card">
            <h4>Current Version</h4>
            <p>{recipe.title}</p>
            <ul>
              {ingredients.slice(0, 8).map((ingredient) => (
                <li key={`current-${ingredient.amount}-${ingredient.item}`}>
                  {ingredient.amount} {ingredient.item}
                </li>
              ))}
            </ul>
          </article>
          <article className="compare-card">
            <h4>Compared Version</h4>
            <p>{compareRecipe.title}</p>
            <ul>
              {compareIngredients.slice(0, 8).map((ingredient) => (
                <li key={`compare-${ingredient.amount}-${ingredient.item}`}>
                  {ingredient.amount} {ingredient.item}
                </li>
              ))}
            </ul>
            <h5>Step Snapshot</h5>
            <ol>
              {compareSteps.slice(0, 4).map((step) => (
                <li key={`compare-step-${step}`}>{step}</li>
              ))}
            </ol>
          </article>
        </div>
      ) : (
        <p>No other saved version yet. Regenerate from this page to create one.</p>
      )}
    </section>
  );
}

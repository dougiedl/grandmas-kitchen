"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type RecipeItem = {
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

export function RecipesListClient({ initialRecipes }: { initialRecipes: RecipeItem[] }) {
  const [recipes, setRecipes] = useState<RecipeItem[]>(initialRecipes);
  const [query, setQuery] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return recipes.filter((recipe) => {
      if (favoriteOnly && !recipe.is_favorite) {
        return false;
      }

      if (!q) {
        return true;
      }

      const haystack = `${recipe.title} ${recipe.cuisine ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [favoriteOnly, query, recipes]);

  async function toggleFavorite(recipeId: string, nextValue: boolean) {
    setError(null);

    const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: nextValue }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Failed to update favorite");
      return;
    }

    setRecipes((current) =>
      current.map((recipe) =>
        recipe.id === recipeId
          ? {
              ...recipe,
              is_favorite: nextValue,
            }
          : recipe,
      ),
    );
  }

  return (
    <section>
      <h2>Recipes</h2>
      <p>Your saved grandma-inspired recipes and family versions.</p>

      <div className="recipes-toolbar">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by dish name or cuisine"
        />
        <label>
          <input
            type="checkbox"
            checked={favoriteOnly}
            onChange={(event) => setFavoriteOnly(event.target.checked)}
          />
          Show favorites only
        </label>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {filtered.length === 0 ? <p>No recipes match this filter yet. Try another search or generate a new recipe in Chat.</p> : null}

      <div className="recipe-list-grid">
        {filtered.map((recipe) => (
          <article className="recipe-list-card" key={recipe.id}>
            <h3>
              <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
            </h3>
            <p>
              {recipe.cuisine ?? "Home Style"} • {recipe.servings ?? "-"} servings • {recipe.total_minutes ?? "-"} min
            </p>
            <p className="recipe-list-date">Saved {new Date(recipe.created_at).toLocaleString()}</p>
            <p>
              {recipe.is_promoted ? "Promoted" : ""}
              {recipe.is_promoted && recipe.is_favorite ? " • " : ""}
              {recipe.is_favorite ? "Favorite" : ""}
            </p>
            <h4>Ingredients</h4>
            <ul>
              {(recipe.recipe_json?.ingredients ?? []).slice(0, 6).map((ingredient) => (
                <li key={`${recipe.id}-${ingredient.amount}-${ingredient.item}`}>
                  {ingredient.amount} {ingredient.item}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={recipe.is_favorite ? "fav-btn fav-btn-on" : "fav-btn"}
              onClick={() => toggleFavorite(recipe.id, !recipe.is_favorite)}
            >
              {recipe.is_favorite ? "Remove Favorite" : "Save as Favorite"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

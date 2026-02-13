import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

type VersionRecord = {
  id: string;
  title: string;
  total_minutes: number | null;
  is_favorite: boolean;
  is_promoted: boolean;
  created_at: string;
  recipe_json: {
    ingredients?: Array<{ amount: string; item: string }>;
    steps?: string[];
  } | null;
};

function cuisineThemeClass(cuisine: string | null): string {
  const text = (cuisine ?? "").toLowerCase();
  if (text.includes("ital")) return "kitchen-theme-italian";
  if (text.includes("mex")) return "kitchen-theme-mexican";
  if (text.includes("greek")) return "kitchen-theme-greek";
  if (text.includes("span")) return "kitchen-theme-spanish";
  if (text.includes("french")) return "kitchen-theme-french";
  if (text.includes("leban")) return "kitchen-theme-lebanese";
  if (text.includes("pers")) return "kitchen-theme-persian";
  if (text.includes("chin")) return "kitchen-theme-chinese";
  if (text.includes("ind")) return "kitchen-theme-indian";
  if (text.includes("japan")) return "kitchen-theme-japanese";
  if (text.includes("jama")) return "kitchen-theme-jamaican";
  return "kitchen-theme-home";
}

function summarizeDiff(current: VersionRecord, previous?: VersionRecord): string {
  if (!previous) {
    return "Initial captured version";
  }

  const changes: string[] = [];
  if (current.title !== previous.title) {
    changes.push("title changed");
  }
  if (current.total_minutes !== previous.total_minutes) {
    changes.push(`time ${previous.total_minutes ?? "-"}m -> ${current.total_minutes ?? "-"}m`);
  }

  const currentIngredients = current.recipe_json?.ingredients?.length ?? 0;
  const previousIngredients = previous.recipe_json?.ingredients?.length ?? 0;
  if (currentIngredients !== previousIngredients) {
    changes.push(`ingredients ${previousIngredients} -> ${currentIngredients}`);
  }

  return changes.length ? changes.join(" • ") : "Minor method/wording changes";
}

export default async function RecipeVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return (
      <section>
        <h2>Recipe Versions</h2>
        <p>Please sign in to view recipe versions.</p>
      </section>
    );
  }

  const { id } = await params;
  const pool = getPool();

  const sourceResult = await pool.query<{
    id: string;
    user_id: string;
    thread_id: string | null;
    title: string;
    cuisine: string | null;
  }>(
    `
      select r.id, r.user_id, r.thread_id, r.title, r.cuisine
      from recipes r
      join users u on u.id = r.user_id
      where r.id = $1 and u.email = $2
      limit 1
    `,
    [id, email],
  );

  const source = sourceResult.rows[0];
  if (!source) {
    return (
      <section>
        <h2>Recipe Versions</h2>
        <p>Recipe not found.</p>
      </section>
    );
  }

  const versionsResult = await pool.query<VersionRecord>(
    `
      select r.id, r.title, r.total_minutes, r.is_favorite, r.is_promoted, r.created_at, r.recipe_json
      from recipes r
      where r.user_id = $1 and (
        (r.thread_id is not distinct from $2)
        or r.id = $3
      )
      order by r.created_at desc
      limit 50
    `,
    [source.user_id, source.thread_id, source.id],
  );

  const versions = versionsResult.rows;

  return (
    <section className={`kitchen-theme ${cuisineThemeClass(source.cuisine)}`}>
      <p>
        <Link href={`/recipes/${source.id}`}>Back to Recipe</Link>
      </p>
      <h2>Version Timeline</h2>
      <p>{source.title}</p>

      <div className="history-list">
        {versions.map((version, index) => (
          <article className="history-item" key={version.id}>
            <p>
              <strong>v{versions.length - index}</strong> • {new Date(version.created_at).toLocaleString()}
            </p>
            <p>
              <Link href={`/recipes/${version.id}`}>{version.title}</Link>
            </p>
            <p className="recipe-list-date">{summarizeDiff(version, versions[index + 1])}</p>
            <p>
              {version.is_promoted ? "Promoted" : ""}
              {version.is_promoted && version.is_favorite ? " • " : ""}
              {version.is_favorite ? "Favorite" : ""}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

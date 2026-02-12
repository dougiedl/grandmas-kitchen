import { auth } from "@/lib/auth/auth";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getPool } from "@/lib/db/pool";
import Link from "next/link";

type SummaryRow = {
  total_recipes: string;
  total_users: string;
  favorite_count: string;
  promoted_count: string;
  avg_minutes: string | null;
};

type CategoryRow = {
  category: string;
  count: string;
};

type EventRow = {
  event_name: string;
  count: string;
};

type RegenRow = {
  regeneration_style: string | null;
  count: string;
};

type CuisineQualityRow = {
  cuisine: string;
  recipe_count: string;
  feedback_count: string;
  avg_minutes: string | null;
};

function toNumber(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default async function AdminEvalsPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return (
      <section>
        <h2>Admin Evals</h2>
        <p>Please sign in.</p>
      </section>
    );
  }

  if (!isAdminEmail(email)) {
    return (
      <section>
        <h2>Admin Evals</h2>
        <p>Admin access required.</p>
      </section>
    );
  }

  const pool = getPool();
  const summaryResult = await pool.query<SummaryRow>(
    `
      select
        (select count(*) from recipes) as total_recipes,
        (select count(*) from users) as total_users,
        (select count(*) from recipes where is_favorite = true) as favorite_count,
        (select count(*) from recipes where is_promoted = true) as promoted_count,
        (select to_char(avg(total_minutes), 'FM999999.00') from recipes) as avg_minutes
    `,
  );

  const feedbackResult = await pool.query<CategoryRow>(
    `
      select category, count(*)::text as count
      from recipe_feedback
      group by category
      order by count(*) desc
      limit 10
    `,
  );

  const eventResult = await pool.query<EventRow>(
    `
      select event_name, count(*)::text as count
      from analytics_events
      where created_at > now() - interval '14 days'
      group by event_name
      order by count(*) desc
      limit 10
    `,
  );

  const regenResult = await pool.query<RegenRow>(
    `
      select parsed_entities->>'regenerationStyle' as regeneration_style, count(*)::text as count
      from messages
      where role = 'assistant' and parsed_entities ? 'recipe'
      group by parsed_entities->>'regenerationStyle'
      order by count(*) desc
      limit 10
    `,
  );

  const cuisineResult = await pool.query<CuisineQualityRow>(
    `
      select
        coalesce(r.cuisine, 'Home Style') as cuisine,
        count(distinct r.id)::text as recipe_count,
        count(f.id)::text as feedback_count,
        to_char(avg(r.total_minutes), 'FM999999.00') as avg_minutes
      from recipes r
      left join recipe_feedback f on f.recipe_id = r.id
      group by coalesce(r.cuisine, 'Home Style')
      order by count(distinct r.id) desc
      limit 12
    `,
  );

  const summary = summaryResult.rows[0];
  const totalRecipes = toNumber(summary.total_recipes);
  const totalFeedback = feedbackResult.rows.reduce((sum, row) => sum + toNumber(row.count), 0);
  const tooSalty = toNumber(feedbackResult.rows.find((row) => row.category === "too_salty")?.count);
  const tooBland = toNumber(feedbackResult.rows.find((row) => row.category === "too_bland")?.count);
  const recipeGeneratedEvents = toNumber(eventResult.rows.find((row) => row.event_name === "recipe_generated")?.count);

  const alerts: string[] = [];
  if (totalRecipes >= 10 && totalFeedback / totalRecipes > 0.8) {
    alerts.push("High feedback volume vs recipe volume. Review generation quality controls.");
  }
  if (totalFeedback > 0 && tooSalty / totalFeedback > 0.35) {
    alerts.push("Salt complaints exceed 35%. Consider lowering default salt guidance.");
  }
  if (totalFeedback > 0 && tooBland / totalFeedback > 0.35) {
    alerts.push("Blandness complaints exceed 35%. Consider stronger aromatic layering.");
  }
  if (recipeGeneratedEvents > 100 && totalFeedback < 5) {
    alerts.push("High generation volume with low feedback capture. Prompt for feedback more aggressively.");
  }

  return (
    <section>
      <h2>Admin Eval Dashboard</h2>
      <p>Quality and usage telemetry snapshot (last 14 days where applicable).</p>
      <p>
        <Link href="/api/admin/evals/report">Download Weekly CSV Report</Link>
      </p>

      <div className="alerts-panel">
        <h3>Quality Alerts</h3>
        {alerts.length === 0 ? <p>No active alerts.</p> : null}
        <ul>
          {alerts.map((alert) => (
            <li key={alert}>{alert}</li>
          ))}
        </ul>
      </div>

      <div className="admin-grid">
        <article className="admin-card">
          <h3>Core Metrics</h3>
          <p>Total recipes: {summary.total_recipes}</p>
          <p>Total users: {summary.total_users}</p>
          <p>Favorites: {summary.favorite_count}</p>
          <p>Promoted: {summary.promoted_count}</p>
          <p>Avg recipe minutes: {summary.avg_minutes ?? "-"}</p>
        </article>

        <article className="admin-card">
          <h3>Feedback Categories</h3>
          {feedbackResult.rows.length === 0 ? <p>No feedback yet.</p> : null}
          <ul>
            {feedbackResult.rows.map((row) => (
              <li key={row.category}>
                {row.category}: {row.count}
              </li>
            ))}
          </ul>
        </article>

        <article className="admin-card">
          <h3>Event Volume (14d)</h3>
          {eventResult.rows.length === 0 ? <p>No events yet.</p> : null}
          <ul>
            {eventResult.rows.map((row) => (
              <li key={row.event_name}>
                {row.event_name}: {row.count}
              </li>
            ))}
          </ul>
        </article>

        <article className="admin-card">
          <h3>Regeneration Modes</h3>
          {regenResult.rows.length === 0 ? <p>No regeneration history yet.</p> : null}
          <ul>
            {regenResult.rows.map((row) => (
              <li key={row.regeneration_style ?? "initial"}>
                {row.regeneration_style ?? "initial"}: {row.count}
              </li>
            ))}
          </ul>
        </article>

        <article className="admin-card">
          <h3>Cuisine Quality</h3>
          {cuisineResult.rows.length === 0 ? <p>No cuisine metrics yet.</p> : null}
          <ul>
            {cuisineResult.rows.map((row) => (
              <li key={row.cuisine}>
                {row.cuisine}: recipes {row.recipe_count}, feedback {row.feedback_count}, avg {row.avg_minutes ?? "-"}m
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

type TasteProfileRow = {
  last_persona_id: string | null;
  last_cuisine: string | null;
  last_regional_style: string | null;
  total_generations: number;
  updated_at: string;
};

type SignalRow = {
  cuisine: string;
  signal_label: string;
  score: string;
};

export default async function ProfilePage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return (
      <section>
        <h2>Profile</h2>
        <p>Sign in to unlock your personalized taste profile and returning grandma experience.</p>
      </section>
    );
  }

  const pool = getPool();
  const userResult = await pool.query<{ id: string }>(
    `select id from users where email = $1 limit 1`,
    [email],
  );

  const userId = userResult.rows[0]?.id;

  if (!userId) {
    return (
      <section>
        <h2>Profile</h2>
        <p>No profile data yet. Start your first chat so we can learn your family style and preferences.</p>
      </section>
    );
  }

  const tasteProfileResult = await pool.query<TasteProfileRow>(
    `
      select
        last_persona_id,
        last_cuisine,
        last_regional_style,
        total_generations,
        updated_at::text
      from user_taste_profiles
      where user_id = $1
      limit 1
    `,
    [userId],
  );

  const signalResult = await pool.query<SignalRow>(
    `
      select cuisine, signal_label, to_char(sum(confidence), 'FM999999.00') as score
      from user_preference_signals
      where user_id = $1 and created_at > now() - interval '180 days'
      group by cuisine, signal_label
      order by sum(confidence) desc
      limit 8
    `,
    [userId],
  );

  const taste = tasteProfileResult.rows[0];

  return (
    <section>
      <h2>Profile</h2>
      <p>Your experience improves over time based on your recipe history and regional cues.</p>

      <div className="admin-grid">
        <article className="admin-card">
          <h3>Taste Memory</h3>
          {taste ? (
            <>
              <p>Total generated recipes: {taste.total_generations}</p>
              <p>Last cuisine: {taste.last_cuisine ?? "-"}</p>
              <p>Last regional style: {taste.last_regional_style ?? "-"}</p>
              <p>Last persona: {taste.last_persona_id ?? "-"}</p>
              <p>Updated: {new Date(taste.updated_at).toLocaleString()}</p>
            </>
          ) : (
            <p>No taste memory yet. Start generating recipes to build your profile.</p>
          )}
        </article>

        <article className="admin-card">
          <h3>Top Regional Signals (180d)</h3>
          {signalResult.rows.length === 0 ? <p>No regional signals yet.</p> : null}
          <ul>
            {signalResult.rows.map((row) => (
              <li key={`${row.cuisine}-${row.signal_label}`}>
                {row.cuisine}: {row.signal_label} ({row.score})
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

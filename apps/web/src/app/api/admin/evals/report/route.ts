import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

function csvEscape(value: string | number | null): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const pool = getPool();

  const weeklyEvents = await pool.query<{
    event_name: string;
    count: string;
  }>(
    `
      select event_name, count(*)::text as count
      from analytics_events
      where created_at > now() - interval '7 days'
      group by event_name
      order by count(*) desc
    `,
  );

  const weeklyFeedback = await pool.query<{
    category: string;
    count: string;
  }>(
    `
      select category, count(*)::text as count
      from recipe_feedback
      where created_at > now() - interval '7 days'
      group by category
      order by count(*) desc
    `,
  );

  const cuisineQuality = await pool.query<{
    cuisine: string | null;
    recipe_count: string;
    feedback_count: string;
    avg_minutes: string | null;
  }>(
    `
      select
        coalesce(r.cuisine, 'Home Style') as cuisine,
        count(distinct r.id)::text as recipe_count,
        count(f.id)::text as feedback_count,
        to_char(avg(r.total_minutes), 'FM999999.00') as avg_minutes
      from recipes r
      left join recipe_feedback f on f.recipe_id = r.id
      where r.created_at > now() - interval '30 days'
      group by coalesce(r.cuisine, 'Home Style')
      order by count(distinct r.id) desc
    `,
  );

  const lines: string[] = [];
  lines.push("section,name,value");
  for (const row of weeklyEvents.rows) {
    lines.push([
      csvEscape("weekly_events"),
      csvEscape(row.event_name),
      csvEscape(row.count),
    ].join(","));
  }

  for (const row of weeklyFeedback.rows) {
    lines.push([
      csvEscape("weekly_feedback"),
      csvEscape(row.category),
      csvEscape(row.count),
    ].join(","));
  }

  lines.push("");
  lines.push("cuisine,recipe_count,feedback_count,avg_minutes");
  for (const row of cuisineQuality.rows) {
    lines.push([
      csvEscape(row.cuisine ?? "Home Style"),
      csvEscape(row.recipe_count),
      csvEscape(row.feedback_count),
      csvEscape(row.avg_minutes),
    ].join(","));
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="weekly-eval-report.csv"',
    },
  });
}

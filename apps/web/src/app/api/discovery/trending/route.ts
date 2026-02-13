import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

type TrendingRow = {
  cuisine: string;
  title: string;
  recipe_count: string;
  avg_total_minutes: number | null;
  last_created_at: string;
};

function normalizeLimit(rawLimit: string | null): number {
  const parsed = Number.parseInt(rawLimit ?? "", 10);
  if (Number.isNaN(parsed)) {
    return 12;
  }

  return Math.max(4, Math.min(parsed, 24));
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cuisine = request.nextUrl.searchParams.get("cuisine")?.trim() ?? "";
  const limit = normalizeLimit(request.nextUrl.searchParams.get("limit"));
  const cuisineFilter = cuisine.length > 0 ? `%${cuisine}%` : null;

  const pool = getPool();
  const result = await pool.query<TrendingRow>(
    `
      select
        coalesce(r.cuisine, 'Home Style') as cuisine,
        r.title,
        count(*)::text as recipe_count,
        round(avg(r.total_minutes))::int as avg_total_minutes,
        max(r.created_at)::text as last_created_at
      from recipes r
      where r.created_at > now() - interval '30 days'
        and ($1::text is null or coalesce(r.cuisine, 'Home Style') ilike $1)
      group by coalesce(r.cuisine, 'Home Style'), r.title
      order by count(*) desc, max(r.created_at) desc
      limit $2
    `,
    [cuisineFilter, limit],
  );

  return NextResponse.json({
    trends: result.rows,
    filters: {
      cuisine: cuisine || null,
      limit,
      windowDays: 30,
    },
  });
}

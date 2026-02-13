import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPool } from "@/lib/db/pool";

type StyleSearchRow = {
  id: string;
  label: string;
  cuisine: string;
  region: string | null;
  aliases: string[] | null;
};

function normalizeLimit(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(parsed)) {
    return 20;
  }
  return Math.max(1, Math.min(parsed, 50));
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const cuisine = request.nextUrl.searchParams.get("cuisine")?.trim() ?? "";
  const limit = normalizeLimit(request.nextUrl.searchParams.get("limit"));

  const hasQuery = q.length > 0;
  const queryLike = `%${q}%`;
  const queryPrefix = `${q}%`;
  const cuisineLike = cuisine.length > 0 ? `%${cuisine}%` : null;

  const pool = getPool();
  const result = await pool.query<StyleSearchRow>(
    `
      select
        sc.id,
        sc.label,
        sc.cuisine,
        sc.region,
        sc.aliases
      from style_catalog sc
      where sc.active = true
        and ($1::text is null or sc.cuisine ilike $1)
        and (
          $2::boolean = false
          or sc.label ilike $3
          or sc.cuisine ilike $3
          or coalesce(sc.region, '') ilike $3
          or exists (
            select 1
            from unnest(sc.aliases) as alias
            where alias ilike $3
          )
        )
      order by
        (
          case when $2::boolean and sc.label ilike $4 then 5 else 0 end
          + case when $2::boolean and coalesce(sc.region, '') ilike $4 then 4 else 0 end
          + case when $2::boolean and sc.cuisine ilike $4 then 3 else 0 end
          + case when $2::boolean and exists (
              select 1 from unnest(sc.aliases) as alias where alias ilike $4
            ) then 2 else 0 end
          + case when $2::boolean and sc.label ilike $3 then 1 else 0 end
        ) desc,
        sc.cuisine asc,
        sc.label asc
      limit $5
    `,
    [cuisineLike, hasQuery, queryLike, queryPrefix, limit],
  );

  return NextResponse.json({
    styles: result.rows.map((row) => ({
      id: row.id,
      label: row.label,
      cuisine: row.cuisine,
      region: row.region,
      aliases: row.aliases ?? [],
    })),
    filters: {
      q: q || null,
      cuisine: cuisine || null,
      limit,
    },
  });
}

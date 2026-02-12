import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getPool } from "@/lib/db/pool";
import { BASELINE_CASES } from "@/lib/evals/baseline-cases";

export async function POST() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pool = getPool();

  for (const item of BASELINE_CASES) {
    await pool.query(
      `
        insert into eval_prompt_cases (id, slug, cuisine, persona_name, prompt, tags, active)
        values ($1, $2, $3, $4, $5, $6::text[], true)
        on conflict (slug)
        do update set
          cuisine = excluded.cuisine,
          persona_name = excluded.persona_name,
          prompt = excluded.prompt,
          tags = excluded.tags,
          active = true
      `,
      [randomUUID(), item.slug, item.cuisine, item.personaName, item.prompt, item.tags],
    );
  }

  return NextResponse.json({ seeded: BASELINE_CASES.length });
}

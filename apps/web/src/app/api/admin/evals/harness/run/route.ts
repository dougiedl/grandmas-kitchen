import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getPool } from "@/lib/db/pool";
import { runEvalHarness } from "@/lib/evals/run-harness";

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
  const userResult = await pool.query<{ id: string }>(
    `select id from users where email = $1 limit 1`,
    [email],
  );

  try {
    const summary = await runEvalHarness(userResult.rows[0]?.id);
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run eval harness";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

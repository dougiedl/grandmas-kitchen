import { auth } from "@/lib/auth/auth";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { EvalHarnessClient } from "@/app/admin/evals/harness/ui";

export default async function AdminEvalsHarnessPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return (
      <section>
        <h2>Eval Harness</h2>
        <p>Please sign in.</p>
      </section>
    );
  }

  if (!isAdminEmail(email)) {
    return (
      <section>
        <h2>Eval Harness</h2>
        <p>Admin access required.</p>
      </section>
    );
  }

  return <EvalHarnessClient />;
}

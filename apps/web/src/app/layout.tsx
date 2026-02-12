import type { Metadata } from "next";
import "../styles/globals.css";
import { auth } from "@/lib/auth/auth";
import { TopNav } from "@/components/top-nav";
import Link from "next/link";
import type { Session } from "next-auth";

export const metadata: Metadata = {
  title: "Grandma's Kitchen",
  description: "Grandma-inspired recipes that feel like home",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let session: Session | null = null;

  try {
    session = await auth();
  } catch (error) {
    console.error("Auth session load failed in layout", error);
  }

  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <h1>Grandma&apos;s Kitchen</h1>
          <TopNav />
          <div className="auth-row">
            {session?.user?.email ? (
              <>
                <span className="auth-email">{session.user.email}</span>
                <Link href="/api/auth/signout?callbackUrl=/">Sign out</Link>
              </>
            ) : (
              <Link href="/api/auth/signin?provider=google&callbackUrl=/chat">
                Sign in with Google
              </Link>
            )}
          </div>
        </header>
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}

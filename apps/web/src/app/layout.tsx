import type { Metadata } from "next";
import "../styles/globals.css";
import { auth } from "@/lib/auth/auth";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "Grandma's Kitchen",
  description: "Grandma-inspired recipes that feel like home",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <h1>Grandma's Kitchen</h1>
          <TopNav />
          <div className="auth-row">
            {session?.user?.email ? (
              <>
                <span className="auth-email">{session.user.email}</span>
                <a href="/api/auth/signout?callbackUrl=/">Sign out</a>
              </>
            ) : (
              <a href="/api/auth/signin/google?callbackUrl=/chat">Sign in with Google</a>
            )}
          </div>
        </header>
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile?.email) {
        token.email = profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user?.email && token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) {
          return url;
        }
      } catch {
        return `${baseUrl}/chat`;
      }

      return `${baseUrl}/chat`;
    },
  },
  trustHost: true,
});

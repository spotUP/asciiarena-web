import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        login: { label: "Nick or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null;

        const user = await prisma.users.findFirst({
          where: {
            OR: [
              { nick: credentials.login as string },
              { mail: credentials.login as string },
            ],
          },
        });

        if (!user?.pwhash) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.pwhash);
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.nick,
          email: user.mail ?? undefined,
          rank: user.rank,
          crew: user.crew,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rank = user.rank ?? null;
        token.crew = user.crew ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.rank = (token.rank as string | null | undefined) ?? null;
        session.user.crew = (token.crew as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
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
          crt_effect: user.crt_effect,
          anim_effect: user.anim_effect,
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
        token.crt_effect = (user as { crt_effect?: string }).crt_effect ?? "N";
        token.anim_effect = (user as { anim_effect?: string }).anim_effect ?? "N";
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.rank = (token.rank as string | null | undefined) ?? null;
        session.user.crew = (token.crew as string | null | undefined) ?? null;
        (session.user as { crt_effect?: string }).crt_effect = (token.crt_effect as string) ?? "N";
        (session.user as { anim_effect?: string }).anim_effect = (token.anim_effect as string) ?? "N";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

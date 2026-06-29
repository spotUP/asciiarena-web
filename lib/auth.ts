import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rank = user.rank ?? null;
        token.crew = user.crew ?? null;
        token.crt_effect = (user as { crt_effect?: string }).crt_effect ?? "N";
        token.anim_effect = (user as { anim_effect?: string }).anim_effect ?? "N";
      }
      // Re-read rank from DB on every token refresh so stale tokens self-heal
      if (token.id && !token.rank) {
        const fresh = await prisma.users.findFirst({
          where: { id: parseInt(token.id as string) },
          select: { rank: true, crew: true },
        });
        if (fresh) {
          token.rank = fresh.rank ?? null;
          token.crew = fresh.crew ?? null;
        }
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
  events: {
    // Record the sign-in as a "call" so the Last Callers widget reflects real
    // recent logins (the table was previously never written, so it only showed
    // stale legacy data). One row per user: replace any prior row, stamp now.
    async signIn({ user }) {
      try {
        const uid = user?.id ? parseInt(user.id, 10) : NaN;
        if (!Number.isFinite(uid)) return;
        const nick = (user?.name ?? "").slice(0, 60);
        const crew = ((user as { crew?: string | null }).crew ?? "").slice(0, 60);
        const timestamp = Math.floor(Date.now() / 1000);
        await prisma.lastusers.deleteMany({ where: { user_id: uid } });
        await prisma.lastusers.create({ data: { user_id: uid, nick, crew, timestamp } });
        // The widget's cache (unstable_cache, 71s TTL) picks this up on its next
        // revalidate — within ~71s.
      } catch {
        /* never block login on a callers-log write */
      }
    },
  },
  pages: {
    signIn: "/login",
  },
});

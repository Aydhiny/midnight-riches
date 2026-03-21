import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Discord from "next-auth/providers/discord";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens, wallets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signInSchema } from "@/lib/validators";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
    maxAge: THIRTY_DAYS,
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [GitHub({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET,
          allowDangerousEmailAccountLinking: true,
        })]
      : []),
    ...(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET
      ? [Discord({
          clientId: process.env.AUTH_DISCORD_ID,
          clientSecret: process.env.AUTH_DISCORD_SECRET,
          allowDangerousEmailAccountLinking: true,
        })]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, parsed.data.email),
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? undefined;
        // Don't store base64 images in JWT (4 KB cookie limit)
        if (user.image && !user.image.startsWith("data:")) {
          token.image = user.image;
        }
        delete token.picture;
        // Fetch role from DB on first sign-in
        if (user.id) {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
            columns: { role: true },
          });
          if (dbUser) token.role = dbUser.role;
        }
      }
      // Backfill role for sessions created before role was added to JWT
      if (!token.role && token.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
          columns: { role: true },
        });
        if (dbUser) token.role = dbUser.role;
      }
      // Handle updateSession() calls from the client
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        // Only persist URL-based images in the JWT, not base64
        if (session.image !== undefined && !session.image.startsWith("data:")) {
          token.image = session.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id)    session.user.id    = token.id    as string;
        if (token.name)  session.user.name  = token.name  as string;
        if (token.image) session.user.image = token.image as string;
        if (token.role)  session.user.role  = token.role  as string;
      }
      return session;
    },
  },
  events: {
    /**
     * Fires after every successful sign-in.
     * OAuth providers (Google, GitHub, Discord) already verify the user's email,
     * so we stamp emailVerified immediately — no email confirmation step needed.
     */
    async signIn({ user, account }) {
      if (account?.provider && account.provider !== "credentials" && user.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id),
          columns: { emailVerified: true },
        });
        if (dbUser && !dbUser.emailVerified) {
          await db
            .update(users)
            .set({ emailVerified: new Date() })
            .where(eq(users.id, user.id));
        }
      }
    },
    /** Fires when a brand-new user row is created (OAuth first sign-in). */
    async createUser({ user }) {
      if (user.id) {
        // onConflictDoNothing guards against the rare double-fire edge case
        await db
          .insert(wallets)
          .values({ userId: user.id, balance: "1000.00", currency: "USD" })
          .onConflictDoNothing();
      }
    },
  },
});

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

        const skipVerification = process.env.SKIP_EMAIL_VERIFICATION === "true";
        if (!user.emailVerified && !skipVerification) {
          throw new Error("EmailNotVerified");
        }

        // If 2FA is enabled, signal the client to redirect to the 2FA page.
        // We encode the userId in the error so the /auth/verify-2fa page can
        // retrieve the pending state from its server action.
        if (user.twoFactorEnabled) {
          throw new Error(`2FARequired:${user.id}`);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    // ── 2FA bypass: called after TOTP is verified client-side ─────────────────
    // The /auth/verify-2fa page calls verifyLogin2FAAction() first (server action),
    // then calls signIn("2fa-bypass", { userId }) to complete the session.
    Credentials({
      id: "2fa-bypass",
      name: "2fa-bypass",
      credentials: { userId: { label: "User ID", type: "text" } },
      async authorize(credentials) {
        if (!credentials?.userId) return null;
        const userId = credentials.userId as string;
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { id: true, email: true, name: true, twoFactorEnabled: true },
        });
        // Only allow users that actually have 2FA enabled through this provider
        if (!user?.twoFactorEnabled) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? undefined;
        delete token.picture;
        // Fetch role + image from DB on first sign-in
        if (user.id) {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
            columns: { role: true, image: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            if (dbUser.image) {
              if (dbUser.image.startsWith("data:")) {
                // Base64 is too large for the JWT cookie — serve via API route
                token.image = `/api/profile/avatar`;
              } else {
                // Plain URL (Google, GitHub, custom upload) — store directly
                token.image = dbUser.image;
              }
            } else if (user.image && !user.image.startsWith("data:")) {
              // No DB image yet — fall back to OAuth provider picture
              token.image = user.image;
            }
          }
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
      const isOAuth = account?.provider &&
        account.provider !== "credentials" &&
        account.provider !== "2fa-bypass";
      if (isOAuth && user.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id),
          columns: { emailVerified: true, image: true },
        });

        const updates: Partial<typeof users.$inferInsert> = {};

        if (dbUser && !dbUser.emailVerified) {
          updates.emailVerified = new Date();
        }

        // Persist the OAuth provider's profile picture unless the user has
        // a custom base64 avatar uploaded through settings.
        if (
          user.image &&
          !user.image.startsWith("data:") &&
          (!dbUser?.image || !dbUser.image.startsWith("data:"))
        ) {
          updates.image = user.image;
        }

        if (Object.keys(updates).length > 0) {
          await db.update(users).set(updates).where(eq(users.id, user.id));
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

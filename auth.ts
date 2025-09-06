import NextAuth from "next-auth";
import { UserRole, Division, Section } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getUserById } from "@/data/user";
import { db } from "@/lib/db";
import authConfig from "@/auth.config";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return true;

      const existingUser = await getUserById(user.id);

      if (!existingUser?.emailVerified) return false;

      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);

        if (!twoFactorConfirmation) return false;

        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id },
        });
      }

      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      if (token.division && session.user) {
        session.user.division = token.division as Division;
      }

      if (token.section && session.user) {
        session.user.section = token.section as Section;
      }

      if (session.user) {
        session.user.isApproved = token.isApproved as boolean;
      }

      if (token.accessToken) {
        (session as any).accessToken = token.accessToken;
      }

      return session;
    },
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      if (account?.refresh_token) {
        token.refreshToken = account.refresh_token;
      }

      if (account?.expires_at) {
        token.accessTokenExpires = account.expires_at * 1000;
      }

      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;

      token.role = existingUser.role;
      token.division = existingUser.division;
      token.section = existingUser.section;
      token.isApproved = existingUser.isApproved;

      return token;
    },
  },
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 20 * 60,
  },
  ...authConfig,
});

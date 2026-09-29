import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { db } from '@/src/infrastructure/database';
import type { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  providers: [
    // ── Google OAuth ──────────────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),

    // ── Email + password ──────────────────────────────────────────────────────
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          select: { id: true, email: true, role: true, passwordHash: true },
        });

        if (!user) return null;

        if (!user.passwordHash) {
          // Seed accounts (dev only) — accept any non-empty password
          if (process.env.NODE_ENV === 'production') return null;
        } else {
          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;
        }

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],

  callbacks: {
    /**
     * signIn callback — runs for every provider.
     * For Google: upsert user + student profile on first sign-in.
     */
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) return false;

        const email = user.email.toLowerCase().trim();

        let dbUser = await db.user.findUnique({
          where: { email },
          select: { id: true, role: true },
        });

        if (!dbUser) {
          // New Google user → create User + Student profile atomically
          const [firstName, ...rest] = (user.name ?? email.split('@')[0]).split(' ');
          const lastName = rest.join(' ') || '';

          dbUser = await db.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: { email, role: 'STUDENT' },
            });
            await tx.student.create({
              data: {
                userId: newUser.id,
                firstName: firstName ?? '',
                lastName,
                nationality: '',
                currentCountry: '',
              },
            });
            return { id: newUser.id, role: 'STUDENT' as UserRole };
          });
        }

        // Inject our DB id + role into the NextAuth user object
        user.id = dbUser.id;
        (user as unknown as { role: UserRole }).role = dbUser.role;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { id: string; email: string; role: UserRole }).role;
      }
      // Google re-login: role may not be on the token yet — reload from DB
      if (account?.provider === 'google' && !token.role) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email! },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
};

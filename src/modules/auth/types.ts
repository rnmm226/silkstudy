import type { UserRole } from '@prisma/client';
import 'next-auth';
import 'next-auth/jwt';

/**
 * Augment NextAuth types so `session.user.id` and `session.user.role`
 * are strongly typed throughout the app.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

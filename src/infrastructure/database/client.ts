import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma client.
 * In development, reuse the global instance to avoid exhausting the connection
 * pool when Next.js hot-reloads. In production, create a single instance.
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.APP_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });
}

export const db: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.APP_ENV !== 'production') {
  globalThis.__prisma = db;
}

export default db;

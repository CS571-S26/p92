import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@skinshi/auth-worker/router';

const AUTH_WORKER_URL = process.env.AUTH_WORKER_URL || 'https://auth.skinshi.com';

/**
 * Server-side tRPC client for SSR data fetching.
 * This bypasses the Next.js API route and calls the auth worker directly.
 */
export function createServerTRPCClient() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${AUTH_WORKER_URL}/trpc`,
        transformer: superjson,
        // No auth needed for server-to-server public procedures
        headers: () => ({
          'x-server-side': 'true',
        }),
      }),
    ],
  });
}

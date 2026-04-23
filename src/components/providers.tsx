'use client';

// Re-export from the new tRPC setup for backward compatibility
// Use @/trpc/client for new code
export { TRPCReactProvider as TrpcProvider, useTRPC } from '@/trpc/client';
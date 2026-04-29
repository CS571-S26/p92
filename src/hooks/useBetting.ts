import { useTRPC } from '@/trpc/client';
import { useMutation } from '@tanstack/react-query';

export function useBetTrade() {
  const trpc = useTRPC();
  return useMutation(trpc.bet.trade.mutationOptions());
}

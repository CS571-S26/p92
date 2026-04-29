import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';

export function useSteamProfile() {
  const trpc = useTRPC();
  return useQuery(trpc.user.profile.queryOptions());
}

export function useUserInventory(enabled = true) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.user.inventory.queryOptions(),
    enabled,
  });
}

export function useUserBets(enabled = true) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.user.bets.queryOptions(),
    enabled,
  });
}

export function useClaimPayout() {
  const trpc = useTRPC();
  return useMutation(trpc.bet.claimPayout.mutationOptions());
}

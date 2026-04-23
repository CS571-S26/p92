import HomeClient from '@/components/HomeClient';
import type { UserBet } from '@/types/market';

// Metadata for SEO
export const metadata = {
  title: "Skinshi - Bet CS2 Cases on Prediction Markets",
  description: "Bet your CS2 skins and cases on real-world prediction markets powered by Polymarket",
};

export default function Home() {
  // No SSR prefetching - let client fetch fresh data
  const initialBets: UserBet[] = [];

  return (
    <HomeClient
      initialBets={initialBets}
    />
  );
}

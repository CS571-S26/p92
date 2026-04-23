// Shared types for markets across the web app

/**
 * User bet type
 */
export interface UserBet {
  bet_id: string;
  market: {
    slug: string;
    market_id: string;
    question: string;
    icon_url?: string;
    end_date?: Date;
    status?: string;
  };
  outcome: string;
  item_count: number;
  trade_status: string;
}

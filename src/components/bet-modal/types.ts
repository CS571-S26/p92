import type { OurMarket } from "@skinshi/api/schemas";

// Inventory item from tRPC (snake_case from backend)
export interface InventoryAsset {
  assetid: string;
  classid: string;
  name: string;
  icon_url: string;
}

// Internal format for BetModal (camelCase)
export interface InventoryItem {
  assetId: string;
  classId: string;
  name: string;
  tradable: boolean;
  iconUrl: string;
  isCase: boolean;
}

export interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: {
    bet_id: string;
    market_slug: string;
    market_id: string;
    outcome: string;
    trade_offer_id: string;
    trade_status: string;
    trade_expires_at: string;
    item_count: number;
  }) => void;
  market: OurMarket;
  outcome: "yes" | "no";
}

// Grouped inventory item for display
export interface GroupedItem {
  classId: string;
  name: string;
  iconUrl: string;
  availableAssetIds: string[];
  inPoolAssetIds: string[];
}

// Pool item stores the actual assetIds
export interface PoolItem {
  classId: string;
  name: string;
  iconUrl: string;
  assetIds: string[];
}

/**
 * Steam service wrapper for SSR
 * 
 * Provides typed async functions for calling the Steam microservice.
 * Use these in Server Components and Server Actions.
 */

import { getSteamClient, promisify } from './grpc';
import type {
  SteamProfile,
  InventoryItem,
  CaseInfo,
} from '@/proto/steam/steam';

/**
 * Get a Steam user's profile
 */
export async function getSteamProfile(steamId: string): Promise<SteamProfile | null> {
  const client = getSteamClient();

  try {
    const response = await promisify(client.getProfile.bind(client))({ steamId });

    if (response.error) {
      console.error('Steam profile error:', response.error);
      return null;
    }

    return response.profile ?? null;
  } catch (error) {
    console.error('Failed to fetch Steam profile via gRPC:', error);
    throw error;
  }
}

/**
 * Get a Steam user's inventory
 */
export async function getSteamInventory(
  steamId: string,
  casesOnly: boolean = false
): Promise<InventoryItem[]> {
  console.log(`[SteamService] Getting inventory for ${steamId}, casesOnly: ${casesOnly}`);
  const client = getSteamClient();
  console.log(`[SteamService] Got client, calling getInventory...`);

  try {
    const response = await promisify(client.getInventory.bind(client))({
      steamId,
      casesOnly,
    });
    console.log(`[SteamService] Got response:`, { itemsCount: response.items?.length, error: response.error });

    if (response.error) {
      console.error('Steam inventory error:', response.error);
      return [];
    }

    return response.items;
  } catch (error) {
    console.error('Failed to fetch Steam inventory via gRPC:', error);
    throw error;
  }
}

/**
 * Get the bot's inventory (for payout availability)
 */
export async function getBotInventory(casesOnly: boolean = true): Promise<InventoryItem[]> {
  const client = getSteamClient();
  
  try {
    const response = await promisify(client.getBotInventory.bind(client))({
      casesOnly,
    });
    
    if (response.error) {
      console.error('Bot inventory error:', response.error);
      return [];
    }
    
    return response.items;
  } catch (error) {
    console.error('Failed to fetch bot inventory:', error);
    return [];
  }
}

/**
 * Get the case whitelist
 */
export async function getCaseWhitelist(): Promise<CaseInfo[]> {
  const client = getSteamClient();
  
  try {
    const response = await promisify(client.getCaseWhitelist.bind(client))({});
    return response.cases;
  } catch (error) {
    console.error('Failed to fetch case whitelist:', error);
    return [];
  }
}

/**
 * Validate a trade URL and check if it matches the expected Steam ID
 */
export async function validateTradeUrl(
  tradeUrl: string,
  steamId: string
): Promise<{ valid: boolean; partnerId: string; error: string }> {
  const client = getSteamClient();
  
  try {
    const response = await promisify(client.validateTradeUrl.bind(client))({
      tradeUrl,
      steamId,
    });
    
    return {
      valid: response.valid,
      partnerId: response.partnerId,
      error: response.error,
    };
  } catch (error) {
    console.error('Failed to validate trade URL:', error);
    return {
      valid: false,
      partnerId: '',
      error: 'service_unavailable',
    };
  }
}

/**
 * Polymarket service wrapper for SSR
 * 
 * Provides typed async functions for calling the Polymarket microservice.
 * Use these in Server Components and Server Actions.
 */

import { getPolymarketClient, promisify } from './grpc';
import type { Market, MarketResolution } from '@/proto/polymarket/polymarket';

/**
 * Get all tracked markets
 */
export async function getMarkets(slugs?: string[]): Promise<Market[]> {
  const client = getPolymarketClient();
  
  try {
    const response = await promisify(client.getMarkets.bind(client))({
      slugs: slugs || [],
    });
    
    return response.markets;
  } catch (error) {
    console.error('Failed to fetch markets:', error);
    return [];
  }
}

/**
 * Get a specific market by slug
 */
export async function getMarket(
  slug: string,
  marketId?: string
): Promise<Market | null> {
  const client = getPolymarketClient();
  
  try {
    const response = await promisify(client.getMarket.bind(client))({
      slug,
      marketId: marketId || '',
    });
    
    if (response.error) {
      console.error('Polymarket error:', response.error);
      return null;
    }
    
    return response.market ?? null;
  } catch (error) {
    console.error('Failed to fetch market:', error);
    return null;
  }
}

/**
 * Fetch fresh market data from Polymarket API (bypasses cache)
 */
export async function fetchMarket(slug: string): Promise<Market[]> {
  const client = getPolymarketClient();
  
  try {
    const response = await promisify(client.fetchMarket.bind(client))({ slug });
    
    if (response.error) {
      console.error('FetchMarket error:', response.error);
      return [];
    }
    
    return response.markets;
  } catch (error) {
    console.error('Failed to fetch market from API:', error);
    return [];
  }
}

/**
 * Check for resolved markets
 */
export async function checkResolutions(slugs?: string[]): Promise<MarketResolution[]> {
  const client = getPolymarketClient();
  
  try {
    const response = await promisify(client.checkResolutions.bind(client))({
      slugs: slugs || [],
    });
    
    return response.resolutions;
  } catch (error) {
    console.error('Failed to check resolutions:', error);
    return [];
  }
}

/**
 * Get list of tracked market slugs
 */
export async function getTrackedMarkets(): Promise<{ slugs: string[]; slugIds: string[] }> {
  const client = getPolymarketClient();
  
  try {
    const response = await promisify(client.getTrackedMarkets.bind(client))({});
    
    return {
      slugs: response.slugs,
      slugIds: response.slugIds,
    };
  } catch (error) {
    console.error('Failed to get tracked markets:', error);
    return { slugs: [], slugIds: [] };
  }
}

/**
 * Add a market to tracking
 */
export async function addTrackedMarket(
  slug: string,
  marketId?: string
): Promise<{ success: boolean; market: Market | null; error: string }> {
  const client = getPolymarketClient();
  
  try {
    const response = await promisify(client.addTrackedMarket.bind(client))({
      slug,
      marketId: marketId || '',
    });
    
    return {
      success: response.success,
      market: response.market ?? null,
      error: response.error,
    };
  } catch (error) {
    console.error('Failed to add tracked market:', error);
    return {
      success: false,
      market: null,
      error: 'service_unavailable',
    };
  }
}

/**
 * Remove a market from tracking
 */
export async function removeTrackedMarket(
  slug: string,
  marketId?: string
): Promise<{ success: boolean; error: string }> {
  const client = getPolymarketClient();
  
  try {
    const response = await promisify(client.removeTrackedMarket.bind(client))({
      slug,
      marketId: marketId || '',
    });
    
    return {
      success: response.success,
      error: response.error,
    };
  } catch (error) {
    console.error('Failed to remove tracked market:', error);
    return {
      success: false,
      error: 'service_unavailable',
    };
  }
}

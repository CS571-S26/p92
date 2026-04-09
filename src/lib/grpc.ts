/**
 * gRPC client utilities for Next.js Server-Side Rendering (SSR)
 * 
 * These clients are used in Server Components and Server Actions to
 * directly call the Steam and Polymarket microservices via gRPC.
 * 
 * NOTE: This file should only be imported in server-side code.
 * For client-side data fetching, use the REST API via axios.
 */

import * as grpc from "@grpc/grpc-js";
import { SteamServiceClient } from "@/proto/steam/steam.grpc-client";
import { PolymarketServiceClient } from "@/proto/polymarket/polymarket.grpc-client";

// Service addresses from environment variables (validated at runtime)
const STEAM_SERVICE_ADDR = process.env.STEAM_SERVICE_ADDR;
const POLYMARKET_SERVICE_ADDR = process.env.POLYMARKET_SERVICE_ADDR;

let steamClient: SteamServiceClient | null = null;
let polymarketClient: PolymarketServiceClient | null = null;

/**
 * Get the Steam gRPC client
 */
export function getSteamClient(): SteamServiceClient {
  if (!steamClient) {
    if (!STEAM_SERVICE_ADDR) {
      throw new Error("STEAM_SERVICE_ADDR environment variable is required");
    }
    console.log("[gRPC] Creating new Steam client for:", STEAM_SERVICE_ADDR);
    steamClient = new SteamServiceClient(
      STEAM_SERVICE_ADDR,
      grpc.credentials.createInsecure()
    );

    steamClient.waitForReady(Date.now() + 5000, (err) => {
      if (err) {
        console.error("[gRPC] Steam client not ready:", err.message);
      } else {
        console.log("[gRPC] Steam client ready");
      }
    });
  }

  return steamClient;
}

/**
 * Get the Polymarket gRPC client
 */
export function getPolymarketClient(): PolymarketServiceClient {
  if (!polymarketClient) {
    if (!POLYMARKET_SERVICE_ADDR) {
      throw new Error("POLYMARKET_SERVICE_ADDR environment variable is required");
    }
    polymarketClient = new PolymarketServiceClient(
      POLYMARKET_SERVICE_ADDR,
      grpc.credentials.createInsecure()
    );

    polymarketClient.waitForReady(Date.now() + 3000, (err) => {
      if (err) {
        console.error("[gRPC] Polymarket client not ready:", err.message);
      }
    });
  }

  return polymarketClient;
}

/**
 * Helper to promisify gRPC callback-style calls
 */
export function promisify<TRequest, TResponse>(
  method: (request: TRequest, callback: (err: grpc.ServiceError | null, response?: TResponse) => void) => grpc.ClientUnaryCall
): (request: TRequest) => Promise<TResponse> {
  return (request: TRequest) => {
    return new Promise<TResponse>((resolve, reject) => {
      method(request, (err, response) => {
        if (err) {
          reject(err);
        } else if (response) {
          resolve(response);
        } else {
          reject(new Error("No response received"));
        }
      });
    });
  };
}

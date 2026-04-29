# Skinshi

Bet your CS2 cases on real-world prediction markets powered by Polymarket.

## What It Does

Skinshi lets you wager actual CS2 (Counter-Strike 2) skins and cases on the outcome of Polymarket events — sports, politics, crypto, and more. Instead of depositing cash, you stake items directly from your Steam inventory.

### Core Features

- **Browse Active Markets** — View a grid of live prediction markets pulled from Polymarket. Each card shows the market question, status, betting deadline, and an odds comparison between Polymarket's on-chain probabilities and Skinshi's internal pool (what users have actually bet).
- **Bet with CS2 Cases** — Click **YES** or **NO** on any open market to open a drag-and-drop modal. Select cases from your Steam inventory, add them to a betting pool, and confirm. A Steam trade offer is sent to escrow your items.
- **Steam Account Linking** — Connect your Steam account via OpenID so the app can read your profile, inventory, and send/receive trade offers.
- **Settings & Inventory** — View your linked Steam profile, browse your full CS2 inventory, and manage your Steam Trade URL.
- **Trade History & Payouts** — Track all your active and resolved bets. When a market resolves in your favor, claim your payout to receive your cases back (and then some) via a Steam trade offer.

## How It Talks to the Backend

The frontend is a Next.js app that communicates with the rest of the stack through a single tRPC gateway.

### Request Flow

```
Next.js Frontend
  → /api/trpc proxy route
    → Auth Worker (Cloudflare Worker)
      → SQLite Database (Drizzle ORM)
      → Polymarket Service
      → Steam Service
```

### Authentication

- Users log in with email/password via **Firebase Authentication** on the client.
- Firebase ID tokens are sent with every tRPC request and verified by the Auth Worker.
- Steam linking is handled through an **OpenID 2.0** flow initiated by the Auth Worker, which stores temporary state in a Cloudflare KV cache before redirecting to Steam.

### tRPC Routers

| Router | Purpose |
|--------|---------|
| `polymarket` | Fetches market metadata and live odds from the Polymarket microservice. Markets are mirrored in a local SQLite table to track open/resolved status and internal betting pools. |
| `user` | Returns the logged-in user's Steam profile, CS2 inventory (fetched via the Steam microservice), and full bet history from the database. |
| `bet` | `trade` places a bet: validates the market is open, checks the user hasn't already bet on it, sends a trade offer through the Steam microservice to hold the cases, and writes the bet to the DB. `claimPayout` sends winnings back via the Steam microservice when a market resolves in the user's favor. |
| `steam` | Initiates the Steam OpenID linking handshake. |
| `admin` | Protected endpoints for adding, deleting, resolving markets, and syncing bet statuses after market resolution. |

### Microservices

- **Polymarket Service** — Wraps the Polymarket API to serve market data and odds.
- **Steam Service** — Handles all Steam-facing operations: resolving Steam IDs, fetching CS2 inventories, and sending/receiving trade offers through a Steam bot.

### Database

The Auth Worker uses SQLite (via Drizzle ORM) to store:
- `users` — Firebase UID to Steam ID mappings
- `markets` — Local mirror of Polymarket markets with status, outcome, and total pools
- `bets` — Buy-in items, payout items, market outcome, and status (`active`, `payout_pending`, `lost`, `paid`, `cancelled`)

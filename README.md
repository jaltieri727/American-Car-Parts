# CrankOver

CrankOver is a marketplace for classic car parts. The app uses React, TypeScript, and Vite for the interface; Convex for data and backend functions; Clerk for sign-in; and Stripe for checkout and seller payouts.

## Project structure

- `components/` — shared interface components
- `pages/` — site and dashboard pages
- `context/` — client-side navigation state
- `convex/` — database schema, queries, mutations, actions, and HTTP handlers
- `data/` — shared catalog options
- `public/` — static assets
- `tests/` — automated tests

## Run locally

Use Node.js 22 and pnpm 10.16.1. Install dependencies and create a local configuration file:

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
```

In PowerShell, `Copy-Item .env.example .env.local` can be used for the last command. Set `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CONVEX_URL` in `.env.local` using your Clerk and Convex configuration. These are client-side values; keep secret keys out of `VITE_` variables and out of Git.

Start Convex in one terminal:

```sh
pnpm exec convex dev
```

Start the interface in another terminal:

```sh
pnpm dev
```

Vite serves the app on port 3000. Features such as payments, email, and AI also require their corresponding server-side credentials to be configured in Convex.

## Checks

```sh
pnpm typecheck
pnpm test
pnpm build
```

The build output is written to `dist/`. It and `.env.local` are ignored by Git.

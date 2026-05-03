# Balkon Website

Balkon Website is the Next.js + TypeScript web dashboard for the Balkon ecosystem.

It is the browser-based control panel for the Discord bot, backend API, streamer workflows, OBS control, economy modules and admin tools.

The repository is independent from the main backend repository:

- main backend/bot/API: `phenibut645/balkon`
- website/dashboard: `phenibut645/balkon-website`
- desktop OBS agent: `phenibut645/balkon-obs-agent`

The website may be checked out next to or inside the main backend workspace for local convenience, but it is its own Git repository.

---

## Current Status

The website is no longer a placeholder. It is an active dashboard used by the Balkon system.

Implemented areas include:

- Discord OAuth2 login through the backend API
- session-based authenticated dashboard
- user profile and overview
- inventory
- market
- bot shop
- OBS shop
- OBS history
- crafting
- jobs / work system
- notifications
- streamer application form
- Streamer Studio
- OBS Agent setup/status UI
- OBS control UI
- streamer services management
- admin dashboard
- admin streamers and streamer applications
- admin items
- admin jobs
- item localization RU/EN/ET
- UI localization RU/EN/ET
- streamer mode privacy masking

---

## Role in the Ecosystem

Balkon Website does not talk directly to Discord or OBS Studio.

The intended architecture is:

```text
Browser / Balkon Website
      ↓ HTTP + session cookie
Balkon backend API
      ↓ MySQL / service layer / bot command queue / OBS relay
Discord bot and OBS Agent
      ↓
Discord server / local OBS Studio
```

The website is a visual control panel for backend and bot features. Sensitive operations are validated on the backend. The frontend must not store Discord bot tokens, Discord OAuth client secrets, OBS Agent tokens or raw OBS credentials.

---

## Authentication Flow

OAuth2 is handled by the backend API, not by the frontend.

```text
website login button
      ↓
GET /api/auth/discord
      ↓
Discord OAuth2 authorize screen
      ↓
GET /api/auth/discord/callback
      ↓
backend creates httpOnly session cookie
      ↓
website calls /api/me with credentials included
```

Important rules:

- website calls API with `credentials: "include"`
- website does not store Discord OAuth client secret
- website does not add manual `Authorization` headers for normal dashboard calls
- production auth relies on backend session cookies

---

## Local Development

### Requirements

- Node.js
- npm
- running Balkon backend API, normally on `http://localhost:3001`

### Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Expected local URLs:

```text
Website: http://localhost:3000
API:     http://localhost:3001
```

The `.env.local` file should point the website to the backend API URL.

---

## Common Scripts

```bash
npm run dev      # start Next.js dev server
npm run lint     # run lint checks
npm run build    # build production Next.js app
npm run start    # start built app if configured
```

Before pushing larger frontend changes, run:

```bash
npm run lint
npm run build
```

---

## Main Dashboard Areas

### User Areas

- **Overview** — user summary, balance, quick stats
- **Profile** — Discord user profile and account information
- **Inventory** — owned item instances, item details, sell/list actions
- **Market** — player-to-player listings with pagination and identity display
- **Bot shop** — system shop items and OBS shop entry points
- **Craft** — crafting recipes and craft execution
- **Jobs** — cooldown-based work actions that reward ODM and optional items
- **Notifications** — user notifications
- **Streamer application** — user can request access to become a streamer
- **Streamer Studio** — streamer-specific management and OBS control

### Streamer / OBS Areas

- **Streamer Studio list** — accessible streamers
- **OBS Agent setup** — pairing, status, token-safe setup UI
- **OBS control** — scenes, sources, preview/control actions
- **Streamer services** — owner/manager configuration of streamer-specific OBS services
- **OBS shop** — user-facing streamer OBS effects/services
- **OBS history** — history of OBS actions/effects

### Admin Areas

- **Admin dashboard** — global system stats
- **Servers** — server/guild management views
- **Logs** — operational logs where available
- **OBS** — OBS-related admin tools
- **Items** — item template creation/editing, including RU/EN/ET item localization
- **Jobs** — admin configuration for cooldown-based work actions
- **Currency** — economy and balance tools
- **Shop** — shop-related management
- **Mailing** — notification/mailing tools
- **Streamers** — active streamers and streamer applications

---

## Localization

The dashboard supports UI localization in:

- Russian
- English
- Estonian

Item templates also support localized fields:

- `nameRu`, `nameEn`, `nameEt`
- `descriptionRu`, `descriptionEn`, `descriptionEt`

The frontend resolves item text with a safe fallback:

```text
current language localized value → base name/description
```

When adding item-related UI, use the localized item helpers instead of rendering raw `name` and `description` directly.

---

## Privacy / Streamer Mode

The dashboard has streamer mode privacy behavior. Sensitive values and identity fields should be masked when streamer mode is enabled.

Examples of sensitive or privacy-relevant data:

- OBS Agent tokens
- Agent IDs / relay URLs where applicable
- Discord IDs
- owner/seller identity fields
- manual token inputs

Use existing shared identity/sensitive-value components instead of creating ad-hoc masking logic.

---

## API Usage Rules

When adding or changing API calls:

1. Use the central API helper style in `src/lib/api.ts`.
2. Include `credentials: "include"` for authenticated requests.
3. Do not add frontend-side Discord OAuth secrets.
4. Do not add manual Authorization headers unless the backend contract explicitly changes.
5. Keep response handling consistent: `ok`, `data`, `message`, `code` patterns.
6. Prefer backend as the source of truth for permissions, cooldowns and ownership.

---

## Development Workflow

When adding a dashboard feature:

1. Confirm the backend endpoint and response shape.
2. Add or update TypeScript types in `src/lib/types.ts`.
3. Add API helper in `src/lib/api.ts`.
4. Add UI component under `src/components/dashboard/`.
5. Wire the component through `src/app/page.tsx` or the relevant panel.
6. Add RU/EN/ET text keys in `src/lib/dashboardText.ts`.
7. Add small CSS in `src/app/globals.css` only when existing classes cannot be reused.
8. Run:

```bash
npm run lint
npm run build
```

Avoid broad rewrites of stable dashboard flows close to release.

---

## Visual/Layout Notes

The dashboard uses a dark glass-style UI.

Important layout rules from previous fixes:

- page/document scroll should remain the main vertical scroll
- avoid reintroducing large nested scroll containers
- inventory details should appear as a right-side panel on desktop and stack below on narrow screens
- market cards should have consistent action alignment and one pagination control
- streamer list cards should align their action buttons at the bottom

---

## Diploma / Demo Checklist

Recommended demo order:

1. Login through Discord OAuth2
2. Open overview
3. Show inventory with localized item text
4. Show market listings
5. Run a craft action
6. Run a job and show cooldown behavior
7. Submit a streamer application
8. Approve/manage streamer from admin area
9. Open Streamer Studio
10. Show OBS Agent setup/status
11. Show OBS control screen
12. Open OBS shop and OBS history
13. Show admin items with RU/EN/ET localization fields
14. Show admin jobs configuration

---

## Production Notes

The website depends on the production backend API and its session configuration.

Before deploying frontend changes:

```bash
npm run lint
npm run build
```

If a frontend feature depends on a new backend migration, deploy backend migrations first, then deploy/restart frontend.

---

## Related Repositories

- `phenibut645/balkon` — backend API, Discord bot, database migrations and OBS relay
- `phenibut645/balkon-website` — this repository, Next.js dashboard
- `phenibut645/balkon-obs-agent` — local Windows desktop app connecting OBS Studio to Balkon relay

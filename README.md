# Lyra MVP Starter (Monorepo)

This repo matches the canvas spec: Next.js 14 app, worker, core/ui packages, infra migrations.

## Quickstart

```bash
pnpm i
pnpm -w dev
```

## Apps
- `apps/web` — Next.js 14 (App Router)
- `apps/worker` — background worker scaffold

## Packages
- `packages/core` — shared types/contracts (e.g., R2 signing, provider interfaces)
- `packages/ui` — design system package with primitives, layout components, and theming
  - Built from Figma Make exports (`apps/web/figma_export/`)
  - Includes: UIButton, UICard, UIInput, TopNavBar, Sidebar, MusicPlayer, ThemeProvider
  - CSS design tokens and Tailwind integration
  - See `packages/ui/README.md` for details

## Infra
- `infra/migrations` — SQL schema (Supabase/Postgres + RLS examples)
```

### Deploy
- Connect this repo to Vercel and set `apps/web` as the project root.
- Add environment variables (see `.env.example`).

---

## API Testing

The Lyra API supports **dual authentication**:
- **Cookie-based** (browser/Google SSO)
- **Bearer token** (API clients)

### 1. Get Access Token

```bash
BASE="https://lyra-mvp.vercel.app"

# Login with email/password
curl -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' | jq .

# Extract token
TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' | jq -r .access_token)
```

### 2. Verify Token

```bash
# Check who you are
curl "$BASE/api/auth/whoami" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 3. Bootstrap Organization (first-time users)

```bash
# Create your organization + membership
curl -X POST "$BASE/api/org/bootstrap" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 4. Get Organization Info

```bash
# Get your org + locations
curl "$BASE/api/org" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 5. List Tracks

```bash
# Get all tracks in your organization
curl "$BASE/api/tracks" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 6. Get Single Track

```bash
# Get details for a specific track
TRACK_ID="<uuid>"
curl "$BASE/api/tracks/$TRACK_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 7. Create Playlist

```bash
# Create a playlist with ordered tracks
curl -X POST "$BASE/api/playlists" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Playlist",
    "trackIds": ["track-uuid-1", "track-uuid-2"],
    "locationId": null,
    "schedule": null
  }' | jq .
```

### 8. List Playlists

```bash
# Get all playlists
curl "$BASE/api/playlists" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 9. Get Playlist Detail

```bash
# Get playlist with ordered tracks
PLAYLIST_ID="<uuid>"
curl "$BASE/api/playlists/$PLAYLIST_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 10. Update Playlist

```bash
# Update name and/or reorder tracks
curl -X PATCH "$BASE/api/playlists/$PLAYLIST_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "trackIds": ["track-uuid-2", "track-uuid-1"]
  }' | jq .
```

### 11. Generate Music (Enqueue Job)

```bash
# Start a Mureka generation job
curl -X POST "$BASE/api/jobs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "n": 2,
    "lyrics": "[Instrumental only]",
    "prompt": "chill lofi jazz, 90 BPM, cozy coffeehouse"
  }' | jq .
```

### 12. Poll Job Status

```bash
# Check job progress
JOB_ID="<uuid>"
curl "$BASE/api/jobs/$JOB_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 13. Refresh Token (when expired)

```bash
# Get new access token
REFRESH_TOKEN="<your_refresh_token>"
curl -X POST "$BASE/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}" | jq .
```

### Complete API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login` | POST | None | Get access token |
| `/api/auth/refresh` | POST | None | Refresh access token |
| `/api/auth/whoami` | GET | Cookie/Token | Verify authentication |
| `/api/org/bootstrap` | POST | Cookie/Token | Create org (first-time) |
| `/api/org` | GET | Cookie/Token | Get org + locations |
| `/api/tracks` | GET | Cookie/Token | List tracks |
| `/api/tracks/:id` | GET | Cookie/Token | Get track detail |
| `/api/tracks/:id` | DELETE | Cookie/Token | Delete track |
| `/api/playlists` | GET | Cookie/Token | List playlists |
| `/api/playlists` | POST | Cookie/Token | Create playlist |
| `/api/playlists/:id` | GET | Cookie/Token | Get playlist + tracks |
| `/api/playlists/:id` | PATCH | Cookie/Token | Update playlist |
| `/api/playlists/:id` | DELETE | Cookie/Token | Delete playlist |
| `/api/jobs` | POST | Cookie/Token | Enqueue generation |
| `/api/jobs/:id` | GET | Cookie/Token | Poll job status |

**Note:** All endpoints enforce organization-based authorization via RLS policies.

---

## Design System (@lyra/ui)

Lyra uses a custom design system built from Figma Make exports, published as `@lyra/ui`.

### Package Structure

```
packages/ui/
├── src/
│   ├── primitives/    # UIButton, UICard, UIInput, UIBadge, etc.
│   ├── layout/        # TopNavBar, Sidebar, MusicPlayer
│   ├── theme/         # ThemeProvider, tokens.css
│   └── utils/         # cn() helper for className merging
└── dist/              # Built outputs (CJS, ESM, types)
```

### Quick Usage

```tsx
import { UIButton, UICard, ThemeProvider } from "@lyra/ui";

export default function Page() {
  return (
    <UICard>
      <UIButton variant="default">Click me</UIButton>
    </UICard>
  );
}
```

### Design Tokens

All colors, spacing, typography, and other tokens are defined as CSS variables:

```css
--color-bg, --color-fg, --color-primary, --color-accent
--font-sans, --font-heading, --font-mono
--spacing-*, --radius-*, --shadow-*
```

These are mapped to Tailwind utilities in `apps/web/tailwind.config.ts`:

```tsx
className="bg-background text-foreground border-border"
```

### Theme Switching

The `ThemeProvider` component (already set up in `apps/web/app/layout.tsx`) handles light/dark themes via `data-theme` attribute and localStorage.

### Source of Truth

- **Figma exports**: `apps/web/figma_export/` (preserved for reference)
- **Published package**: `packages/ui/src/` (normalized and versioned)
- **Consumption**: All app code imports from `@lyra/ui`

### Development

```bash
# Build the UI package
pnpm build:ui

# Watch mode for UI changes
pnpm --filter @lyra/ui dev

# Full monorepo dev
pnpm dev
```

For detailed component APIs and usage examples, see `packages/ui/README.md`.

---

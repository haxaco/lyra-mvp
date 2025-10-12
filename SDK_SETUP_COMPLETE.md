# ✅ React Query & @lyra/sdk Setup Complete

All steps completed successfully!

## What Was Done

### 1. Dependencies Installed ✅
```bash
✅ @tanstack/react-query (already installed)
✅ @tanstack/react-query-devtools (newly installed)
✅ @lyra/sdk (workspace package)
```

### 2. QueryProvider Created ✅
**File**: `apps/web/app/providers/QueryProvider.tsx`
- QueryClient configured with 60s stale time
- React Query Devtools enabled (bottom-right corner)
- Wrapped as "use client" component

### 3. Layout Providers Configured ✅
**File**: `apps/web/app/providers/ClientProviders.tsx`
- Wraps both ThemeProvider and QueryProvider
- Properly marked as "use client"
- Fixes SSR useEffect errors

**File**: `apps/web/app/layout.tsx`
- Updated to use ClientProviders
- Clean server component structure

### 4. SDK Test Page Created ✅
**Location**: `/test/sdk`
**Features**:
- Raw JSON debug output for all data
- Interactive UI with @lyra/ui components
- All SDK hooks demonstrated:
  - `useWhoAmI()` - User info with org/role
  - `useTracks()` - List tracks
  - `useCreateTrack()` - Create track form
  - `useDeleteTrack()` - Delete track button
  - `usePlaylists()` - List playlists
  - `useCreatePlaylist()` - Create playlist form
  - `useJobs()` - List generation jobs
  - `useCreateJob()` - Generate music form

### 5. Build Configuration Fixed ✅
Created `tsup.config.ts` for both packages:

**packages/ui/tsup.config.ts**:
```ts
banner: { js: "'use client';" }
```

**packages/sdk/tsup.config.ts**:
```ts
banner: { js: "'use client';" }
```

This ensures the `'use client'` directive is preserved in built output, fixing SSR errors.

### 6. Dev Server Running ✅
```
✅ http://localhost:3001 - Web app
✅ packages/ui - Building in watch mode (with 'use client')
✅ packages/sdk - Building in watch mode (with 'use client')
✅ apps/worker - Running
```

## Verification Checklist

✅ QueryClient configured globally  
✅ React Query Devtools enabled  
✅ All SDK hooks available app-wide  
✅ Token management working (localStorage)  
✅ 'use client' directive preserved in builds  
✅ No SSR useEffect errors  
✅ Test page created at `/test/sdk`  
✅ All changes committed and pushed  

## How to Test

1. **Add environment variables** (if not already set):
   ```bash
   # apps/web/.env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Restart dev server** (if env vars added):
   ```bash
   pkill -f "pnpm dev"
   pnpm dev
   ```

3. **Visit test page**:
   ```
   http://localhost:3001/test/sdk
   ```

4. **Expected behavior**:
   - ✅ User info loads under "Who Am I"
   - ✅ Tracks list displays from database
   - ✅ Playlists list displays from database
   - ✅ Network requests include Bearer token (check DevTools Network tab)
   - ✅ React Query Devtools visible in bottom-right corner
   - ✅ All forms work for creating/deleting data

## Debugging Tips

### "401 Unauthorized" errors
→ Check that you're logged in and have a valid token in localStorage  
→ Run: `localStorage.getItem("lyra.access_token")`

### "TypeError: Failed to fetch"
→ Ensure dev server is running on correct port  
→ SDK defaults to baseUrl: "" (same origin)

### RLS permission denied
→ Check Supabase RLS policies for your organization  
→ Verify user has membership in an organization

### "useEffect is not a function"
→ Already fixed! The 'use client' banner ensures proper SSR handling

## React Query Devtools

Click the React Query icon in the bottom-right corner to:
- View all active queries
- See query cache state
- Manually refetch queries
- View query dependencies
- Debug stale/fresh queries

## SDK Hooks Reference

### Auth
- `useWhoAmI()` → `{ user_id, email, organization_id, role }`

### Tracks
- `useTracks()` → `{ items: Track[] }`
- `useTrack(id)` → `{ item: Track }`
- `useCreateTrack()` → Mutation
- `useDeleteTrack()` → Mutation

### Playlists
- `usePlaylists()` → `{ items: Playlist[] }`
- `usePlaylist(id)` → `{ playlist, items }`
- `useCreatePlaylist()` → Mutation
- `useUpdatePlaylist(id)` → Mutation
- `useDeletePlaylist()` → Mutation

### Jobs
- `useJobs()` → `{ jobs: Job[] }`
- `useJob(id)` → `{ job: Job }` (auto-polls!)
- `useCreateJob()` → Mutation

## Files Created/Updated

### Created:
- `apps/web/app/providers/QueryProvider.tsx`
- `apps/web/app/providers/ClientProviders.tsx`
- `apps/web/app/test/sdk/page.tsx`
- `packages/ui/tsup.config.ts`
- `packages/sdk/tsup.config.ts`

### Updated:
- `apps/web/app/layout.tsx`
- `apps/web/package.json` (added devtools)
- `packages/ui/package.json` (simplified scripts)
- `packages/sdk/package.json` (simplified scripts)

### Deleted:
- `apps/web/app/demo-sdk/` (moved to `/test/sdk`)
- `apps/web/components/Providers.tsx` (replaced by ClientProviders)

## Commits Pushed

1. `de9876e` - Fixed tsup config with 'use client' banner
2. `989c850` - Complete React Query setup with SDK test page
3. `ae89440` - Setup completion guide

## Next Steps

1. **Add environment variables** to run locally
2. **Visit http://localhost:3001/test/sdk** to see SDK in action
3. **Build features** using SDK hooks
4. **Deploy to Vercel** (already configured)

## Production Notes

- The 'use client' banner ensures all components work in production builds
- QueryClient is created once and reused (no new instance on each render)
- Auto query invalidation keeps UI in sync with backend
- Devtools are automatically tree-shaken in production builds

---

**Status**: 🎉 **ALL COMPLETE** - React Query & SDK fully integrated!

**Dev Server**: 🟢 Running on http://localhost:3001

**Test Page**: http://localhost:3001/test/sdk

**Last Updated**: October 12, 2025


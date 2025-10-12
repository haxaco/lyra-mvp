# @lyra/sdk

Typed client + React Query hooks for Lyra APIs.

## Installation

Already included in the workspace:

```json
{
  "dependencies": {
    "@lyra/sdk": "workspace:*"
  }
}
```

## Setup

### 1. Configure the SDK (optional)

```ts
import { configureSDK } from "@lyra/sdk";

configureSDK({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "",
  getToken: () => localStorage.getItem("lyra.access_token"),
});
```

### 2. Wrap your app with QueryClientProvider

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function App({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

## Usage

### Authentication

```ts
import { loginWithPassword, logoutLocal } from "@lyra/sdk";

// Login
const result = await loginWithPassword("demo@lyra.app", "password");
// Tokens are automatically stored in localStorage

// Logout
logoutLocal();
```

### React Query Hooks

```tsx
import { 
  useWhoAmI,
  useTracks,
  usePlaylists,
  useCreateTrack,
  useDeleteTrack,
  useCreatePlaylist,
  useUpdatePlaylist,
  useDeletePlaylist,
  useJobs,
  useCreateJob,
} from "@lyra/sdk";

function MyComponent() {
  // Fetch current user
  const { data: user, isLoading } = useWhoAmI();
  
  // Fetch tracks
  const { data: tracks } = useTracks();
  
  // Fetch playlists
  const { data: playlists } = usePlaylists();
  
  // Create track
  const createTrack = useCreateTrack();
  const handleCreate = () => {
    createTrack.mutate({
      title: "My Track",
      duration_seconds: 180,
      genre: "Electronic",
      energy: 0.8,
    });
  };
  
  // Delete track
  const deleteTrack = useDeleteTrack();
  const handleDelete = (id: string) => {
    deleteTrack.mutate(id);
  };
  
  // Create playlist
  const createPlaylist = useCreatePlaylist();
  const handleCreatePlaylist = () => {
    createPlaylist.mutate({
      name: "My Playlist",
      trackIds: ["track-1", "track-2"],
    });
  };
  
  // Generate music
  const createJob = useCreateJob();
  const handleGenerate = () => {
    createJob.mutate({
      prompt: "Energetic electronic music",
      n: 2,
      lyrics: "[Instrumental only]",
    });
  };
  
  return (
    <div>
      {isLoading ? "Loading..." : `Hello, ${user?.email}`}
      <button onClick={handleCreate}>Create Track</button>
      <button onClick={handleGenerate}>Generate Music</button>
    </div>
  );
}
```

### Direct API Calls

```ts
import { apiFetch } from "@lyra/sdk";

// Custom API call
const result = await apiFetch<{ ok: true; data: any }>("/api/custom", {
  method: "POST",
  body: JSON.stringify({ foo: "bar" }),
});
```

## Available Hooks

### Auth
- `useWhoAmI()` - Get current user info with org and role

### Tracks
- `useTracks()` - List all tracks
- `useTrack(id)` - Get single track
- `useCreateTrack()` - Create new track (mutation)
- `useDeleteTrack()` - Delete track (mutation)

### Playlists
- `usePlaylists()` - List all playlists
- `usePlaylist(id)` - Get playlist with tracks
- `useCreatePlaylist()` - Create playlist (mutation)
- `useUpdatePlaylist(id)` - Update playlist (mutation)
- `useDeletePlaylist()` - Delete playlist (mutation)

### Jobs
- `useJobs()` - List last 10 generation jobs
- `useJob(id)` - Get job status (auto-polls if running)
- `useCreateJob()` - Create new generation job (mutation)

## Types

All types are exported from the package:

```ts
import type {
  Track,
  Playlist,
  PlaylistDetail,
  Job,
  WhoAmI,
  CreateTrackBody,
  CreatePlaylistBody,
  UpdatePlaylistBody,
  CreateJobBody,
} from "@lyra/sdk";
```

## Features

- ✅ Fully typed with TypeScript
- ✅ Automatic token management (localStorage)
- ✅ Automatic query invalidation after mutations
- ✅ Auto-polling for running jobs
- ✅ Cookie + Bearer token support
- ✅ Error handling with typed responses
- ✅ Tree-shakeable exports

## Development

```bash
# Build the package
pnpm --filter @lyra/sdk build

# Watch mode
pnpm --filter @lyra/sdk dev
```


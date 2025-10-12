# Lyra MVP API Routes

Complete reference for all API endpoints in the Lyra MVP.

## Authentication & User

### `/api/auth/login` (POST)
- **Purpose**: Email/password login for API clients
- **Auth**: None (public)
- **Body**: `{ email: string, password: string }`
- **Returns**: `{ ok: true, access_token: string, refresh_token: string, user: {...} }`

### `/api/auth/refresh` (POST)
- **Purpose**: Refresh access token
- **Auth**: None (public)
- **Body**: `{ refresh_token: string }`
- **Returns**: `{ ok: true, access_token: string, refresh_token: string }`

### `/api/auth/whoami` (GET)
- **Purpose**: Get current user info with organization and role
- **Auth**: Cookie OR Bearer token
- **Returns**: 
```json
{
  "ok": true,
  "user_id": "uuid",
  "email": "user@example.com",
  "organization_id": "uuid",
  "role": "owner|admin|member",
  "user": { ...full_user_object }
}
```

## Organization

### `/api/org` (GET)
- **Purpose**: Get user's organization and locations
- **Auth**: Cookie OR Bearer token
- **Returns**: 
```json
{
  "ok": true,
  "org": {
    "id": "uuid",
    "name": "Org Name",
    "created_at": "timestamp"
  },
  "locations": [
    {
      "id": "uuid",
      "name": "Location Name",
      "timezone": "America/New_York",
      "created_at": "timestamp"
    }
  ]
}
```

### `/api/org/bootstrap` (POST)
- **Purpose**: Create organization for first-time user
- **Auth**: Cookie OR Bearer token
- **Body**: None (uses authenticated user)
- **Returns**: `{ ok: true, organization_id: "uuid", created: boolean }`

### `/api/bootstrap` (POST)
- **Purpose**: Legacy bootstrap endpoint (redirects to /api/org/bootstrap)
- **Auth**: Cookie
- **Returns**: `{ ok: true, organizationId: "uuid", created: boolean }`

## Tracks

### `/api/tracks` (GET)
- **Purpose**: List all tracks for user's organization
- **Auth**: Cookie OR Bearer token
- **Returns**: 
```json
{
  "ok": true,
  "items": [
    {
      "id": "uuid",
      "title": "Track Name",
      "duration_seconds": 180,
      "r2_key": "path/to/file.mp3",
      "flac_r2_key": "path/to/file.flac",
      "created_at": "timestamp",
      "meta": { ...metadata }
    }
  ]
}
```

### `/api/tracks` (POST)
- **Purpose**: Create new track with metadata
- **Auth**: Cookie OR Bearer token
- **Body**: 
```json
{
  "title": "Track Name",
  "duration_seconds": 180,
  "genre": "Electronic",
  "energy": 0.8,
  "r2_key": "path/to/file.mp3",
  "flac_r2_key": "path/to/file.flac",
  "job_id": "uuid",
  "watermark": false,
  "meta": { ...custom_metadata }
}
```
- **Returns**: `{ ok: true, track: { id, title, duration_seconds, r2_key, created_at } }`

### `/api/tracks` (DELETE)
- **Purpose**: Delete a track
- **Auth**: Cookie OR Bearer token
- **Query**: `?id=uuid`
- **Returns**: `{ ok: true }`
- **Note**: Verifies track belongs to user's organization before deletion

### `/api/tracks/[id]` (GET)
- **Purpose**: Get single track details
- **Auth**: Cookie OR Bearer token
- **Returns**: `{ ok: true, item: { ...track_details } }`

### `/api/tracks/[id]` (DELETE)
- **Purpose**: Delete single track by ID
- **Auth**: Cookie OR Bearer token
- **Returns**: `{ ok: true }`

## Playlists

### `/api/playlists` (GET)
- **Purpose**: List all playlists for user's organization
- **Auth**: Cookie OR Bearer token
- **Returns**: 
```json
{
  "ok": true,
  "items": [
    {
      "id": "uuid",
      "name": "Playlist Name",
      "created_at": "timestamp"
    }
  ]
}
```

### `/api/playlists` (POST)
- **Purpose**: Create new playlist with optional tracks
- **Auth**: Cookie OR Bearer token
- **Body**: 
```json
{
  "name": "Morning Energy",
  "locationId": "uuid",
  "trackIds": ["track_uuid_1", "track_uuid_2"],
  "schedule": { ...schedule_config }
}
```
- **Returns**: `{ ok: true, playlistId: "uuid" }`
- **Note**: Automatically creates `playlist_items` in order if `trackIds` provided

### `/api/playlists/[id]` (GET)
- **Purpose**: Get playlist with ordered tracks
- **Auth**: Cookie OR Bearer token
- **Returns**: 
```json
{
  "ok": true,
  "playlist": {
    "id": "uuid",
    "name": "Playlist Name",
    "location_id": "uuid",
    "schedule": {...},
    "created_at": "timestamp"
  },
  "items": [
    {
      "position": 0,
      "track_id": "uuid",
      "tracks": {
        "id": "uuid",
        "title": "Track Name",
        "duration_seconds": 180,
        "r2_key": "path/to/file.mp3",
        "created_at": "timestamp",
        "meta": {...}
      }
    }
  ]
}
```

### `/api/playlists/[id]` (PATCH)
- **Purpose**: Update playlist name or track order
- **Auth**: Cookie OR Bearer token
- **Body**: 
```json
{
  "name": "Updated Name",
  "schedule": {...},
  "trackIds": ["track_uuid_2", "track_uuid_1"]
}
```
- **Returns**: `{ ok: true }`
- **Note**: If `trackIds` provided, deletes all existing items and recreates in new order

### `/api/playlists/[id]` (DELETE)
- **Purpose**: Delete playlist and cascade playlist_items
- **Auth**: Cookie OR Bearer token
- **Returns**: `{ ok: true }`

## Generation Jobs

### `/api/jobs` (GET)
- **Purpose**: List last 10 generation jobs for user's organization
- **Auth**: Cookie OR Bearer token
- **Returns**: 
```json
{
  "ok": true,
  "jobs": [
    {
      "id": "uuid",
      "provider": "mureka",
      "model": "auto",
      "prompt": "Energetic electronic music",
      "status": "succeeded",
      "error": null,
      "created_at": "timestamp",
      "started_at": "timestamp",
      "finished_at": "timestamp"
    }
  ]
}
```

### `/api/jobs` (POST)
- **Purpose**: Enqueue new Mureka generation job
- **Auth**: Cookie OR Bearer token
- **Body**: 
```json
{
  "model": "auto",
  "n": 2,
  "lyrics": "[Instrumental only]",
  "prompt": "Energetic electronic music",
  "reference_id": "optional_reference_uuid",
  "vocal_id": "optional_vocal_uuid",
  "melody_id": "optional_melody_uuid",
  "stream": false
}
```
- **Returns**: 
```json
{
  "ok": true,
  "jobId": "uuid",
  "items": [
    {
      "dbId": "track_uuid",
      "mp3": { "key": "path/to/file.mp3", "url": "presigned_url" },
      "flac": { "key": "path/to/file.flac", "url": "presigned_url" },
      "durationSec": 180
    }
  ],
  "elapsedMs": 45000
}
```
- **Note**: 
  - Calls Mureka API
  - Polls for completion (max 240s)
  - Uploads MP3 + FLAC to R2
  - Creates track records in database
  - Returns presigned URLs for immediate access

### `/api/jobs/[id]` (GET)
- **Purpose**: Poll job status
- **Auth**: Cookie OR Bearer token
- **Returns**: 
```json
{
  "ok": true,
  "job": {
    "id": "uuid",
    "status": "queued|succeeded|failed",
    "error": null,
    "provider": "mureka",
    "model": "auto",
    "prompt": "...",
    "created_at": "timestamp",
    "started_at": "timestamp",
    "finished_at": "timestamp"
  }
}
```

## Health & Testing

### `/api/healthz` (GET)
- **Purpose**: Health check with Supabase connectivity test
- **Auth**: None (public)
- **Returns**: `{ ok: true, supabase: "reachable", sample: [...] }`

### `/api/mureka-test` (POST)
- **Purpose**: Test Mureka integration (legacy, use `/api/jobs` instead)
- **Auth**: Cookie OR Bearer token

### `/api/r2/test` (GET)
- **Purpose**: Test R2 storage connectivity
- **Auth**: None (public)

### `/api/sign` (GET)
- **Purpose**: Generate presigned R2 URLs
- **Auth**: Cookie OR Bearer token
- **Query**: `?key=path/to/file`

## Authentication Methods

All API routes support dual authentication:

1. **Cookie-based** (Browser/SSO):
   - Automatic via Next.js middleware
   - Used after Google OAuth login
   
2. **Bearer token** (API clients):
   - Get token via `/api/auth/login`
   - Include header: `Authorization: Bearer <access_token>`
   - Refresh with `/api/auth/refresh`

## Error Responses

All routes return consistent error format:
```json
{
  "ok": false,
  "error": "Human-readable error message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (missing/invalid parameters)
- `401` - Unauthorized (no auth or invalid token)
- `404` - Not found
- `500` - Server error
- `502` - External API error (e.g., Mureka)

## Row Level Security (RLS)

All database operations respect organization-based RLS:
- Users can only access data from their organization
- Writes use service role where needed (e.g., bootstrap, track creation)
- Reads use authenticated user's Supabase client
- Organization ID automatically filtered via `getOrgClientAndId()` helper

## Rate Limiting

Currently no rate limiting implemented. Consider adding for production:
- `/api/jobs` - Limit generation requests per user/org
- `/api/auth/login` - Prevent brute force attacks
- All endpoints - General DDoS protection

## Next Steps

1. Add pagination to list endpoints (`/api/tracks`, `/api/playlists`, `/api/jobs`)
2. Add filtering and search to `/api/tracks` (by genre, energy, date)
3. Add batch operations (bulk delete, bulk playlist creation)
4. Add webhooks for async job completion
5. Add rate limiting middleware
6. Add request validation middleware (zod/joi schemas)
7. Add API versioning (`/api/v1/...`)


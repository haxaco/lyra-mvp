import { r2SignGet } from "./r2";

/**
 * Converts an R2 key or existing URL into a playable URL
 * @param keyOrUrl - R2 key (e.g., "tracks/abc.mp3") or full URL
 * @returns Presigned URL for playback
 */
export async function getPlayableUrl(keyOrUrl: string): Promise<string> {
  if (!keyOrUrl) return "";
  
  // If it's already a full URL, return as-is
  if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
    return keyOrUrl;
  }
  
  // Otherwise, treat as R2 key and sign it
  return await r2SignGet(keyOrUrl, 3600);
}


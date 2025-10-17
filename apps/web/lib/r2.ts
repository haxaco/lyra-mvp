/**
 * Cloudflare R2 (S3-compatible) storage helpers
 * Server-only module for file upload, download, and presigned URL generation
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from './env';

// Lazy initialization of R2 client to avoid build-time environment variable access
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return r2Client;
}

/**
 * Upload an object to R2 storage
 * @param key - The object key (path) in the bucket
 * @param body - The file content as Buffer, Uint8Array, or ReadableStream
 * @param contentType - MIME type of the content
 * @returns Promise that resolves when upload is complete
 */
export async function putObject({ 
  key, 
  contentType, 
  body 
}: { 
  key: string; 
  contentType: string; 
  body: Uint8Array | Buffer | ReadableStream;
}): Promise<void> {
  try {
    const cmd = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    
    await getR2Client().send(cmd);
  } catch (error) {
    throw new Error(`Failed to upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download an object from R2 storage
 * @param key - The object key (path) in the bucket
 * @returns Promise that resolves with the object content
 */
export async function getObject({ key }: { key: string }): Promise<ReadableStream | Uint8Array | Buffer> {
  try {
    const cmd = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    });
    
    const response = await getR2Client().send(cmd);
    
    if (!response.Body) {
      throw new Error('No body in R2 response');
    }
    
    // If it's already a ReadableStream, return it directly
    if (response.Body instanceof ReadableStream) {
      return response.Body;
    }
    
    // Convert to Uint8Array for other cases
    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;
    
    // Handle different body types
    if (stream.transformToByteArray) {
      const byteArray = await stream.transformToByteArray();
      return byteArray;
    }
    
    // Fallback: try to read as stream
    const reader = stream.getReader ? stream.getReader() : null;
    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        return new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      } finally {
        reader.releaseLock();
      }
    }
    
    // Last resort: return the body as-is
    return stream;
  } catch (error) {
    throw new Error(`Failed to download from R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a presigned URL for downloading an object
 * @param key - The object key (path) in the bucket
 * @param expiresInSec - URL expiration time in seconds (default: 1 hour)
 * @returns Promise that resolves with the presigned URL
 */
export async function createPresignedGetUrl(key: string, expiresInSec = 3600): Promise<string> {
  try {
    const cmd = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    });
    
    return await getSignedUrl(getR2Client(), cmd, { expiresIn: expiresInSec });
  } catch (error) {
    throw new Error(`Failed to create presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use putObject instead
 */
export async function r2Put(key: string, body: Buffer, contentType: string): Promise<void> {
  return putObject({ key, body, contentType });
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use createPresignedGetUrl instead
 */
export async function r2SignGet(key: string, expiresIn = 3600): Promise<string> {
  return createPresignedGetUrl(key, expiresIn);
}

/**
 * Always return null so we default to presigned links
 * @deprecated This function is kept for backward compatibility
 */
export function r2PublicUrl(_: string): null {
  return null;
}

/**
 * Upload a file from a URL to R2
 * @param url - Source URL to download from
 * @param key - R2 key to store the file
 * @param options - Upload options
 */
export async function uploadFromUrl(
  url: string, 
  key: string, 
  options: { contentType?: string } = {}
): Promise<void> {
  try {
    // Fetch the file from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from URL: ${response.status} ${response.statusText}`);
    }

    // Convert to buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Upload to R2
    await putObject({
      key,
      body: buffer,
      contentType: options.contentType || 'application/octet-stream',
    });
  } catch (error) {
    console.error(`Failed to upload from URL ${url} to R2 key ${key}:`, error);
    throw error;
  }
}

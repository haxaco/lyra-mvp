/* server-only R2 helper (AWS SDK v3) */
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.R2_BUCKET_NAME as string;

export async function r2Put(key: string, body: Buffer, contentType = "audio/mpeg") {
  if (!BUCKET) throw new Error("R2_BUCKET_NAME missing");
  await R2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return key;
}

export async function r2SignGet(key: string, expiresInSec = 3600) {
  if (!BUCKET) throw new Error("R2_BUCKET_NAME missing");
  return getSignedUrl(
    R2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSec }
  );
}

export function r2PublicUrl(key: string) {
  const base = (process.env.R2_PUBLIC_DOMAIN || "").replace(/\/+$/, "");
  return base ? `${base}/${key}` : null;
}


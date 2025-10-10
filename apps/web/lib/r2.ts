/* server-only R2 helper (AWS SDK v3) */
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function r2Put(key: string, body: Buffer, contentType: string) {
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await r2.send(cmd);
}

export async function r2SignGet(key: string, expiresIn = 3600) {
  const cmd = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });
  return await getSignedUrl(r2, cmd, { expiresIn });
}

// Always return null so we default to presigned links
export function r2PublicUrl(_: string) {
  return null;
}

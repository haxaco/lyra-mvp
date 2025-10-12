import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing R2 credentials: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY');
    }

    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return s3Client;
}

export async function signR2Put(key: string, expiresIn = 3600): Promise<string> {
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('Missing R2_BUCKET_NAME environment variable');
  }

  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function signR2Get(key: string, expiresIn = 3600): Promise<string> {
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('Missing R2_BUCKET_NAME environment variable');
  }

  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export function getR2PublicUrl(key: string): string {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (!publicDomain) {
    throw new Error('Missing R2_PUBLIC_DOMAIN environment variable');
  }

  return `https://${publicDomain}/${key}`;
}



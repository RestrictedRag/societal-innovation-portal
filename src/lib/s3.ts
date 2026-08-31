import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim() || 'civic-marketplace-uploads';
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

export async function createPresignedUploadUrl({
  key,
  contentType,
  bucket = process.env.R2_BUCKET_NAME ?? 'civic-marketplace-uploads',
}: {
  key: string;
  contentType: string;
  bucket?: string;
}) {
  const config = getR2Config();

  if (!config) {
    throw new Error('Cloud storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in your environment.');
  }

  const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: false,
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(r2Client, command, {
    expiresIn: 60 * 5,
  });

  return {
    url,
    key,
    bucket,
    publicUrl: config.publicUrl ? `${config.publicUrl.replace(/\/$/, '')}/${key}` : `${bucket}/${key}`,
  };
}

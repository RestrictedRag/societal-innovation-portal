import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
  forcePathStyle: false,
});

export async function createPresignedUploadUrl({
  key,
  contentType,
  bucket = process.env.R2_BUCKET_NAME ?? 'civic-marketplace-uploads',
}: {
  key: string;
  contentType: string;
  bucket?: string;
}) {
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
    publicUrl: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ''}/${key}`,
  };
}

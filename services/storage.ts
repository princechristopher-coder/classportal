import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const REQUIRED_ENV = ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const;

export function isStorageConfigured(): boolean {
  return REQUIRED_ENV.every((key) => !!process.env[key]);
}

function getClient(): S3Client {
  return new S3Client({
    region: process.env.S3_REGION!,
    // S3_ENDPOINT is only needed for non-AWS S3-compatible providers
    // (Cloudflare R2, Backblaze B2, Bunny.net, DigitalOcean Spaces, MinIO...).
    // Leave unset for real AWS S3.
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
    }
  });
}

const ALLOWED_CONTENT_TYPES: Record<'video' | 'image' | 'quiz', string[]> = {
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  image: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  quiz: ['text/html']
};

const MAX_BYTES: Record<'video' | 'image' | 'quiz', number> = {
  video: 2 * 1024 * 1024 * 1024, // 2GB
  image: 10 * 1024 * 1024, // 10MB
  quiz: 5 * 1024 * 1024 // 5MB — self-contained quiz HTML files
};

export interface PresignResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  maxBytes: number;
}

/**
 * Generates a short-lived presigned PUT URL so the admin's browser can upload
 * a file directly to object storage (video/thumbnail never passes through our
 * server, which would be slow and memory-heavy for large video files).
 */
export async function createPresignedUpload(
  kind: 'video' | 'image' | 'quiz',
  contentType: string,
  originalFileName: string
): Promise<PresignResult> {
  if (!isStorageConfigured()) {
    throw new Error(
      'File storage is not configured on this server. Set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY, or paste a hosted video/image URL instead.'
    );
  }

  if (!ALLOWED_CONTENT_TYPES[kind].includes(contentType)) {
    throw new Error(`Unsupported ${kind} file type: ${contentType}`);
  }

  const bucket = process.env.S3_BUCKET!;
  const extension =
    originalFileName.split('.').pop()?.toLowerCase() ||
    (kind === 'video' ? 'mp4' : kind === 'quiz' ? 'html' : 'png');
  const key = `${kind}s/${randomUUID()}.${extension}`;

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 }); // 5 minutes

  const publicUrlBase = process.env.S3_PUBLIC_URL_BASE?.replace(/\/$/, '');
  const publicUrl = publicUrlBase
    ? `${publicUrlBase}/${key}`
    : `https://${bucket}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl, key, maxBytes: MAX_BYTES[kind] };
}

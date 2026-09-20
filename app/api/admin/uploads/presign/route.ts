import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createPresignedUpload, isStorageConfigured } from '@/services/storage';
import { handleApiError, jsonError } from '@/lib/api-response';
import { z } from 'zod';

const presignSchema = z.object({
  kind: z.enum(['video', 'image', 'quiz']),
  contentType: z.string().min(1),
  fileName: z.string().min(1)
});

/**
 * POST /api/admin/uploads/presign
 * Admin only. Returns a short-lived S3 PUT URL the browser uploads directly
 * to, plus the resulting public URL to save on the course/lesson.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    if (!isStorageConfigured()) {
      return jsonError(
        'File storage is not configured on this server yet. Paste a hosted video/image URL instead, or set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY in your environment.',
        503
      );
    }

    const { kind, contentType, fileName } = presignSchema.parse(await req.json());
    const result = await createPresignedUpload(kind, contentType, fileName);

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

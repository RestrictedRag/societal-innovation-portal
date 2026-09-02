import { NextResponse } from 'next/server';
import { uploadImageToFirebase } from '@/lib/firebase-admin';
import { resolveAuthUser } from '@/lib/auth/resolve-user';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'image/heic',
  'image/avif',
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.avif'];

export async function POST(request: Request) {
  try {
    const authResult = await resolveAuthUser();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const user = authResult.user;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data (expected field "file")' }, { status: 400 });
    }

    const fileName = (file.name || '').toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    const isImageMime = file.type.startsWith('image/') && (ALLOWED_MIME_TYPES.includes(file.type) || hasValidExtension);

    if (!isImageMime && !hasValidExtension) {
      return NextResponse.json(
        {
          error: `Only photo/image files (JPG, PNG, WebP, HEIC) are allowed in posts. Received: ${file.type || 'unknown format'}.`,
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Photo size exceeds maximum allowed limit of 5MB.' },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadImageToFirebase(buffer, file.name || 'photo.jpg', file.type || 'image/jpeg');

    return NextResponse.json({
      success: true,
      url: result.url,
      publicUrl: result.url,
      key: result.key,
    });
  } catch (error: any) {
    console.error('Firebase Storage upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image to Firebase Storage.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

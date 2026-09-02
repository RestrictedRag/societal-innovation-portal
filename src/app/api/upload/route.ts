import { NextResponse } from 'next/server';
import { uploadImageToFirebase } from '@/lib/firebase-admin';
import { resolveAuthUser } from '@/lib/auth/resolve-user';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

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

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed formats: JPG, PNG, WebP.` },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit of 5MB.' },
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

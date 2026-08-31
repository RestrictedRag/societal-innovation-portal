import { NextResponse } from 'next/server';

import { createPresignedUploadUrl } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileName, contentType } = body as { fileName?: string; contentType?: string };

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName and contentType are required' }, { status: 400 });
    }

    const key = `uploads/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
    const upload = await createPresignedUploadUrl({ key, contentType });

    return NextResponse.json({ success: true, ...upload });
  } catch (error) {
    console.error('Presigned upload generation failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate presigned URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

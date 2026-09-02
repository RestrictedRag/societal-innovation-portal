import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import crypto from 'node:crypto';

function getFirebaseAdminApp(): App | null {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET?.trim();

  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Missing required Firebase Admin credentials in production: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY must be set in your Render environment variables.',
      );
    }
    return null;
  }

  // Handle escaped newlines in environment variables (Render/Docker format)
  privateKey = privateKey.replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: storageBucket || `${projectId}.appspot.com`,
  });
}

export async function uploadImageToFirebase(
  buffer: Buffer,
  originalFilename: string,
  contentType: string,
): Promise<{ url: string; key: string }> {
  const app = getFirebaseAdminApp();
  const sanitizedName = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `uploads/${Date.now()}-${sanitizedName}`;

  if (!app) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Firebase Admin App initialization failed in production.');
    }
    // Development/Fallback mode when Firebase service account credentials are not configured
    console.warn(
      'Firebase Admin credentials not set (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Using fallback data URL.',
    );
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;
    return {
      url: dataUrl,
      key,
    };
  }

  const bucket = getStorage(app).bucket();
  const file = bucket.file(key);
  const downloadToken = crypto.randomUUID();

  await file.save(buffer, {
    metadata: {
      contentType,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  const bucketName = bucket.name;
  const encodedPath = encodeURIComponent(key);
  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`;

  return {
    url: publicUrl,
    key,
  };
}

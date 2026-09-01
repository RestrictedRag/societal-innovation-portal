'use client';

import { useEffect, useRef, useState } from 'react';

import {
  DEFAULT_IMAGE_MAX_DIMENSION,
  GEOLOCATION_TIMEOUT_MS,
  JPEG_IMAGE_QUALITY,
  MAX_IMAGE_COMPRESSION_QUALITY,
  PNG_IMAGE_QUALITY,
} from '@/lib/constants';
import {
  type ConfirmedProblem,
  type OptimisticSubmission,
  saveStoredSubmission,
  submitWithRetry,
} from '@/lib/optimistic-submissions';
import { countWords, getComplaintValidationError } from '@/lib/problem-validation';

export type ComplaintFormProps = {
  onClose?: () => void;
  onOptimisticSubmit?: (item: OptimisticSubmission) => void;
  onSuccess?: (problem: ConfirmedProblem) => void;
  onFail?: (failedItem: OptimisticSubmission) => void;
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type AttachedMediaItem = {
  id: string | null;
  previewUrl: string;
  storageUrl: string | null;
  status: 'PENDING_MODERATION';
};

export const formatCoords = (location: Coordinates) => `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;

export function useComplaintForm({ onClose, onOptimisticSubmit, onSuccess, onFail }: ComplaintFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('healthcare');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationDisplay, setLocationDisplay] = useState('');
  const [locationDisplayNote, setLocationDisplayNote] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<AttachedMediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const words = countWords(description);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, []);

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }

    setIsCameraOpen(false);
  };

  const openCamera = async () => {
    setMediaMenuOpen(false);
    setError(null);
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not available in this browser. You can still choose an image from your gallery.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setIsCameraOpen(true);

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
    } catch {
      setCameraError('Camera permission was denied. Please allow access or use the gallery option instead.');
      setIsCameraOpen(false);
    }
  };

  const captureCameraPhoto = () => {
    const video = cameraVideoRef.current;
    if (!video) {
      setCameraError('The camera preview is not ready yet.');
      return;
    }

    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('Unable to capture the camera image in this browser.');
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('The camera image could not be captured. Please try again.');
          return;
        }

        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        stopCameraStream();
        void addAttachedPhoto(file);
      },
      'image/jpeg',
      MAX_IMAGE_COMPRESSION_QUALITY,
    );
  };

  const clearSelectedPhoto = (mediaId: string | null, previewUrl: string) => {
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setAttachedMedia((previous) => previous.filter((item) => item.previewUrl !== previewUrl));
    setImageUrl('');
    setMediaMenuOpen(false);
  };

  const compressImageFile = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const imageElement = new Image();
        imageElement.onload = () => resolve(imageElement);
        imageElement.onerror = () => reject(new Error('The selected photo could not be processed.'));
        imageElement.src = objectUrl;
      });

      const scale = Math.min(1, DEFAULT_IMAGE_MAX_DIMENSION / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Unable to prepare the selected photo for upload.');
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const targetType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = targetType === 'image/png' ? PNG_IMAGE_QUALITY : JPEG_IMAGE_QUALITY;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (!result) {
              reject(new Error('Unable to compress the selected photo.'));
              return;
            }
            resolve(result);
          },
          targetType,
          quality,
        );
      });

      return new File([blob], file.name || 'complaint-photo.jpg', {
        type: targetType,
        lastModified: Date.now(),
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const addAttachedPhoto = async (file: File | null | undefined) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file for the complaint media.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const pendingItem: AttachedMediaItem = {
      id: null,
      previewUrl,
      storageUrl: null,
      status: 'PENDING_MODERATION',
    };

    setAttachedMedia((previous) => [...previous, pendingItem]);
    setMediaMenuOpen(false);
    setError(null);

    try {
      const compressedFile = await compressImageFile(file);
      const presignedResponse = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: compressedFile.name || 'complaint-photo.jpg',
          contentType: compressedFile.type || 'image/jpeg',
        }),
      });

      const presignedPayload = (await presignedResponse.json().catch(() => null)) as {
        url?: string;
        publicUrl?: string;
        error?: string;
      };

      if (!presignedResponse.ok || !presignedPayload?.url) {
        throw new Error(presignedPayload?.error ?? 'Cloud storage is not configured. Please add the R2 upload credentials before attaching photos.');
      }

      let uploadResponse: Response;
      try {
        uploadResponse = await fetch(presignedPayload.url, {
          method: 'PUT',
          headers: {
            'Content-Type': compressedFile.type || 'image/jpeg',
          },
          body: compressedFile,
        });
      } catch {
        throw new Error('Network error while uploading the selected photo. Check your connection or storage configuration.');
      }

      if (!uploadResponse.ok) {
        throw new Error('The selected photo could not be uploaded.');
      }

      const finalImageUrl = presignedPayload.publicUrl || presignedPayload.url.split('?')[0];
      setAttachedMedia((previous) =>
        previous.map((item) =>
          item.previewUrl === previewUrl
            ? {
                ...item,
                storageUrl: finalImageUrl,
                status: 'PENDING_MODERATION',
              }
            : item,
        ),
      );
      setImageUrl(finalImageUrl);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'The selected photo could not be uploaded.';
      setError(message);
      setAttachedMedia((previous) => previous.filter((item) => item.previewUrl !== previewUrl));
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setIsResolvingLocation(true);
    setLocationDisplayNote(null);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setLocation(nextLocation);
        setLocationDisplay('');
        setLocationDisplayNote(null);

        try {
          const response = await fetch(
            `/api/geocode/reverse?lat=${nextLocation.lat}&lon=${nextLocation.lng}`,
          );

          const payload = (await response.json().catch(() => null)) as {
            city?: string;
            state?: string;
            formattedAddress?: string;
            error?: string;
          };

          if (!response.ok || (!payload?.city && !payload?.state && !payload?.formattedAddress)) {
            throw new Error(payload?.error ?? 'Unable to resolve your city and state.');
          }

          const resolvedLabel = [payload.city, payload.state].filter(Boolean).join(', ');
          setLocationDisplay(resolvedLabel || payload.formattedAddress || formatCoords(nextLocation));
        } catch {
          setLocationDisplay(formatCoords(nextLocation));
          setLocationDisplayNote('Using raw coordinates because location details were unavailable.');
        } finally {
          setIsResolvingLocation(false);
        }
      },
      () => {
        setIsResolvingLocation(false);
        setError('Location access was denied. Please use a location from the map or enter coordinates manually.');
      },
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS },
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setStatusMessage(null);

    const validationError = getComplaintValidationError(title, description, location);
    if (validationError) {
      setError(validationError);
      return;
    }

    const finalImageUrl =
      attachedMedia.find((item) => item.storageUrl)?.storageUrl ?? imageUrl ?? null;
    const mediaPayload = attachedMedia
      .filter((item) => item.storageUrl)
      .map((item) => item.storageUrl as string);

    const clientId = crypto.randomUUID();
    const backupId = `backup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const optimisticSubmission: OptimisticSubmission = {
      backupId,
      clientId,
      title: title.trim(),
      description: description.trim(),
      domain,
      imageUrl: finalImageUrl,
      media: mediaPayload.length ? mediaPayload : finalImageUrl ? [finalImageUrl] : [],
      location: location ? { lat: location.lat, lng: location.lng } : null,
      latitude: location?.lat ?? null,
      longitude: location?.lng ?? null,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    // 1. Persist to localStorage immediately
    saveStoredSubmission(optimisticSubmission);

    // 2. Immediately render optimistically in UI
    onOptimisticSubmit?.(optimisticSubmission);

    // 3. Reset form and close modal immediately
    setTitle('');
    setDescription('');
    setImageUrl('');
    setLocation(null);
    setLocationDisplay('');
    setLocationDisplayNote(null);
    setAttachedMedia([]);
    setDomain('healthcare');
    onClose?.();

    // 4. Execute background submission with retries
    void submitWithRetry(optimisticSubmission, {
      onSuccess: (confirmed) => {
        onSuccess?.(confirmed);
      },
      onFail: (failedItem) => {
        onFail?.(failedItem);
      },
    });
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    domain,
    setDomain,
    imageUrl,
    setImageUrl,
    location,
    setLocation,
    locationDisplay,
    setLocationDisplay,
    locationDisplayNote,
    setLocationDisplayNote,
    isResolvingLocation,
    mediaMenuOpen,
    setMediaMenuOpen,
    attachedMedia,
    setAttachedMedia,
    isSubmitting,
    error,
    setError,
    statusMessage,
    setStatusMessage,
    isCameraOpen,
    setIsCameraOpen,
    cameraError,
    setCameraError,
    words,
    cameraInputRef,
    galleryInputRef,
    cameraVideoRef,
    stopCameraStream,
    openCamera,
    captureCameraPhoto,
    clearSelectedPhoto,
    addAttachedPhoto,
    useCurrentLocation,
    handleSubmit,
    locationValue: location ? (locationDisplay || formatCoords(location)) : 'No location selected',
  };
}

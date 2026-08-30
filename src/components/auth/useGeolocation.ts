'use client';

import { useCallback, useState } from 'react';

export type GeolocationStatus = 'idle' | 'locating' | 'success' | 'denied' | 'error';

export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator?.geolocation) {
      setStatus('error');
      setErrorMessage('Geolocation is not supported by this browser.');
      return;
    }

    setStatus('locating');
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setCoordinates(nextCoordinates);
        setStatus('success');
      },
      (error) => {
        setCoordinates(null);
        setStatus(error.code === 1 ? 'denied' : 'error');
        setErrorMessage(
          error.code === 1
            ? 'Location access was denied. You can still enter your city and state manually.'
            : 'Unable to retrieve your location right now. Please try again or enter your city and state manually.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000,
      }
    );
  }, []);

  return {
    status,
    coordinates,
    errorMessage,
    requestLocation,
    reset: () => {
      setStatus('idle');
      setCoordinates(null);
      setErrorMessage(null);
    },
  };
}

'use client';

import React from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { config } from '@/lib/config';

interface GoogleMapsWrapperProps {
  children: React.ReactNode;
}

const mapContainerStyle = {
  width: '100%',
  height: '200px'
};

const center = {
  lat: 14.6349,
  lng: -90.5069
};

export const GoogleMapsWrapper: React.FC<GoogleMapsWrapperProps> = ({ children }) => {
  if (!config.google.mapsApiKey) {
    return <>{children}</>;
  }

  return (
    <LoadScript
      googleMapsApiKey={config.google.mapsApiKey}
      libraries={['places']}
    >
      {children}
    </LoadScript>
  );
};

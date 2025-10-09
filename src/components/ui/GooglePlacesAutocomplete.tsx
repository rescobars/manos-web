'use client';

import React, { useCallback, useState, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import { config } from '@/lib/config';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  colors?: {
    textPrimary: string;
    textSecondary: string;
    buttonPrimary1: string;
    border: string;
    background2: string;
  };
}

export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'Buscar dirección...',
  className = '',
  disabled = false,
  colors = {
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    buttonPrimary1: '#3b82f6',
    border: '#d1d5db',
    background2: '#f9fafb',
  },
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handlePlaceSelect = useCallback((place: google.maps.places.PlaceResult | null) => {
    if (place && place.geometry && place.geometry.location) {
      const location: Location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address || place.name || '',
      };
      
      onLocationSelect(location);
      onChange(location.address);
    }
  }, [onLocationSelect, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Show fallback if no API key
  if (!config.google.mapsApiKey) {
    return (
      <div className="relative w-full">
        <input
          value={value}
          onChange={handleInputChange}
          placeholder="Google Maps API key no configurada"
          disabled={true}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 sm:text-sm ${className}`}
          style={{
            borderColor: colors.border,
            backgroundColor: '#f9f9f9',
            color: colors.textSecondary,
          }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <MapPin className="w-4 h-4" style={{ color: colors.textSecondary }} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <Autocomplete
        onLoad={(autocomplete) => {
          autocompleteRef.current = autocomplete;
          // Configure autocomplete options
          autocomplete.setOptions({
            componentRestrictions: { country: 'gt' },
            types: ['geocode', 'establishment'],
            fields: ['place_id', 'geometry', 'formatted_address', 'name'],
          });
        }}
        onPlaceChanged={() => {
          if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            handlePlaceSelect(place);
          }
        }}
        options={{
          componentRestrictions: { country: 'gt' },
          types: ['geocode', 'establishment'],
          fields: ['place_id', 'geometry', 'formatted_address', 'name'],
        }}
      >
        <div className="relative">
          <input
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 sm:text-sm ${className}`}
            style={{
              borderColor: colors.border,
              backgroundColor: 'white',
              color: colors.textPrimary,
            }}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.buttonPrimary1 }} />
            </div>
          )}
        </div>
      </Autocomplete>
    </div>
  );
};

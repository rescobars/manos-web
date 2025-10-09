'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { config } from '@/lib/config';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface GoogleAutocompleteProps {
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

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export const GoogleAutocomplete: React.FC<GoogleAutocompleteProps> = ({
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
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Google Maps (simplified - no need for JavaScript API)
  useEffect(() => {
    if (config.google.mapsApiKey) {
      setIsGoogleMapsLoaded(true);
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    if (inputValue.length > 2 && isGoogleMapsLoaded) {
      setIsLoading(true);
      
      // Use our local API endpoint to avoid CORS issues
      const searchPlaces = async () => {
        try {
          const url = `/api/google-places/autocomplete?input=${encodeURIComponent(inputValue)}`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.status === 'OK' && data.predictions) {
            const formattedPredictions = data.predictions.map((prediction: any) => ({
              place_id: prediction.place_id,
              description: prediction.description,
              structured_formatting: prediction.structured_formatting
            }));
            
            setPredictions(formattedPredictions);
            setShowPredictions(true);
          } else {
            setPredictions([]);
            setShowPredictions(false);
          }
        } catch (error) {
          setPredictions([]);
          setShowPredictions(false);
        } finally {
          setIsLoading(false);
        }
      };
      
      searchPlaces();
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  }, [onChange, isGoogleMapsLoaded]);

  // Handle prediction selection
  const handlePredictionSelect = useCallback(async (prediction: any) => {
    try {
      // Use our local API endpoint to get place details
      const response = await fetch(
        `/api/google-places/details?place_id=${prediction.place_id}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        const place = data.result;
        const location: Location = {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          address: place.formatted_address || prediction.description,
        };
        
        onLocationSelect(location);
        onChange(location.address);
        setShowPredictions(false);
      } else {
        // Fallback: use the prediction description as address
        const location: Location = {
          lat: 14.6349, // Default to Guatemala City
          lng: -90.5069,
          address: prediction.description,
        };
        
        onLocationSelect(location);
        onChange(location.address);
        setShowPredictions(false);
      }
    } catch (error) {
      // Fallback: use the prediction description as address
      const location: Location = {
        lat: 14.6349, // Default to Guatemala City
        lng: -90.5069,
        address: prediction.description,
      };
      
      onLocationSelect(location);
      onChange(location.address);
      setShowPredictions(false);
    }
  }, [onLocationSelect, onChange]);

  // Handle click outside to close predictions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPredictions && inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showPredictions]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowPredictions(false);
    }
  }, []);

  // Show fallback if no API key
  if (!config.google.mapsApiKey) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
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
      <div className="relative w-full">
        <input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
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

      {/* Predictions dropdown */}
      {showPredictions && predictions.length > 0 && (
        <div
          className="absolute z-[9999] w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto"
          style={{ 
            borderColor: colors.border,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            zIndex: 9999
          }}
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id || index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePredictionSelect(prediction);
              }}
              className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors duration-150"
              style={{ 
                borderColor: colors.border,
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.background2;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: colors.buttonPrimary1 }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {prediction.structured_formatting?.main_text || prediction.description}
                  </p>
                  {prediction.structured_formatting?.secondary_text && (
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

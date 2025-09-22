'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Package } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { BaseMap } from '@/components/map/leaflet/base/BaseMap';
import L from 'leaflet';
import { createOrderIcon } from '@/lib/leaflet/utils';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

export default function PublicOrderPage() {
  const searchParams = useSearchParams();
  const orgUuid = searchParams.get('org_uuid');
  const { colors } = useDynamicTheme();

  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);

  const [pickup, setPickup] = useState<Location | null>(null);
  const [delivery, setDelivery] = useState<Location | null>(null);
  const [active, setActive] = useState<'pickup' | 'delivery'>('pickup');
  const [step, setStep] = useState<'selectA' | 'selectB' | 'done'>('selectA');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const center: [number, number] = [14.6349, -90.5069];

  const placeMarker = (type: 'pickup' | 'delivery', loc: Location) => {
    if (!mapRef.current) return;
    const icon = createOrderIcon(type === 'pickup' ? 'A' : 'B', type === 'pickup' ? colors.info : colors.success, true);
    if (type === 'pickup') {
      setPickup(loc);
      if (pickupMarkerRef.current) pickupMarkerRef.current.setLatLng([loc.lat, loc.lng]).setIcon(icon);
      else pickupMarkerRef.current = L.marker([loc.lat, loc.lng], { icon }).addTo(mapRef.current);
    } else {
      setDelivery(loc);
      if (deliveryMarkerRef.current) deliveryMarkerRef.current.setLatLng([loc.lat, loc.lng]).setIcon(icon);
      else deliveryMarkerRef.current = L.marker([loc.lat, loc.lng], { icon }).addTo(mapRef.current);
    }
    mapRef.current.setView([loc.lat, loc.lng], 14);
    drawRoute();

    // Flujo tipo Google Maps: al seleccionar A, pasar a B automáticamente
    if (type === 'pickup') {
      setActive('delivery');
      setStep('selectB');
    } else if (pickup && delivery) {
      setStep('done');
    }
  };

  const drawRoute = () => {
    if (!mapRef.current) return;
    if (routeRef.current) {
      routeRef.current.remove();
      routeRef.current = null;
    }
    if (pickup && delivery) {
      routeRef.current = L.polyline([[pickup.lat, pickup.lng], [delivery.lat, delivery.lng]], { color: colors.info, weight: 3 }).addTo(mapRef.current);
    }
  };

  const computeDistanceKm = (): number | null => {
    if (!pickup || !delivery) return null;
    const a = L.latLng(pickup.lat, pickup.lng);
    const b = L.latLng(delivery.lat, delivery.lng);
    return a.distanceTo(b) / 1000; // km
  };

  const searchMapbox = async (q: string) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=GT&limit=5`;
    const res = await fetch(url);
    const data = await res.json();
    return data.features || [];
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const results = await searchMapbox(searchQuery);
      setSearchResults(results);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectResult = (type: 'pickup' | 'delivery', feature: any) => {
    const [lng, lat] = feature.center;
    placeMarker(type, { lat, lng, address: feature.place_name });
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    placeMarker(active, { lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
  };

  useEffect(() => {
    // Mantener markers sincronizados siempre
    const map = mapRef.current;
    if (!map) return;
    // Pickup
    if (pickup) {
      const iconA = createOrderIcon('A', colors.info, true);
      if (pickupMarkerRef.current) pickupMarkerRef.current.setLatLng([pickup.lat, pickup.lng]).setIcon(iconA);
      else pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], { icon: iconA }).addTo(map);
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
    // Delivery
    if (delivery) {
      const iconB = createOrderIcon('B', colors.success, true);
      if (deliveryMarkerRef.current) deliveryMarkerRef.current.setLatLng([delivery.lat, delivery.lng]).setIcon(iconB);
      else deliveryMarkerRef.current = L.marker([delivery.lat, delivery.lng], { icon: iconB }).addTo(map);
    } else if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.remove();
      deliveryMarkerRef.current = null;
    }
    drawRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup, delivery, colors.info, colors.success]);

  return (
    <div className="min-h-screen theme-bg-1" style={{ backgroundColor: colors.background1 }}>
      <div className="px-4 py-4 max-w-5xl mx-auto">
        {/* Header simple */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold theme-text-primary" style={{ color: colors.textPrimary }}>
            Crear pedido {orgUuid ? '' : '(sin organización)'}
          </h1>
        </div>

        {/* Mapa con controles */}
        <div className="relative rounded-lg border theme-border overflow-hidden" style={{ borderColor: colors.border }}>
          {/* Controles flotantes (un solo buscador dependiente del paso) */}
          <div className="absolute z-[1000] top-3 left-1/2 -translate-x-1/2 w-[95%] md:w-[85%]">
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  placeholder={active === 'pickup' ? 'Buscar Origen (A)...' : 'Buscar Destino (B)...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={searchLoading} className="px-3 theme-btn-primary" style={{ backgroundColor: colors.buttonPrimary1, color: colors.buttonText }}>
                  {searchLoading ? '...' : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="absolute mt-1 w-full rounded-lg shadow-lg theme-bg-3 border theme-border max-h-56 overflow-auto" style={{ backgroundColor: colors.background3, borderColor: colors.border }}>
                  {searchResults.map((f, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectResult(active, f)}
                      className="w-full text-left px-3 py-2 border-b last:border-b-0 hover:opacity-80"
                      style={{ borderColor: colors.divider, color: colors.textPrimary }}
                    >
                      {f.place_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-[420px]">
            <BaseMap
              center={center}
              zoom={13}
              onMapReady={(map) => {
                mapRef.current = map;
                map.on('click', handleMapClick);
              }}
            >
              {null}
            </BaseMap>
            {/* Indicadores de paso y distancia */}
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
              <div className="rounded-full px-3 py-1 text-xs shadow theme-bg-3 border theme-border" style={{ backgroundColor: colors.background3, color: colors.textSecondary, borderColor: colors.border }}>
                {step === 'selectA' && 'Selecciona el Origen (A) en el mapa o búscalo arriba'}
                {step === 'selectB' && 'Ahora selecciona el Destino (B)'}
                {step === 'done' && 'Origen y destino definidos'}
              </div>
              {computeDistanceKm() !== null && (
                <div className="rounded-full px-3 py-1 text-xs shadow theme-bg-3 border theme-border" style={{ backgroundColor: colors.background3, color: colors.textPrimary, borderColor: colors.border }}>
                  Distancia (línea recta): {computeDistanceKm()?.toFixed(2)} km
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulario básico */}
        <div className="mt-4 theme-bg-2 border theme-border rounded-lg p-4" style={{ backgroundColor: colors.background2, borderColor: colors.border }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: colors.textSecondary }}>Nombre *</label>
              <Input placeholder="Tu nombre" className="w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: colors.textSecondary }}>Teléfono *</label>
              <Input placeholder="Tu teléfono" className="w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1" style={{ color: colors.textSecondary }}>Descripción (opcional)</label>
              <Input placeholder="¿Qué contiene el pedido?" className="w-full" />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              className="px-6 py-2 theme-btn-primary"
              style={{ backgroundColor: colors.buttonPrimary1, color: colors.buttonText }}
              disabled={!pickup || !delivery}
            >
              <Package className="w-4 h-4 mr-2" /> Crear pedido
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

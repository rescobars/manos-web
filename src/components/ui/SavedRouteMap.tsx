'use client';

import React, { useEffect, useRef } from 'react';
import { SavedRoute } from '@/types';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

interface SavedRouteMapProps {
  route: SavedRoute;
  onClose: () => void;
}

export default function SavedRouteMap({ route, onClose }: SavedRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { colors } = useDynamicTheme();

  useEffect(() => {
    if (!mapRef.current) return;

    // Importar Leaflet dinámicamente
    import('leaflet').then((L) => {
      // Fix para iconos de Leaflet en Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Crear mapa
      const map = L.map(mapRef.current!).setView([14.6349, -90.5069], 10);

      // Agregar capa de tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Agregar marcadores para las órdenes
      if (route.orders && route.orders.length > 0) {
        route.orders.forEach((order, index) => {
          if (order.delivery_lat && order.delivery_lng) {
            const marker = L.marker([order.delivery_lat, order.delivery_lng])
              .addTo(map);
            
            marker.bindPopup(`
              <div style="text-align: center;">
                <div style="width: 12px; height: 12px; background-color: ${colors.buttonPrimary1}; border-radius: 50%; margin: 0 auto 8px;"></div>
                <p style="font-weight: 600; margin: 0;">Pedido ${index + 1}</p>
                <p style="font-size: 12px; color: #666; margin: 4px 0 0;">${order.order_number || 'Sin número'}</p>
                <p style="font-size: 12px; color: #666; margin: 0;">${order.delivery_address || 'Sin dirección'}</p>
              </div>
            `);
          }
        });

        // Ajustar vista para mostrar todos los marcadores
        const group = L.featureGroup();
        route.orders.forEach(order => {
          if (order.delivery_lat && order.delivery_lng) {
            group.addLayer(L.marker([order.delivery_lat, order.delivery_lng]));
          }
        });
        if (group.getLayers().length > 0) {
          map.fitBounds(group.getBounds().pad(0.1));
        }
      }

      // Cleanup
      return () => {
        map.remove();
      };
    });
  }, [route, colors]);

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />
    </div>
  );
}

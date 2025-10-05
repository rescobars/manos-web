'use client';

import React from 'react';
import { SimpleMap } from '@/components/ui/leaflet';

export default function TestMapPage() {
  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Test de Mapa Leaflet</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Mapa Simple</h2>
          <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
            <SimpleMap 
              center={[14.6349, -90.5069]} 
              zoom={13}
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Mapa con Marcador</h2>
          <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
            <SimpleMap 
              center={[14.6349, -90.5069]} 
              zoom={15}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Copy, ExternalLink, MapPin } from 'lucide-react';
import { Button } from './Button';

interface PublicOrderDualUrlProps {
  orgUuid: string;
  onCopyUrl?: (url: string) => void;
  showLabels?: boolean;
  compact?: boolean;
}

export function PublicOrderDualUrl({ 
  orgUuid, 
  onCopyUrl,
  showLabels = true,
  compact = false
}: PublicOrderDualUrlProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const publicOrderDualUrl = `${baseUrl}/public/order-dual?org_uuid=${orgUuid}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicOrderDualUrl);
      onCopyUrl?.(publicOrderDualUrl);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs theme-text-muted">Pedidos Dual:</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-6 px-2"
        >
          <Copy className="w-3 h-3 mr-1" />
          Copiar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showLabels && (
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2 theme-text-muted" />
          <span className="text-sm theme-text-secondary">URL de Pedidos Públicos (Mapa Dual):</span>
        </div>
      )}
      
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs theme-text-muted">Crear Pedido:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-6 px-2"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copiar
          </Button>
        </div>
        <div className="p-2 theme-bg-2 rounded text-xs theme-text-secondary font-mono break-all">
          {publicOrderDualUrl}
        </div>
      </div>
    </div>
  );
}

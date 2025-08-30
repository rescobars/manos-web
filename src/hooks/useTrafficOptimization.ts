import { useState, useCallback } from 'react';

interface UseTrafficOptimizationProps {
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    deliveryLocation: {
      lat: number;
      lng: number;
      address: string;
      id: string;
    };
    description?: string;
    totalAmount: number;
    createdAt: string;
  }>;
}

export function useTrafficOptimization({ pickupLocation, orders }: UseTrafficOptimizationProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const optimizeWithTraffic = useCallback(async () => {
    if (orders.length < 2) {
      setError('Se requieren al menos 2 pedidos para optimizar');
      return null;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      // Crear solicitud para tu FastAPI con TomTom
      const tomTomRequest = {
        pickup_location: {
          lat: pickupLocation.lat,
          lng: pickupLocation.lng,
          address: pickupLocation.address
        },
        orders: orders.map(order => ({
          id: order.id,
          order_number: order.orderNumber,
          delivery_location: {
            lat: order.deliveryLocation.lat,
            lng: order.deliveryLocation.lng,
            address: order.deliveryLocation.address
          },
          description: order.description,
          total_amount: order.totalAmount
        }))
      };

      // Llamar a tu API con TomTom
      const response = await fetch('/api/route-optimization-trafic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tomTomRequest)
      });

      const result = await response.json();
      
      if (result.success) {
        setOptimizationResult(result.data);
        return result.data;
      } else {
        setError(result.error || 'Error al optimizar la ruta con TomTom');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de conexión';
      setError(errorMessage);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, [pickupLocation, orders]);

  const clearResult = useCallback(() => {
    setOptimizationResult(null);
    setError(null);
  }, []);

  const getOptimizationStatus = useCallback(() => {
    if (!optimizationResult) return 'idle';
    if ('routes' in optimizationResult || 'optimized_route' in optimizationResult) return 'complete';
    return optimizationResult.status || 'processing';
  }, [optimizationResult]);

  return {
    isOptimizing,
    optimizationResult,
    error,
    optimizeWithTraffic,
    clearResult,
    getOptimizationStatus
  };
}

'use client';

import React, { useState } from 'react';
import { Order, OrderStatus, RoutePoint, RouteDetails } from '@/types';
import { BaseModal } from './BaseModal';
import { Package, MapPin, DollarSign, Clock, Calendar, Navigation, User, Mail, Phone, FileText, CheckCircle, Route, Loader2, Zap, Sparkles } from 'lucide-react';
import { ordersApiService } from '@/lib/api/orders';
import { OrderMap } from '@/components/ui/OrderMap';

interface OrderDetailProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderUpdated?: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

interface RouteData {
  distance: number;
  estimated_time: number;
  route_points: RoutePoint[];
  total_points: number;
  processing_time: number;
}

// Precio por kilómetro
const PRICE_PER_KM = 10.00;

export function OrderDetail({ isOpen, onClose, order, onOrderUpdated, onSuccess, onError }: OrderDetailProps) {
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [pricePerKm, setPricePerKm] = useState<string>(PRICE_PER_KM.toString());

  // Resetear el total_amount cuando se abre el modal y calcular ruta automáticamente
  React.useEffect(() => {
    if (isOpen && order) {
      setTotalAmount(order.total_amount ? order.total_amount.toString() : '');
      setPricePerKm(PRICE_PER_KM.toString());
      setShowDetailedInfo(false);
      
      // Verificar si ya existe una ruta guardada en el pedido
      if (order.route_points && order.route_details) {
        // Usar la ruta guardada
        setRouteData({
          distance: order.route_details.distance,
          estimated_time: order.route_details.estimated_time,
          route_points: order.route_points,
          total_points: order.route_details.total_points,
          processing_time: order.route_details.processing_time
        });
        setShowRouteDetails(true);
        setIsCalculatingRoute(false);
      } else {
        // Resetear datos de ruta y calcular nueva
        setRouteData(null);
        setShowRouteDetails(false);
        setIsCalculatingRoute(false);
        
        // Calcular ruta automáticamente al abrir el modal
        calculateRoute();
      }
    }
  }, [isOpen, order]);

  // Calcular el monto total incluyendo costo por distancia
  const calculateTotalAmount = () => {
    const baseAmount = parseFloat(totalAmount) || 0;
    const kmPrice = parseFloat(pricePerKm) || 0;
    const distance = routeData?.distance || 0;
    const distanceCost = distance * kmPrice;
    return baseAmount + distanceCost;
  };

  // Obtener el costo por distancia
  const getDistanceCost = () => {
    const kmPrice = parseFloat(pricePerKm) || 0;
    const distance = routeData?.distance || 0;
    return distance * kmPrice;
  };

  const calculateRoute = async () => {
    if (!order) return;

    setIsCalculatingRoute(true);
    try {
      const response = await fetch('/api/route-optimization-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup: {
            lat: order.pickup_lat || 0,
            lng: order.pickup_lng || 0,
            name: 'Punto de Recogida'
          },
          delivery: {
            lat: order.delivery_lat || 0,
            lng: order.delivery_lng || 0,
            name: 'Punto de Entrega'
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        setRouteData(result);
        setShowRouteDetails(true);
        
        // Actualizar el pedido con la información de la ruta
        try {
          await ordersApiService.updateOrder(order.uuid, {
            route_points: result.route_points,
            route_details: {
              distance: result.distance,
              estimated_time: result.estimated_time,
              total_points: result.total_points,
              processing_time: result.processing_time
            }
          });
        } catch (updateError) {
          console.error('Error updating order with route data:', updateError);
          // No mostrar error al usuario ya que la ruta se calculó correctamente
        }
        
      } else {
        onError?.(result.error || 'Error al calcular la ruta');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      onError?.('Error al calcular la ruta');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!order) return;
    
    const baseAmount = parseFloat(totalAmount);
    if (isNaN(baseAmount) || baseAmount < 0) {
      onError?.('Por favor ingresa un monto base válido');
      return;
    }

    const kmPrice = parseFloat(pricePerKm);
    if (isNaN(kmPrice) || kmPrice < 0) {
      onError?.('Por favor ingresa un precio por km válido');
      return;
    }

    const finalAmount = calculateTotalAmount();

    setIsAccepting(true);
    try {
      const response = await ordersApiService.updateOrder(order.uuid, {
        status: 'PENDING',
        total_amount: finalAmount
      });
      
      if (response.success) {
        // Primero actualizar la lista de pedidos
        onOrderUpdated?.();
        // Mostrar el toast de éxito
        onSuccess?.('Pedido aceptado exitosamente');
        // Cerrar el modal
        onClose();
      } else {
        onError?.(response.error || 'Error al aceptar el pedido');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      onError?.('Error al aceptar el pedido');
    } finally {
      setIsAccepting(false);
    }
  };

  if (!order) return null;

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          text: 'Pendiente'
        };
      case 'ASSIGNED':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          text: 'En Camino'
        };
      case 'COMPLETED':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          text: 'Entregado'
        };
      case 'CANCELLED':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          text: 'Cancelado'
        };
      case 'REQUESTED':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          text: 'Solicitado'
        };
      default:
        return {
          color: 'theme-bg-1 theme-text-primary theme-border',
          text: status
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);

  // Extraer detalles de la estructura anidada
  const getOrderDetails = () => {
    if (order.details && typeof order.details === 'object') {
      // Si es la nueva estructura anidada
      if ('client_details' in order.details) {
        return {
          client: order.details.client_details || {},
          order: order.details.order_details || {},
          recipient: order.details.recipient_details || {}
        };
      }
      // Si es la estructura plana anterior
      return {
        client: {
          name: order.details.customer_name || order.details.name,
          email: order.details.email,
          phone: order.details.phone
        },
        order: {
          description: order.details.special_instructions,
          special_instructions: order.details.special_instructions
        },
        recipient: {
          name: order.details.recipient_name,
          email: order.details.recipient_email,
          phone: order.details.recipient_phone
        }
      };
    }
    return {
      client: {},
      order: {},
      recipient: {}
    };
  };

  const orderDetails = getOrderDetails();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCoordinates = (lat?: number | string, lng?: number | string) => {
    if (lat && lng) {
      const latNum = typeof lat === 'number' ? lat : parseFloat(lat);
      const lngNum = typeof lng === 'number' ? lng : parseFloat(lng);
      
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        return `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`;
      }
    }
    return 'No especificadas';
  };

  const validateCoordinate = (coord?: number | string): number | undefined => {
    if (coord === undefined || coord === null || coord === '') {
      return undefined;
    }
    
    const numCoord = typeof coord === 'number' ? coord : parseFloat(coord);
    return isNaN(numCoord) ? undefined : numCoord;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Pedido"
      icon={<Package className="w-5 h-5 theme-text-secondary" />}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Header del pedido - Compacto */}
        <div className="relative overflow-hidden theme-bg-2 rounded-xl border theme-border shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          
          <div className="relative p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border-2 shadow-sm ${statusConfig.color}`}>
                  <div className="w-2 h-2 rounded-full bg-current"></div>
                  {statusConfig.text}
                </span>
                <span className="text-sm font-mono theme-text-muted theme-bg-3 px-3 py-1.5 rounded-lg border theme-border font-medium">
                  #{order.order_number}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold theme-text-primary">
                    Q{typeof order.total_amount === 'number' ? order.total_amount.toFixed(2) : '0.00'}
                  </div>
                  <div className="text-xs theme-text-muted">Monto total</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold theme-text-primary">
                    {formatDate(order.created_at).split(',')[0]}
                  </div>
                  <div className="text-xs theme-text-muted">Fecha</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa con marcadores de origen y destino - PRIMERO */}
        <div className="group relative overflow-hidden theme-bg-3 border theme-border rounded-xl shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="relative p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl theme-bg-1 text-white shadow-lg theme-btn-primary">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg theme-text-primary">Ruta del Pedido</h3>
                <p className="text-sm theme-text-muted">
                  {isCalculatingRoute 
                    ? 'Calculando ruta optimizada...' 
                    : order?.route_points && order?.route_details 
                      ? 'Ruta guardada - Visualiza los puntos de recogida y entrega'
                      : 'Visualiza los puntos de recogida y entrega'
                  }
                </p>
              </div>
              {isCalculatingRoute && (
                <div className="ml-auto">
                  <Loader2 className="w-5 h-5 animate-spin theme-text-primary" />
                </div>
              )}
            </div>
            
            <div className="h-64 rounded-lg overflow-hidden border theme-border relative">
              {isCalculatingRoute && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3 shadow-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Calculando ruta...</span>
                  </div>
                </div>
              )}
              <OrderMap
                pickupLocation={{
                  lat: order.pickup_lat || 0,
                  lng: order.pickup_lng || 0,
                  address: order.pickup_address
                }}
                deliveryLocation={{
                  lat: order.delivery_lat || 0,
                  lng: order.delivery_lng || 0,
                  address: order.delivery_address
                }}
                routePoints={routeData?.route_points}
              />
            </div>
          </div>
        </div>

        {/* Detalles de la ruta calculada - Si está disponible */}
        {showRouteDetails && routeData && (
          <div className="group relative overflow-hidden theme-bg-3 border theme-border rounded-xl shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="relative p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                  <Route className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg theme-text-primary">Información de la Ruta</h3>
                  <p className="text-sm theme-text-muted">Datos de navegación calculados</p>
                </div>
              </div>

              {/* Banner informativo */}
              <div className="mb-4 p-3 theme-bg-2 border theme-border rounded-lg" style={{ backgroundColor: 'var(--theme-background-2)', borderColor: 'var(--theme-border)' }}>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium theme-text-primary" style={{ color: 'var(--theme-text-primary)' }}>
                      {order?.route_points && order?.route_details ? (
                        <>
                          <span className="font-semibold">Ruta guardada previamente</span> • 
                          Esta ruta fue calculada y guardada anteriormente
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">Este es solo un cálculo individual</span> • 
                          En el <span className="font-semibold theme-text-secondary" style={{ color: 'var(--theme-text-secondary)' }}>optimizador de rutas</span> puedes crear rutas completas con tráfico y múltiples pedidos
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Distancia total */}
                <div className="p-3 theme-bg-2 rounded-lg border theme-border text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold theme-text-muted uppercase tracking-wide">Distancia</span>
                  </div>
                  <p className="text-xl font-bold theme-text-primary">{routeData.distance.toFixed(2)} km</p>
                </div>
                
                {/* Tiempo estimado */}
                <div className="p-3 theme-bg-2 rounded-lg border theme-border text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold theme-text-muted uppercase tracking-wide">Tiempo</span>
                  </div>
                  <p className="text-xl font-bold theme-text-primary">{routeData.estimated_time.toFixed(1)} min</p>
                </div>
                
                {/* Puntos de ruta */}
                <div className="p-3 theme-bg-2 rounded-lg border theme-border text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-semibold theme-text-muted uppercase tracking-wide">Puntos</span>
                  </div>
                  <p className="text-xl font-bold theme-text-primary">{routeData.total_points}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campo para total_amount si el pedido está en estado REQUESTED - Compacto */}
        {order.status === 'REQUESTED' && (
          <div className="group relative overflow-hidden theme-bg-3 border theme-border rounded-xl shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="relative p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl text-white shadow-lg theme-btn-primary">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg theme-text-primary">Aceptar Pedido</h3>
                  <p className="text-sm theme-text-muted">Establece el monto base y precio por km</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Monto base */}
                <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                  <label className="block text-sm font-semibold theme-text-muted uppercase tracking-wide mb-2">
                    Monto Base (Q)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg theme-bg-1 opacity-10" style={{ backgroundColor: 'var(--button-primary-1)' }}>
                      <DollarSign className="w-4 h-4 theme-btn-primary" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 px-3 py-2 theme-bg-1 theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-lg font-semibold focus:ring-theme-btn-primary"
                    />
                  </div>
                </div>

                {/* Precio por km */}
                <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                  <label className="block text-sm font-semibold theme-text-muted uppercase tracking-wide mb-2">
                    Precio por Kilómetro (Q)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg theme-bg-1 opacity-10" style={{ backgroundColor: 'var(--button-primary-1)' }}>
                      <Navigation className="w-4 h-4 theme-btn-primary" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricePerKm}
                      onChange={(e) => setPricePerKm(e.target.value)}
                      placeholder={PRICE_PER_KM.toString()}
                      className="flex-1 px-3 py-2 theme-bg-1 theme-text-primary border theme-border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-lg font-semibold focus:ring-theme-btn-primary"
                    />
                  </div>
                </div>

                {/* Desglose de costos */}
                {routeData && (
                  <div className="p-3 theme-bg-2 rounded-lg border-2 border-dashed theme-border">
                    <h4 className="text-sm font-semibold theme-text-primary mb-3">Desglose de Costos</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm theme-text-muted">Monto base:</span>
                        <span className="text-sm font-semibold theme-text-primary">Q{(parseFloat(totalAmount) || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm theme-text-muted">
                          Distancia ({routeData.distance.toFixed(2)} km × Q{parseFloat(pricePerKm).toFixed(2)}):
                        </span>
                        <span className="text-sm font-semibold theme-text-primary">Q{getDistanceCost().toFixed(2)}</span>
                      </div>
                      <div className="border-t theme-border pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-bold theme-text-primary">Total:</span>
                          <span className="text-lg font-bold theme-text-primary">Q{calculateTotalAmount().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 theme-bg-1 hover:theme-bg-2 theme-text-primary rounded-lg border theme-border shadow-sm hover:shadow-md transition-all duration-200 font-semibold text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAcceptOrder}
                    disabled={isAccepting || !totalAmount || !pricePerKm}
                    className="px-6 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed theme-btn-primary disabled:theme-bg-3 disabled:theme-text-muted text-sm"
                  >
                    {isAccepting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Aceptando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Aceptar Pedido
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón para ver más detalles */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowDetailedInfo(!showDetailedInfo)}
            className="flex items-center gap-2 px-4 py-2 theme-bg-2 hover:theme-bg-3 theme-text-primary rounded-lg border theme-border shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
          >
            <FileText className="w-4 h-4" />
            {showDetailedInfo ? 'Ver menos detalles' : 'Ver más detalles'}
          </button>
        </div>

        {/* Detalles del Cliente, Encargo y Destinatario - Colapsable */}
        {showDetailedInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Información del Cliente */}
            <div className="group relative overflow-hidden theme-bg-3 border theme-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg theme-text-primary">Cliente</h3>
                    <p className="text-sm theme-text-muted">Información de contacto</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {orderDetails.client.name && (
                    <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                      <label className="block text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2">Nombre completo</label>
                      <p className="theme-text-primary font-medium text-sm">{orderDetails.client.name}</p>
                    </div>
                  )}
                  
                  {orderDetails.client.email && (
                    <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                      <label className="block text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2">Correo electrónico</label>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                          <Mail className="w-4 h-4" />
                        </div>
                        <p className="theme-text-primary text-sm font-medium">{orderDetails.client.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {orderDetails.client.phone && (
                    <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                      <label className="block text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2">Teléfono</label>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-green-100 text-green-600">
                          <Phone className="w-4 h-4" />
                        </div>
                        <p className="theme-text-primary text-sm font-medium">{orderDetails.client.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detalles del Encargo */}
            <div className="group relative overflow-hidden theme-bg-3 border theme-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg theme-text-primary">Encargo</h3>
                    <p className="text-sm theme-text-muted">Detalles del servicio</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {orderDetails.order.description && (
                    <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                      <label className="block text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2">Descripción</label>
                      <p className="theme-text-primary text-sm leading-relaxed">{orderDetails.order.description}</p>
                    </div>
                  )}
                  
                  {orderDetails.order.special_instructions && (
                    <div className="p-3 theme-bg-2 rounded-lg border-2 border-dashed theme-border">
                      <label className="block text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2">Instrucciones Especiales</label>
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <p className="theme-text-secondary text-sm leading-relaxed italic">
                          "{orderDetails.order.special_instructions}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información del Destinatario */}
            <div className="group relative overflow-hidden theme-bg-3 border theme-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg theme-text-primary">Destinatario</h3>
                    <p className="text-sm theme-text-muted">Quien recibe el encargo</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {orderDetails.recipient.name && (
                    <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                      <label className="block text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2">Nombre completo</label>
                      <p className="theme-text-primary font-medium text-sm">{orderDetails.recipient.name}</p>
                    </div>
                  )}
                  
                  {orderDetails.recipient.email && (
                    <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                      <label className="block text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2">Correo electrónico</label>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                          <Mail className="w-4 h-4" />
                        </div>
                        <p className="theme-text-primary text-sm font-medium">{orderDetails.recipient.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {orderDetails.recipient.phone && (
                    <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                      <label className="block text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2">Teléfono</label>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-green-100 text-green-600">
                          <Phone className="w-4 h-4" />
                        </div>
                        <p className="theme-text-primary text-sm font-medium">{orderDetails.recipient.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información de ubicaciones - También colapsable */}
        {showDetailedInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Punto de recogida */}
            <div className="group relative overflow-hidden theme-bg-3 border theme-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg theme-text-primary">Punto de Recogida</h3>
                    <p className="text-sm theme-text-muted">Origen del encargo</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                    <label className="block text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2">Dirección completa</label>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <p className="theme-text-primary font-medium leading-relaxed text-sm">{order.pickup_address}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                    <label className="block text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2">Coordenadas GPS</label>
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-gray-100 text-gray-600">
                        <Navigation className="w-3 h-3" />
                      </div>
                      <p className="text-xs font-mono theme-text-secondary font-medium">
                        {formatCoordinates(order.pickup_lat, order.pickup_lng)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Punto de entrega */}
            <div className="group relative overflow-hidden theme-bg-3 border theme-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg theme-text-primary">Punto de Entrega</h3>
                    <p className="text-sm theme-text-muted">Destino del encargo</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                    <label className="block text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2">Dirección completa</label>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-green-100 text-green-600 mt-0.5">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <p className="theme-text-primary font-medium leading-relaxed text-sm">{order.delivery_address}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                    <label className="block text-xs font-semibold theme-text-muted uppercase tracking-wide mb-2">Coordenadas GPS</label>
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-gray-100 text-gray-600">
                        <Navigation className="w-3 h-3" />
                      </div>
                      <p className="text-xs font-mono theme-text-secondary font-medium">
                        {formatCoordinates(order.delivery_lat, order.delivery_lng)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información del sistema - También colapsable */}
        {showDetailedInfo && (
          <div className="group relative overflow-hidden theme-bg-3 border theme-border rounded-xl shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="relative p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg theme-text-primary">Información del Sistema</h3>
                  <p className="text-sm theme-text-muted">Timestamps y metadatos</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold theme-text-muted uppercase tracking-wide">Fecha de Creación</label>
                    </div>
                  </div>
                  <p className="theme-text-primary font-medium text-sm">{formatDate(order.created_at)}</p>
                </div>
                
                <div className="p-3 theme-bg-2 rounded-lg border theme-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 rounded-lg bg-green-100 text-green-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold theme-text-muted uppercase tracking-wide">Última Actualización</label>
                    </div>
                  </div>
                  <p className="theme-text-primary font-medium text-sm">{formatDate(order.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón de cerrar - solo mostrar si no es un pedido REQUESTED */}
        {order.status !== 'REQUESTED' && (
          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="group relative px-6 py-2 theme-bg-1 hover:theme-bg-2 theme-text-primary rounded-lg border theme-border shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
            >
              <span className="relative z-10">Cerrar</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"></div>
            </button>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
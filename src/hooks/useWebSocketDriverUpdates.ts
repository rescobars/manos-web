import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { wsService, DriverTransmissionData, RouteDriverUpdateData, OrganizationDriverUpdateData } from '@/lib/websocket';
import { DriverPosition } from './useDriverPositions';
import { RouteDriverPosition } from './useRouteDriverPositions';

type UnifiedDriverPosition = DriverPosition | RouteDriverPosition;

interface UseWebSocketDriverUpdatesProps {
  driverPositions: UnifiedDriverPosition[];
  setDriverPositions: React.Dispatch<React.SetStateAction<UnifiedDriverPosition[]>>;
  selectedRouteIds: string[];
  isInitialLoadComplete: boolean;
}

export function useWebSocketDriverUpdates({
  driverPositions,
  setDriverPositions,
  selectedRouteIds,
  isInitialLoadComplete
}: UseWebSocketDriverUpdatesProps) {
  console.log('🎯 HOOK - useWebSocketDriverUpdates ejecutándose');
  const { user: currentUser, currentOrganization } = useAuth();
  const isAuthenticated = useRef(false);

  // Resetear WebSocket al montar el componente
  useEffect(() => {
    // Solo desconectar si ya está conectado
    if (wsService.getConnectionStatus()) {
      wsService.disconnect();
    }
    isAuthenticated.current = false;
  }, []);

  // Conectar y autenticar con WebSocket solo después de que el mapa se centre
  useEffect(() => {
    if (!isInitialLoadComplete) {
      return;
    }

    if (currentUser?.uuid && currentOrganization?.uuid && !isAuthenticated.current) {
      // Solo conectar si no está ya conectado
      if (!wsService.getConnectionStatus()) {
        wsService.connect();
      }
      wsService.authenticate(currentUser.uuid, currentOrganization.uuid);
      isAuthenticated.current = true;
    }
  }, [currentUser?.uuid, currentOrganization?.uuid, isInitialLoadComplete]);

  // Manejar actualizaciones de drivers de organización
  const handleOrganizationDriverUpdate = useCallback((data: any) => {
    console.log('🔄 PROCESANDO - Actualización de driver de organización:', data);
    // La estructura real es data.data.data según el mensaje recibido
    const updateData = data.data?.data || data.data;
    console.log('🔍 EXTRACCIÓN - DriverId de organización extraído:', updateData?.driverId);
    
    if (!updateData || !updateData.driverId || !updateData.location) {
      console.log('⚠️ DATOS INVÁLIDOS - Actualización de organización sin datos válidos');
      return;
    }
    
    setDriverPositions((prevPositions: UnifiedDriverPosition[]) => {
      const updatedPositions = [...prevPositions];
      const existingIndex = updatedPositions.findIndex(
        driver => driver.driverId === updateData.driverId
      );

      const updatedDriver: DriverPosition = {
        driverId: updateData.driverId,
        driverName: updateData.driverName,
        driverUuid: updateData.driverId, // Usar driverId como driverUuid
        location: {
          latitude: updateData.location.latitude,
          longitude: updateData.location.longitude,
          accuracy: updateData.location.accuracy,
          speed: updateData.location.speed,
          heading: updateData.location.heading
        },
        status: updateData.status,
        timestamp: updateData.timestamp,
        vehicleId: updateData.vehicleId,
        signalStrength: updateData.signalStrength,
        batteryLevel: updateData.batteryLevel,
        networkType: updateData.networkType,
        routeId: '',
        routeName: '',
        organizationId: updateData.organizationId,
        organizationName: '', // Se puede llenar desde el contexto
        metadata: {
          appVersion: '',
          deviceInfo: '',
          networkType: updateData.networkType
        }
      };

      if (existingIndex >= 0) {
        console.log('✏️ ACTUALIZANDO - Driver de organización existente:', updateData.driverId);
        updatedPositions[existingIndex] = updatedDriver;
      } else {
        console.log('➕ AGREGANDO - Nuevo driver de organización:', updateData.driverId);
        updatedPositions.push(updatedDriver);
      }

      console.log('📊 ESTADO ACTUALIZADO - Total drivers:', updatedPositions.length);
      return updatedPositions;
    });
  }, [setDriverPositions]);

  // Manejar actualizaciones de drivers de ruta
  const handleRouteDriverUpdate = useCallback((data: any) => {
    console.log('🔄 PROCESANDO - Actualización de driver de ruta:', data);
    // La estructura real es data.data.data según el mensaje recibido
    const updateData = data.data?.data || data.data;
    console.log('🔍 EXTRACCIÓN - DriverId de ruta extraído:', updateData?.driverId);
    
    if (!updateData || !updateData.driverId || !updateData.location) {
      console.log('⚠️ DATOS INVÁLIDOS - Actualización de ruta sin datos válidos');
      return;
    }
    
    // Solo procesar si la ruta está seleccionada
    if (!selectedRouteIds.includes(updateData.routeId)) {
      console.log('⏭️ OMITIENDO - Ruta no seleccionada:', updateData.routeId);
      return;
    }

    setDriverPositions((prevPositions: UnifiedDriverPosition[]) => {
      const updatedPositions = [...prevPositions];
      const existingIndex = updatedPositions.findIndex(
        driver => driver.driverId === updateData.driverId
      );

      const updatedDriver: RouteDriverPosition = {
        driverId: updateData.driverId,
        driverName: updateData.driverName,
        location: {
          latitude: updateData.location.latitude,
          longitude: updateData.location.longitude,
          accuracy: updateData.location.accuracy,
          speed: updateData.location.speed,
          heading: updateData.location.heading
        },
        status: updateData.status,
        timestamp: updateData.timestamp,
        routeId: updateData.routeId,
        routeName: updateData.routeName,
        organizationId: '', // Se puede llenar desde el contexto
        organizationName: '' // Se puede llenar desde el contexto
      };

      if (existingIndex >= 0) {
        console.log('✏️ ACTUALIZANDO - Driver de ruta existente:', updateData.driverId, 'en ruta:', updateData.routeId);
        updatedPositions[existingIndex] = updatedDriver;
      } else {
        console.log('➕ AGREGANDO - Nuevo driver de ruta:', updateData.driverId, 'en ruta:', updateData.routeId);
        updatedPositions.push(updatedDriver);
      }

      console.log('📊 ESTADO ACTUALIZADO - Total drivers:', updatedPositions.length);
      return updatedPositions;
    });
  }, [setDriverPositions, selectedRouteIds]);

  // Manejar transmisiones de drivers
  const handleDriverTransmission = useCallback((data: any) => {
    console.log('🔄 PROCESANDO - Transmisión de driver:', data);
    // El driverId está en data.data.data.driverId según el mensaje recibido
    const transmissionData = data.data?.data || data.data;
    console.log('🔍 EXTRACCIÓN - DriverId extraído:', transmissionData?.driverId);
    console.log('🔍 EXTRACCIÓN - Ubicación extraída:', transmissionData?.location);
    console.log('🔍 EXTRACCIÓN - Estado extraído:', transmissionData?.status);
    
    if (!transmissionData || !transmissionData.driverId || !transmissionData.location) {
      console.log('⚠️ DATOS INVÁLIDOS - Transmisión sin datos válidos');
      return;
    }
    
    setDriverPositions((prevPositions: UnifiedDriverPosition[]) => {
      const updatedPositions = [...prevPositions];
      const existingIndex = updatedPositions.findIndex(
        driver => driver.driverId === transmissionData.driverId
      );

      if (existingIndex >= 0) {
        console.log('✏️ ACTUALIZANDO - Transmisión de driver existente:', transmissionData.driverId);
        // Actualizar driver existente
        const existingDriver = updatedPositions[existingIndex];
        updatedPositions[existingIndex] = {
          ...existingDriver,
          location: {
            latitude: transmissionData.location.latitude,
            longitude: transmissionData.location.longitude,
            accuracy: transmissionData.location.accuracy,
            speed: transmissionData.location.speed,
            heading: transmissionData.location.heading
          },
          status: transmissionData.status,
          timestamp: transmissionData.timestamp,
          signalStrength: transmissionData.signalStrength,
          batteryLevel: transmissionData.batteryLevel,
          networkType: transmissionData.metadata.networkType,
          metadata: {
            appVersion: transmissionData.metadata.appVersion,
            deviceInfo: transmissionData.metadata.deviceInfo,
            networkType: transmissionData.metadata.networkType
          }
        };
      } else {
        console.log('⚠️ OMITIENDO - Driver no encontrado para transmisión:', transmissionData.driverId);
      }

      console.log('📊 ESTADO ACTUALIZADO - Total drivers:', updatedPositions.length);
      return updatedPositions;
    });
  }, [setDriverPositions]);

  // Suscribirse a eventos de WebSocket solo después de la carga inicial
  useEffect(() => {
    if (!isInitialLoadComplete) {
      console.log('⏳ ESPERANDO - Carga inicial no completada, no suscribiéndose a WebSocket');
      return;
    }

    console.log('🔌 SUSCRIBIÉNDOSE - A eventos de WebSocket (carga inicial completada)');
    wsService.on('organization_driver_update', handleOrganizationDriverUpdate);
    wsService.on('route_driver_update', handleRouteDriverUpdate);
    wsService.on('driver_transmission', handleDriverTransmission);

    return () => {
      console.log('🔌 DESUSCRIBIÉNDOSE - De eventos de WebSocket');
      wsService.off('organization_driver_update', handleOrganizationDriverUpdate);
      wsService.off('route_driver_update', handleRouteDriverUpdate);
      wsService.off('driver_transmission', handleDriverTransmission);
    };
  }, [isInitialLoadComplete, handleOrganizationDriverUpdate, handleRouteDriverUpdate, handleDriverTransmission]);

  // Unirse/salir de rutas cuando cambian las rutas seleccionadas (solo después de carga inicial)
  useEffect(() => {
    if (!isInitialLoadComplete) {
      console.log('⏳ ESPERANDO - Carga inicial no completada, no uniéndose a rutas');
      return;
    }

    if (selectedRouteIds.length > 0) {
      console.log('🛣️ UNIÉNDOSE - A rutas seleccionadas:', selectedRouteIds);
      selectedRouteIds.forEach(routeId => {
        console.log('🛣️ UNIÉNDOSE - A ruta:', routeId);
        wsService.joinRoute(routeId);
      });
    } else {
      console.log('🛣️ SIN RUTAS - No hay rutas seleccionadas');
    }

    return () => {
      // No necesitamos salir de rutas específicas aquí
      // El servidor manejará la limpieza
    };
  }, [selectedRouteIds, isInitialLoadComplete]);

  // Cleanup: desconectar WebSocket cuando el componente se desmonte
  useEffect(() => {
    return () => {
      // Limpiar listeners
      wsService.off('organization_driver_update', handleOrganizationDriverUpdate);
      wsService.off('route_driver_update', handleRouteDriverUpdate);
      wsService.off('driver_transmission', handleDriverTransmission);
      // Desconectar completamente
      wsService.disconnect();
      isAuthenticated.current = false;
    };
  }, [handleOrganizationDriverUpdate, handleRouteDriverUpdate, handleDriverTransmission]);

  return {
    isConnected: wsService.getConnectionStatus()
  };
}

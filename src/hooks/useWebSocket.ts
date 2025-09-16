'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

interface DriverTransmission {
  driverId: string;
  location: {
    lat: number;
    lng: number;
  };
  status: string;
  timestamp: string;
  routeId?: string;
  organizationId: string;
}

interface RouteDriverUpdate {
  routeId: string;
  driverId: string;
  status: string;
  location: {
    lat: number;
    lng: number;
  };
  estimatedArrival?: string;
}

interface OrganizationDriverUpdate {
  organizationId: string;
  driverId: string;
  status: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface DriverStatusUpdate {
  driverId: string;
  status: string;
  message: string;
}

interface UseWebSocketProps {
  autoConnect?: boolean;
  routeId?: string; // Agregar routeId como prop
}

export function useWebSocket({ autoConnect = true, routeId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }: UseWebSocketProps = {}) {
  const { user, currentOrganization } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Driver data states
  const [drivers, setDrivers] = useState<Map<string, DriverTransmission>>(new Map());
  const [routeUpdates, setRouteUpdates] = useState<RouteDriverUpdate[]>([]);
  const [organizationUpdates, setOrganizationUpdates] = useState<OrganizationDriverUpdate[]>([]);
  
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      setConnectionError('Ya hay una conexión activa');
      return;
    }

    // Clear any existing socket first
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    try {
      const newSocket = io('http://localhost:3000', {
        transports: ['websocket'],
        timeout: 20000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connection events
      newSocket.on('connect', () => {
        console.log('�� WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        
        // Auto authenticate if user is available
        if (user && currentOrganization) {
          authenticate();
        }
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        setIsAuthenticated(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        setConnectionError('Error de conexión al servidor');
      });

      // Authentication events
      newSocket.on('authenticated', (data) => {
        console.log('✅ Authenticated:', data);
        setIsAuthenticated(true);
        setConnectionError(null);
        
        // Auto join to the specific route after authentication
        if (routeId) {
          console.log('🚗 Auto-joining route:', routeId);
          newSocket.emit('join_route', routeId);
        }
      });

      newSocket.on('auth_error', (error) => {
        const errorMessage = error?.message || error || 'Error de autenticación';
        console.error('❌ Auth error:', errorMessage);
        setConnectionError(`Auth Error: ${errorMessage}`);
        setIsAuthenticated(false);
      });

      // Route events
      newSocket.on('joined_route', (data) => {
        console.log('🚪 Joined route:', data);
      });

      newSocket.on('left_route', (data) => {
        console.log('🚶 Left route:', data);
      });

      // Driver tracking events
      newSocket.on('driver_transmission', (data: DriverTransmission) => {
        console.log('📡 Driver transmission received:', data);
        setDrivers(prev => {
          const newMap = new Map(prev);
          newMap.set(data.driverId, data);
          return newMap;
        });
      });

      newSocket.on('route_driver_update', (data: RouteDriverUpdate) => {
        console.log('🚗 Route driver update received:', data);
        setRouteUpdates(prev => {
          const filtered = prev.filter(update => 
            update.driverId !== data.driverId || update.routeId !== data.routeId
          );
          return [...filtered, data];
        });
      });

      newSocket.on('organization_driver_update', (data: OrganizationDriverUpdate) => {
        console.log('🏢 Organization driver update received:', data);
        setOrganizationUpdates(prev => {
          const filtered = prev.filter(update => 
            update.driverId !== data.driverId
          );
          return [...filtered, data];
        });
      });

      newSocket.on('driver_status_update', (data: DriverStatusUpdate) => {
        console.log('👤 Driver status update received:', data);
        // Status update received - could be used for notifications in the future
      });

      // Error handling
      newSocket.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionError(`WebSocket Error: ${error.message || error}`);
      });

    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
      setConnectionError('Error al crear conexión');
    }
  }, [user, currentOrganization, routeId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting WebSocket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setIsAuthenticated(false);
    }
  }, []);

  const authenticate = useCallback(() => {
    if (!socketRef.current || !user || !currentOrganization) {
      setConnectionError('Faltan datos de usuario o organización para autenticar');
      return;
    }

    const authData = {
      userId: user.uuid,
      organizationId: currentOrganization.uuid
    };

    console.log('�� Authenticating with:', authData);
    socketRef.current.emit('authenticate', authData);
  }, [user, currentOrganization]);

  const joinRoute = useCallback((routeIdToJoin: string) => {
    if (!socketRef.current || !isAuthenticated) {
      console.log('❌ Cannot join route: not authenticated');
      return;
    }
    
    console.log('🚗 Joining route:', routeIdToJoin);
    socketRef.current.emit('join_route', routeIdToJoin);
  }, [isAuthenticated]);

  const leaveRoute = useCallback((routeIdToLeave: string) => {
    if (!socketRef.current || !isAuthenticated) {
      console.log('❌ Cannot leave route: not authenticated');
      return;
    }
    
    console.log('�� Leaving route:', routeIdToLeave);
    socketRef.current.emit('leave_route', routeIdToLeave);
  }, [isAuthenticated]);

  // Auto connect on mount if enabled
  useEffect(() => {
    if (autoConnect && user && currentOrganization && !socketRef.current?.connected) {
      console.log('🚀 Auto-connecting WebSocket');
      connect();
    }

    return () => {
      // Don't disconnect on every dependency change, only on unmount
    };
  }, [autoConnect, user, currentOrganization, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    isAuthenticated,
    connectionError,
    drivers: Array.from(drivers.values()),
    routeUpdates,
    organizationUpdates,
    connect,
    disconnect,
    authenticate,
    joinRoute,
    leaveRoute
  };
}
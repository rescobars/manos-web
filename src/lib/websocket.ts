import { io, Socket } from 'socket.io-client';

export interface DriverTransmissionData {
  driverId: string;
  routeId?: string;
  organizationId?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
  };
  status: 'DRIVING' | 'IDLE' | 'BREAK' | 'OFFLINE';
  timestamp: string;
  batteryLevel: number;
  signalStrength: number;
  metadata: {
    appVersion: string;
    deviceInfo: string;
    networkType: string;
  };
}

export interface RouteDriverUpdateData {
  routeId: string;
  driverId: string;
  driverName: string;
  routeName: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
  };
  status: 'DRIVING' | 'IDLE' | 'BREAK' | 'OFFLINE';
  timestamp: string;
}

export interface OrganizationDriverUpdateData {
  organizationId: string;
  driverId: string;
  driverName: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
  };
  status: 'DRIVING' | 'IDLE' | 'BREAK' | 'OFFLINE';
  timestamp: string;
  vehicleId: string;
  signalStrength: number;
  batteryLevel: number;
  networkType: string;
}

export interface DriverStatusUpdateData {
  driverId: string;
  status: 'DRIVING' | 'IDLE' | 'BREAK' | 'OFFLINE';
  timestamp: string;
}

class WebSocketService {
  private static instance: WebSocketService | null = null;
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners: Map<string, Function[]> = new Map();
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;

  private constructor() {
    console.log('🏗️ CONSTRUCTOR - Inicializando WebSocketService (singleton)');
    // No conectar automáticamente en el constructor
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      console.log('🆕 CREANDO - Nueva instancia singleton de WebSocketService');
      WebSocketService.instance = new WebSocketService();
    } else {
      console.log('♻️ REUTILIZANDO - Instancia singleton existente de WebSocketService');
    }
    return WebSocketService.instance;
  }

  connect() {
    if (this.socket?.connected) {
      console.log('🔌 YA CONECTADO - WebSocket ya está conectado');
      return;
    }

    // Si ya hay un socket pero no está conectado, desconectarlo primero
    if (this.socket && !this.socket.connected) {
      console.log('🧹 LIMPIANDO - Socket anterior no conectado, desconectando');
      this.socket.disconnect();
      this.socket = null;
    }

    const wsUrl = 'http://localhost:3000';
    console.log('🔌 CONECTANDO - A WebSocket en:', wsUrl, `(intento ${this.connectionAttempts + 1}/${this.maxConnectionAttempts})`);
    
    this.socket = io(wsUrl, {
      transports: ['websocket'],
      autoConnect: false, // Conectar manualmente
      timeout: 5000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000
    });

    this.setupEventListeners();
    this.connectionAttempts++;
    
    // Conectar manualmente
    this.socket.connect();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ CONECTADO - Al WebSocket exitosamente');
      this.isConnected = true;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ DESCONECTADO - Del WebSocket. Razón:', reason);
      this.isConnected = false;
      this.emit('connection_status', { connected: false });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ ERROR DE CONEXIÓN - WebSocket:', error);
      this.isConnected = false;
      this.emit('connection_status', { connected: false, error: error.message });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 RECONECTADO - WebSocket después de', attemptNumber, 'intentos');
      this.isConnected = true;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ ERROR DE RECONEXIÓN - WebSocket:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ FALLO DE RECONEXIÓN - WebSocket no pudo reconectarse');
      this.isConnected = false;
      this.emit('connection_status', { connected: false });
    });

    this.socket.on('authenticated', (data) => {
      console.log('🔐 Autenticado:', data);
      this.emit('authenticated', data);
    });

    this.socket.on('auth_error', (error) => {
      console.error('❌ Error de autenticación:', error);
      this.emit('auth_error', error);
    });

    this.socket.on('joined_route', (data) => {
      this.emit('joined_route', data);
    });

    this.socket.on('left_route', (data) => {
      this.emit('left_route', data);
    });

    // Eventos de driver
    this.socket.on('driver_transmission', (data) => {
      console.log('📡 MENSAJE RECIBIDO - Transmisión de driver:', JSON.stringify(data, null, 2));
      this.emit('driver_transmission', data);
    });

    this.socket.on('route_driver_update', (data) => {
      this.emit('route_driver_update', data);
    });

    this.socket.on('organization_driver_update', (data) => {
      console.log('🏢 MENSAJE RECIBIDO - Driver actualizado en organización:', JSON.stringify(data, null, 2));
      this.emit('organization_driver_update', data);
    });

    this.socket.on('driver_status_update', (data) => {
      console.log('✅ MENSAJE RECIBIDO - Estado del driver confirmado:', JSON.stringify(data, null, 2));
      this.emit('driver_status_update', data);
    });
  }

  // Métodos para enviar eventos
  authenticate(userId: string, organizationId?: string) {
    if (this.socket?.connected) {
      this.socket.emit('authenticate', {
        userId,
        organizationId
      });
    }
  }

  joinRoute(routeId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_route', routeId);
    }
  }

  leaveRoute(routeId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_route', routeId);
    }
  }

  // Sistema de eventos interno
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  disconnect() {
    if (this.socket) {
      // Limpiar todos los event listeners
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionAttempts = 0;
      this.listeners.clear();
    }
  }

  // Método para limpiar completamente la instancia singleton
  static destroy() {
    if (WebSocketService.instance) {
      console.log('🗑️ DESTRUYENDO - Instancia singleton de WebSocketService');
      WebSocketService.instance.disconnect();
      WebSocketService.instance = null;
    }
  }

  // Método para resetear la instancia singleton
  static reset() {
    if (WebSocketService.instance) {
      console.log('🔄 RESETEANDO - Instancia singleton de WebSocketService');
      WebSocketService.instance.disconnect();
      WebSocketService.instance = null;
    }
  }
}

// Exportar la instancia singleton
export const wsService = WebSocketService.getInstance();

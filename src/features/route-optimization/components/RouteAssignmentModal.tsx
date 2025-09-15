'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SavedRoute } from '@/types';
import { XCircle, UserPlus, Clock, MapPin, Package } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useDrivers } from '@/hooks/useDrivers';

interface RouteAssignmentModalProps {
  route: SavedRoute;
  onClose: () => void;
  onRouteAssigned: () => void;
  onSuccess?: (title: string, message?: string, duration?: number) => void;
  onError?: (title: string, message?: string, duration?: number) => void;
}

export function RouteAssignmentModal({ route, onClose, onRouteAssigned, onSuccess, onError }: RouteAssignmentModalProps) {
  const { currentOrganization, accessToken } = useAuth();
  const { success: fallbackSuccess, error: fallbackError } = useToast();
  
  // Usar las funciones pasadas desde el padre si están disponibles, sino usar las locales
  const success = onSuccess || fallbackSuccess;
  const showError = onError || fallbackError;
  
  
  // Estados del modal
  const [selectedPilot, setSelectedPilot] = useState<string>('');
  const [pilotNotes, setPilotNotes] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // Hook para drivers
  const { drivers, isLoading: driversLoading, error: driversError, fetchDrivers } = useDrivers();

  // Cargar drivers al abrir el modal
  useEffect(() => {
    if (currentOrganization) {
      fetchDrivers(currentOrganization.uuid);
    }
  }, [currentOrganization, fetchDrivers]);

  // Función para asignar ruta
  const handleAssignRoute = async () => {
    if (!selectedPilot) {
      showError('Selecciona un piloto', 'Debes seleccionar un piloto para asignar la ruta.', 3000);
      return;
    }

    if (!currentOrganization) {
      showError('Error de organización', 'No se encontró la organización actual.', 3000);
      return;
    }

    // Encontrar el driver seleccionado
    const selectedDriver = drivers.find(driver => driver.user_uuid === selectedPilot);
    if (!selectedDriver) {
      showError('Error de conductor', 'No se encontró la información del conductor seleccionado.', 3000);
      return;
    }

    const driverName = selectedDriver.name;
    setIsAssigning(true);

    try {
      // Calcular tiempos por defecto si no están establecidos
      const now = new Date();
      
      // Si hay valores de startTime/endTime del input datetime-local, convertirlos a ISO
      let processedStartTime: string;
      let processedEndTime: string;
      
      if (startTime) {
        // datetime-local da formato "YYYY-MM-DDTHH:mm", lo convertimos a ISO
        processedStartTime = new Date(startTime).toISOString();
      } else {
        processedStartTime = new Date(now.getTime() + 30 * 60000).toISOString(); // 30 min desde ahora
      }
      
      if (endTime) {
        processedEndTime = new Date(endTime).toISOString();
      } else {
        processedEndTime = new Date(now.getTime() + 2 * 60 * 60000).toISOString(); // 2 horas desde ahora
      }
      

      const assignmentData = {
        start_time: processedStartTime,
        end_time: processedEndTime,
        driver_notes: pilotNotes || `Ruta asignada el ${new Date().toLocaleString()}`,
        driver_instructions: {
          priority: "medium",
          special_handling: false,
          contact_customer: true,
          delivery_window: "08:00-18:00",
          special_requirements: [],
          special_instructions: pilotNotes || '',
          contact_info: selectedDriver.phone || 'No disponible'
        }
      };


      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'organization-id': currentOrganization.uuid,
      };
      
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      

      const response = await fetch(`/api/route-drivers/assign/${route.uuid}/${selectedDriver.organization_membership_uuid}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(assignmentData)
      });

      const result = await response.json();

      if (result.success) {
        success(
          '¡Ruta asignada exitosamente!',
          `La ruta "${route.route_name}" ha sido asignada a ${driverName}.`,
          4000
        );
        
        // Cerrar modal y refrescar datos
        onRouteAssigned();
        onClose();
      } else {
        showError(
          'Error al asignar la ruta',
          result.error || 'No se pudo asignar la ruta al conductor.',
          6000
        );
      }
    } catch (error) {
      console.error('Error assigning route:', error);
      showError(
        'Error inesperado',
        'Ocurrió un error inesperado al asignar la ruta. Por favor, inténtalo de nuevo.',
        6000
      );
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         onClick={(e) => {
           if (e.target === e.currentTarget) onClose();
         }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Asignar Ruta</h3>
              <p className="text-sm text-gray-600 mt-1">{route.route_name}</p>
            </div>
            <button
              onClick={onClose}
              disabled={isAssigning}
              className={`p-2 rounded-lg transition-colors ${
                isAssigning 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Información de la ruta */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Información de la Ruta</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Pedidos:</span>
                  <span className="ml-2 font-medium">{route.orders.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Origen:</span>
                  <span className="ml-2 font-medium">{route.origin_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Retraso:</span>
                  <span className="ml-2 font-medium">{Math.round(route.traffic_delay / 60)} min</span>
                </div>
                <div>
                  <span className="text-gray-600">Prioridad:</span>
                  <span className="ml-2 font-medium">{route.priority}</span>
                </div>
              </div>
            </div>

            {/* Selector de piloto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Piloto
              </label>
              {driversLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-gray-600">Cargando conductores...</span>
                </div>
              ) : driversError ? (
                <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50 text-red-700">
                  Error al cargar conductores: {driversError}
                </div>
              ) : drivers.length === 0 ? (
                <div className="w-full px-4 py-3 border border-yellow-300 rounded-lg bg-yellow-50 text-yellow-700">
                  No hay conductores disponibles en esta organización
                </div>
              ) : (
                <select
                  value={selectedPilot}
                  onChange={(e) => setSelectedPilot(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Selecciona un piloto...</option>
                  {drivers.map((driver) => (
                    <option key={driver.user_uuid} value={driver.user_uuid}>
                      {driver.name} - {driver.status === 'ACTIVE' ? 'Disponible' : 'Inactivo'}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {/* Hora de inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de inicio
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
            
            {/* Hora de fin estimada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de fin estimada
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
            
            {/* Notas adicionales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas adicionales (opcional)
              </label>
              <textarea
                value={pilotNotes}
                onChange={(e) => setPilotNotes(e.target.value)}
                placeholder="Instrucciones especiales para el piloto..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none bg-white"
              />
            </div>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isAssigning}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isAssigning
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleAssignRoute}
              disabled={!selectedPilot || driversLoading || drivers.length === 0 || isAssigning}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedPilot && !driversLoading && drivers.length > 0 && !isAssigning
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAssigning && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {driversLoading ? 'Cargando conductores...' : isAssigning ? 'Asignando...' : 'Asignar Ruta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SavedRoute } from '@/types';
import { XCircle, UserPlus, Clock, MapPin, Package } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useDrivers } from '@/hooks/useDrivers';
import { FormTemplate, FieldConfig, FormState } from '@/components/ui/Form';

interface RouteAssignmentModalNewProps {
  route: SavedRoute;
  onClose: () => void;
  onRouteAssigned: () => void;
}

export function RouteAssignmentModalNew({ route, onClose, onRouteAssigned }: RouteAssignmentModalNewProps) {
  const { currentOrganization } = useAuth();
  const { success, error: showError } = useToast();
  const { drivers, isLoading: driversLoading, error: driversError, fetchDrivers } = useDrivers();

  // Cargar drivers al abrir el modal
  React.useEffect(() => {
    if (currentOrganization) {
      fetchDrivers(currentOrganization.uuid);
    }
  }, [currentOrganization, fetchDrivers]);

  // Configuración de campos del formulario
  const formFields: FieldConfig[] = [
    {
      name: 'selectedPilot',
      label: 'Seleccionar Piloto',
      type: 'select',
      placeholder: 'Selecciona un piloto...',
      validation: { 
        required: true 
      },
      options: drivers.map(driver => ({
        value: driver.user_uuid,
        label: `${driver.name} - ${driver.status === 'ACTIVE' ? 'Disponible' : 'Inactivo'}`
      })),
      disabled: driversLoading || drivers.length === 0,
      description: driversError ? `Error: ${driversError}` : driversLoading ? 'Cargando conductores...' : `${drivers.length} conductores disponibles`
    },
    {
      name: 'startTime',
      label: 'Hora de inicio',
      type: 'datetime-local',
      validation: { 
        required: false 
      },
      description: 'Si no se especifica, se asignará 30 minutos desde ahora'
    },
    {
      name: 'endTime',
      label: 'Hora de fin estimada',
      type: 'datetime-local',
      validation: { 
        required: false 
      },
      description: 'Si no se especifica, se calculará automáticamente'
    },
    {
      name: 'pilotNotes',
      label: 'Notas adicionales',
      type: 'textarea',
      placeholder: 'Instrucciones especiales para el piloto...',
      validation: { 
        maxLength: 500 
      },
      description: 'Máximo 500 caracteres'
    }
  ];

  // Función para asignar ruta
  const handleAssignRoute = async (formData: FormState) => {
    if (!currentOrganization) {
      showError('Error de organización', 'No se encontró la organización actual.', 3000);
      return;
    }

    // Encontrar el driver seleccionado
    const selectedDriver = drivers.find(driver => driver.user_uuid === formData.selectedPilot);
    if (!selectedDriver) {
      showError('Error de conductor', 'No se encontró la información del conductor seleccionado.', 3000);
      return;
    }

    const driverName = selectedDriver.name;

    try {
      // Calcular tiempos por defecto si no están establecidos
      const now = new Date();
      const defaultStartTime = formData.startTime || new Date(now.getTime() + 30 * 60000).toISOString(); // 30 min desde ahora
      const defaultEndTime = formData.endTime || new Date(now.getTime() + 2 * 60 * 60000).toISOString(); // 2 horas desde ahora

      const assignmentData = {
        start_time: defaultStartTime,
        end_time: defaultEndTime,
        driver_notes: formData.pilotNotes || `Ruta asignada el ${new Date().toLocaleString()}`,
        driver_instructions: {
          special_instructions: formData.pilotNotes || '',
          contact_info: selectedDriver.phone || 'No disponible'
        }
      };

      const response = await fetch(`/api/route-drivers/assign/${route.uuid}/${selectedDriver.membership_uuid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'organization-id': currentOrganization.uuid,
        },
        body: JSON.stringify(assignmentData)
      });

      const result = await response.json();

      if (result.success) {
        success(
          '¡Ruta asignada exitosamente!',
          `La ruta ha sido asignada a ${driverName}.`,
          5000
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
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Asignar Ruta</h3>
              <p className="text-sm text-gray-600 mt-1">{route.route_name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Información de la ruta */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
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

          {/* Formulario usando FormTemplate */}
          <FormTemplate
            fields={formFields}
            onSubmit={handleAssignRoute}
            onCancel={onClose}
            submitText="Asignar Ruta"
            cancelText="Cancelar"
            loading={driversLoading}
            disabled={drivers.length === 0}
            validateOnChange={true}
            className="border-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}

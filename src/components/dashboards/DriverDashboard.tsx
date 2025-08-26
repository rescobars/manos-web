'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock,
  Navigation,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function DriverDashboard() {
  const { currentOrganization } = useAuth();

  if (!currentOrganization) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró la organización</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header específico para conductores */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
            <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Dashboard de Conductor - {currentOrganization.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Gestiona tus entregas y rutas diarias
            </p>
          </div>
        </div>
      </div>

      {/* Stats específicos para conductores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          icon={Package}
          title="Entregas Hoy"
          value="8"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />

        <StatCard
          icon={CheckCircle}
          title="Completadas"
          value="6"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />

        <StatCard
          icon={Clock}
          title="En Progreso"
          value="2"
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />

        <StatCard
          icon={MapPin}
          title="Rutas Activas"
          value="3"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Entregas pendientes */}
      <Card>
        <CardHeader>
          <CardTitle>Entregas Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((delivery) => (
              <div key={delivery} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-sm">Pedido #{1000 + delivery}</h4>
                    <p className="text-xs text-gray-600">Cliente: Cliente {delivery}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Dirección</p>
                  <p className="text-sm font-medium">Av. Principal 123</p>
                </div>
                <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700">
                  Ver Ruta
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Acciones rápidas para conductores */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <Navigation className="w-6 h-6 text-blue-600 mb-2 mx-auto" />
              <h4 className="font-medium text-sm">Iniciar Ruta</h4>
              <p className="text-xs text-gray-600">Comenzar entregas</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <Clock className="w-6 h-6 text-green-600 mb-2 mx-auto" />
              <h4 className="font-medium text-sm">Reportar Entrega</h4>
              <p className="text-xs text-gray-600">Marcar como completada</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <AlertCircle className="w-6 h-6 text-orange-600 mb-2 mx-auto" />
              <h4 className="font-medium text-sm">Reportar Problema</h4>
              <p className="text-xs text-gray-600">Incidente en entrega</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Calendario de entregas */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Mañana 9:00 AM</span>
              </div>
              <span className="text-sm font-medium">Pedido #1003 - Centro Comercial</span>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Mañana 11:30 AM</span>
              </div>
              <span className="text-sm font-medium">Pedido #1004 - Oficina Norte</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

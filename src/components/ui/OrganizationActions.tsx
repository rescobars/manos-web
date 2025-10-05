'use client';

import React, { useState } from 'react';
import { Organization } from '@/types';
import { Button } from './Button';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff, 
  Pause,
  Eye,
  Settings
} from 'lucide-react';

interface OrganizationActionsProps {
  organization: Organization;
  onEdit: (org: Organization) => void;
  onDelete: (org: Organization) => void;
  onStatusChange: (org: Organization, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => void;
  onView: (org: Organization) => void;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canChangeStatus: boolean;
    canView: boolean;
  };
}

export function OrganizationActions({
  organization,
  onEdit,
  onDelete,
  onStatusChange,
  onView,
  permissions
}: OrganizationActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = (newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    onStatusChange(organization, newStatus);
    setIsOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Power className="w-4 h-4" />;
      case 'INACTIVE':
        return <PowerOff className="w-4 h-4" />;
      case 'SUSPENDED':
        return <Pause className="w-4 h-4" />;
      default:
        return <Power className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activar';
      case 'INACTIVE':
        return 'Desactivar';
      case 'SUSPENDED':
        return 'Suspender';
      default:
        return 'Cambiar estado';
    }
  };

  const getNextStatus = (currentStatus: string): 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' => {
    switch (currentStatus) {
      case 'ACTIVE':
        return 'SUSPENDED';
      case 'SUSPENDED':
        return 'INACTIVE';
      case 'INACTIVE':
        return 'ACTIVE';
      default:
        return 'ACTIVE';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0"
      >
        <MoreVertical className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          {/* Overlay para cerrar el menú */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menú de acciones */}
          <div className="absolute right-0 top-full mt-1 w-48 theme-bg-3 border theme-border rounded-md shadow-lg z-20">
            <div className="py-1">
              {/* Ver organización */}
              {permissions.canView && (
                <button
                  onClick={() => {
                    onView(organization);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm theme-text-primary hover:theme-bg-1"
                >
                  <Eye className="w-4 h-4 mr-3" />
                  Ver detalles
                </button>
              )}

              {/* Editar organización */}
              {permissions.canEdit && (
                <button
                  onClick={() => {
                    onEdit(organization);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm theme-text-primary hover:theme-bg-1"
                >
                  <Edit className="w-4 h-4 mr-3" />
                  Editar
                </button>
              )}

              {/* Cambiar estado */}
              {permissions.canChangeStatus && (
                <button
                  onClick={() => handleStatusChange(getNextStatus(organization.status))}
                  className="w-full flex items-center px-4 py-2 text-sm theme-text-primary hover:theme-bg-1"
                >
                  {getStatusIcon(getNextStatus(organization.status))}
                  <span className="ml-3">
                    {getStatusLabel(getNextStatus(organization.status))}
                  </span>
                </button>
              )}

              {/* Configuración */}
              <button
                onClick={() => {
                  // TODO: Implementar configuración
                  setIsOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm theme-text-primary hover:theme-bg-1"
              >
                <Settings className="w-4 h-4 mr-3" />
                Configuración
              </button>

              {/* Separador */}
              {permissions.canDelete && (
                <div className="border-t theme-border my-1" />
              )}

              {/* Eliminar organización */}
              {permissions.canDelete && (
                <button
                  onClick={() => {
                    onDelete(organization);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

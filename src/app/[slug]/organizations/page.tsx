'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useApi';
import { Organization, OrganizationFilters } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrganizationModal } from '@/components/ui/OrganizationModal';
import { OrganizationDetail } from '@/components/ui/OrganizationDetail';
import { OrganizationActions } from '@/components/ui/OrganizationActions';
import { OrganizationFiltersComponent } from '@/components/ui/OrganizationFilters';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  Building2, 
  Plus,
  Shield,
  Crown,
  Calendar,
  Globe,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  X
} from 'lucide-react';

export default function OrganizationsPage() {
  const { 
    organizations: userOrganizations, 
    currentOrganization,
    hasPermission,
    setCurrentOrganization
  } = useAuth();

  const {
    loading,
    error,
    getOrganizations,
    createOrganization,
    updateOrganization,
    updateOrganizationStatus,
    deleteOrganization,
    clearError
  } = useOrganizations();

  // Estados locales
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filters, setFilters] = useState<OrganizationFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Permisos
  const canCreateOrganizations = hasPermission('organizations', 'create');
  const canEditOrganizations = hasPermission('organizations', 'update');
  const canDeleteOrganizations = hasPermission('organizations', 'delete');
  const canChangeStatus = hasPermission('organizations', 'suspend') || hasPermission('organizations', 'activate');
  const canViewOrganizations = hasPermission('organizations', 'read');



  // Cargar organizaciones al montar el componente
  useEffect(() => {
    loadOrganizations();
  }, [filters]);

  const loadOrganizations = async () => {
    try {
      const response = await getOrganizations(filters);
      if (response.success && response.data) {
        setOrganizations(response.data as Organization[]);
      } else {
        // Si no hay datos del API, usar las organizaciones del contexto
        setOrganizations(userOrganizations);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      // Fallback a las organizaciones del contexto
      setOrganizations(userOrganizations);
    }
  };

  const handleCreateOrganization = async (data: any) => {
    setActionLoading(true);
    try {
      const response = await createOrganization(data);
      
      if (response.success) {
        await loadOrganizations();
        setShowCreateModal(false);
      } else {
        throw new Error(response.error || response.message || 'Error al crear organización');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      // Mostrar error pero no cerrar el modal
      alert('Error al crear la organización: ' + (error as Error).message);
      // No cerrar el modal para que el usuario pueda corregir los datos
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateOrganization = async (data: any) => {
    if (!selectedOrganization) return;
    
    setActionLoading(true);
    try {
      const response = await updateOrganization(selectedOrganization.uuid, data);
      if (response.success) {
        await loadOrganizations();
        setShowEditModal(false);
        setSelectedOrganization(null);
      } else {
        throw new Error(response.error || 'Error al actualizar organización');
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      alert('Error al actualizar la organización: ' + (error as Error).message);
      // No cerrar el modal para que el usuario pueda corregir los datos
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (org: Organization, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    setActionLoading(true);
    try {
      const response = await updateOrganizationStatus(org.uuid, newStatus);
      if (response.success) {
        await loadOrganizations();
      } else {
        throw new Error(response.error || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Error al cambiar el estado: ' + (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!organizationToDelete) return;
    
    setActionLoading(true);
    try {
      const response = await deleteOrganization(organizationToDelete.uuid);
      if (response.success) {
        await loadOrganizations();
        setShowDeleteDialog(false);
        setOrganizationToDelete(null);
      } else {
        throw new Error(response.error || 'Error al eliminar organización');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Error al eliminar la organización: ' + (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (org: Organization) => {
    setSelectedOrganization(org);
    setShowEditModal(true);
  };

  const handleView = (org: Organization) => {
    setSelectedOrganization(org);
    setShowDetailModal(true);
  };

  const handleDelete = (org: Organization) => {
    setOrganizationToDelete(org);
    setShowDeleteDialog(true);
  };

  const handleFiltersChange = (newFilters: OrganizationFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleSwitchOrganization = (org: Organization) => {
    setCurrentOrganization(org);
  };

  if (loading && organizations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Cargando organizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizaciones</h1>
          <p className="text-gray-600">
            Gestiona todas tus organizaciones
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadOrganizations}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          {/* Temporalmente habilitado para testing */}
          <Button onClick={() => {
            console.log('Abriendo modal de crear organización');
            setShowCreateModal(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Organización
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <OrganizationFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Grid de organizaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <Card 
            key={org.uuid} 
            className={`hover:shadow-md transition-shadow ${
              currentOrganization?.uuid === org.uuid ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {org.logo_url ? (
                    <img 
                      src={org.logo_url} 
                      alt={`${org.name} logo`}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <p className="text-sm text-gray-600">{org.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {currentOrganization?.uuid === org.uuid && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                  
                  <OrganizationActions
                    organization={org}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    onView={handleView}
                    permissions={{
                      canEdit: true, // Temporalmente habilitado
                      canDelete: true, // Temporalmente habilitado
                      canChangeStatus: true, // Temporalmente habilitado
                      canView: true // Temporalmente habilitado
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Roles del usuario */}
                <div className="flex flex-wrap gap-1">
                  {org.roles && org.roles.length > 0 ? (
                    org.roles.map((role) => (
                      <span 
                        key={role.uuid}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          role.name === 'PLATFORM_ADMIN' 
                            ? 'bg-purple-100 text-purple-800' 
                            : role.name === 'OWNER'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {role.name === 'PLATFORM_ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                        {role.name === 'OWNER' && <Crown className="w-3 h-3 mr-1" />}
                        {role.name}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Sin roles asignados
                    </span>
                  )}
                </div>

                {/* Información de la organización */}
                <div className="space-y-2 text-sm text-gray-600">
                  {org.domain && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      <span>{org.domain}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {org.plan_type} - Expira {new Date(org.subscription_expires_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Miembro desde {new Date(org.member_since).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Estado */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    org.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : org.status === 'SUSPENDED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {org.status}
                  </span>
                  
                  {org.is_owner && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Crown className="w-3 h-3 mr-1" />
                      Propietario
                    </span>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(org)}
                    className="flex-1"
                  >
                    Ver
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(org)}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(org, org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                    className="flex-1"
                  >
                    {org.status === 'ACTIVE' ? 'Pausar' : 'Activar'}
                  </Button>
                  
                  {currentOrganization?.uuid !== org.uuid && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchOrganization(org)}
                      className="w-full"
                    >
                      Cambiar a esta organización
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sin organizaciones */}
      {organizations.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes organizaciones
            </h3>
            <p className="text-gray-600 mb-4">
              Aún no has sido agregado a ninguna organización.
            </p>
            {canCreateOrganizations && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Organización
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modales */}
      <OrganizationModal
        isOpen={showCreateModal}
        onClose={() => {
          console.log('Cerrando modal de crear');
          setShowCreateModal(false);
        }}
        onSubmit={handleCreateOrganization}
        loading={actionLoading}
      />

      <OrganizationModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedOrganization(null);
        }}
        organization={selectedOrganization}
        onSubmit={handleUpdateOrganization}
        loading={actionLoading}
      />

      {selectedOrganization && showDetailModal && (
        <OrganizationDetail
          organization={selectedOrganization}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrganization(null);
          }}
          onEdit={handleEdit}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setOrganizationToDelete(null);
        }}
        onConfirm={handleDeleteOrganization}
        title="Eliminar Organización"
        message={`¿Estás seguro de que quieres eliminar la organización "${organizationToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}

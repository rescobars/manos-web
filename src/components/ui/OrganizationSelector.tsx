import React, { useState } from 'react';
import { Organization } from '@/types';
import { Button } from './Button';
import { Building2, ChevronDown, Check } from 'lucide-react';

interface OrganizationSelectorProps {
  organizations: Organization[];
  currentOrganization: Organization | null;
  onOrganizationChange: (organization: Organization) => void;
  className?: string;
}

export function OrganizationSelector({ 
  organizations, 
  currentOrganization, 
  onOrganizationChange,
  className = ''
}: OrganizationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!organizations || organizations.length === 0) {
    return null;
  }

  if (organizations.length === 1) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <span className="font-medium theme-text-primary">{organizations[0].name}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 min-w-0"
      >
        <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
          <Building2 className="w-3 h-3 text-white" />
        </div>
        <span className="truncate font-medium">
          {currentOrganization?.name || 'Seleccionar organización'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 theme-bg-3 border theme-border rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {organizations.map((org) => (
              <button
                key={org.uuid}
                onClick={() => {
                  onOrganizationChange(org);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:theme-bg-2 transition-colors ${
                  currentOrganization?.uuid === org.uuid ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium theme-text-primary truncate">
                      {org.name}
                    </span>
                    {org.is_owner && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Owner
                      </span>
                    )}
                    {org.plan_type === 'PRO' && (
                      <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded">
                        PRO
                      </span>
                    )}
                  </div>
                  {org.description && (
                    <p className="text-sm theme-text-muted truncate">
                      {org.description}
                    </p>
                  )}
                </div>

                {currentOrganization?.uuid === org.uuid && (
                  <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { SavedRoute } from '@/types';
import { Route, Clock, Users, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface RouteStatsCardsProps {
  allRoutes: SavedRoute[];
  filterStatus: string;
  onFilterChange: (status: string) => void;
}

export function RouteStatsCards({ allRoutes, filterStatus, onFilterChange }: RouteStatsCardsProps) {
  return (
    <div className="p-6 border-b border-gray-200">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <button
          onClick={() => onFilterChange('all')}
          className={`bg-gray-50 border rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md ${
            filterStatus === 'all' 
              ? 'border-gray-400 ring-2 ring-gray-200 shadow-lg' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Route className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Todas</p>
              <p className="text-xl font-bold text-gray-800">
                {allRoutes.length}
              </p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => onFilterChange('PLANNED')}
          className={`bg-blue-50 border rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md ${
            filterStatus === 'PLANNED' 
              ? 'border-blue-400 ring-2 ring-blue-200 shadow-lg' 
              : 'border-blue-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Planificadas</p>
              <p className="text-xl font-bold text-blue-800">
                {allRoutes.filter(route => route.status === 'PLANNED').length}
              </p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => onFilterChange('ASSIGNED')}
          className={`bg-purple-50 border rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md ${
            filterStatus === 'ASSIGNED' 
              ? 'border-purple-400 ring-2 ring-purple-200 shadow-lg' 
              : 'border-purple-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-purple-600 font-medium">Asignadas</p>
              <p className="text-xl font-bold text-purple-800">
                {allRoutes.filter(route => route.status === 'ASSIGNED').length}
              </p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => onFilterChange('IN_PROGRESS')}
          className={`bg-green-50 border rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md ${
            filterStatus === 'IN_PROGRESS' 
              ? 'border-green-400 ring-2 ring-green-200 shadow-lg' 
              : 'border-green-200 hover:border-green-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Route className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">En Progreso</p>
              <p className="text-xl font-bold text-green-800">
                {allRoutes.filter(route => route.status === 'IN_PROGRESS').length}
              </p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => onFilterChange('COMPLETED')}
          className={`bg-emerald-50 border rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md ${
            filterStatus === 'COMPLETED' 
              ? 'border-emerald-400 ring-2 ring-emerald-200 shadow-lg' 
              : 'border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Completadas</p>
              <p className="text-xl font-bold text-emerald-800">
                {allRoutes.filter(route => route.status === 'COMPLETED').length}
              </p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => onFilterChange('PAUSED')}
          className={`bg-orange-50 border rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md ${
            filterStatus === 'PAUSED' 
              ? 'border-orange-400 ring-2 ring-orange-200 shadow-lg' 
              : 'border-orange-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-orange-600 font-medium">Pausadas</p>
              <p className="text-xl font-bold text-orange-800">
                {allRoutes.filter(route => route.status === 'PAUSED').length}
              </p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => onFilterChange('CANCELLED')}
          className={`bg-red-50 border rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md ${
            filterStatus === 'CANCELLED' 
              ? 'border-red-400 ring-2 ring-red-200 shadow-lg' 
              : 'border-red-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-red-600 font-medium">Canceladas</p>
              <p className="text-xl font-bold text-red-800">
                {allRoutes.filter(route => route.status === 'CANCELLED').length}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

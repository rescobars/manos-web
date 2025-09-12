'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Grid, List } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  // Nuevas props para modo híbrido
  viewMode?: 'table' | 'grid';
  onViewModeChange?: (mode: 'table' | 'grid') => void;
  gridColumns?: number; // Número de columnas en grid (1, 2, 3, etc.)
  gridItemRender?: (item: T, index: number) => React.ReactNode; // Función personalizada para renderizar items en grid
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pagination,
  onPageChange,
  onSort,
  sortBy,
  sortOrder,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  className = '',
  viewMode = 'table',
  onViewModeChange,
  gridColumns = 3,
  gridItemRender
}: DataTableProps<T>) {
  const handleSort = (key: keyof T) => {
    if (!onSort || !columns.find(col => col.key === key)?.sortable) return;
    
    const newOrder = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(key, newOrder);
  };

  const getSortIcon = (key: keyof T) => {
    if (sortBy !== key) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const renderPagination = () => {
    if (!pagination) {
      return null;
    }

    const { page, totalPages, hasNext, hasPrev } = pagination;
    const pages = [];
    
    // Calcular páginas a mostrar
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-medium">
            Mostrando {((page - 1) * pagination.limit) + 1} a {Math.min(page * pagination.limit, pagination.total)} de {pagination.total} resultados
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Switch de vista */}
          {onViewModeChange && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Vista de tabla"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Vista de cuadrícula"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
          {/* Botón Primera página */}
          <button
            onClick={() => onPageChange?.(1)}
            disabled={!hasPrev}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
            title="Primera página"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          
          {/* Botón Página anterior */}
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={!hasPrev}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Separador */}
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          
          {/* Números de página */}
          <div className="flex space-x-1">
            {pages.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange?.(pageNum)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  pageNum === page
                    ? 'bg-blue-600 text-white shadow-md border border-blue-700'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          {/* Separador */}
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          
          {/* Botón Página siguiente */}
          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={!hasNext}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          {/* Botón Última página */}
          <button
            onClick={() => onPageChange?.(totalPages)}
            disabled={!hasNext}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
            </div>
            <p className="text-gray-600">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Función para renderizar el grid
  const renderGrid = () => {
    if (!gridItemRender) {
      return (
        <div className="p-6 text-center text-gray-500">
          <p>Función de renderizado de grid no proporcionada</p>
        </div>
      );
    }

    const gridCols = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
    };

    return (
      <div className={`grid ${gridCols[gridColumns as keyof typeof gridCols] || gridCols[3]} gap-4 p-6`}>
        {data.map((item, index) => (
          <div key={index}>
            {gridItemRender(item, index)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Paginación arriba */}
      {renderPagination()}
      
      {/* Contenido según el modo de vista */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    } ${column.className || ''}`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <span className="text-gray-400">
                          {getSortIcon(column.key)}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                    >
                      {column.render 
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || '')
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        renderGrid()
      )}
    </div>
  );
}

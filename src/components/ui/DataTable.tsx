'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Grid, List } from 'lucide-react';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

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
  const { colors } = useDynamicTheme();
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
      <div 
        className="flex items-center justify-between px-6 py-4 theme-bg-2 border-b theme-border"
        style={{
          backgroundColor: colors.background2,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center text-sm theme-text-secondary">
          <span className="font-medium">
            Mostrando {((page - 1) * pagination.limit) + 1} a {Math.min(page * pagination.limit, pagination.total)} de {pagination.total} resultados
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Switch de vista */}
          {onViewModeChange && (
            <div 
              className="flex rounded-lg p-1"
              style={{ backgroundColor: colors.background1 }}
            >
              <button
                onClick={() => onViewModeChange('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'shadow-sm'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: viewMode === 'table' ? colors.background3 : 'transparent',
                  color: viewMode === 'table' ? colors.buttonPrimary1 : colors.textSecondary,
                }}
                title="Vista de tabla"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'shadow-sm'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: viewMode === 'grid' ? colors.background3 : 'transparent',
                  color: viewMode === 'grid' ? colors.buttonPrimary1 : colors.textSecondary,
                }}
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
            className="p-2 hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all duration-200 border border-transparent hover:border-opacity-50"
            style={{
              color: colors.textMuted,
              borderColor: colors.border,
            }}
            title="Primera página"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          
          {/* Botón Página anterior */}
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={!hasPrev}
            className="p-2 hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all duration-200 border border-transparent hover:border-opacity-50"
            style={{
              color: colors.textMuted,
              borderColor: colors.border,
            }}
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Separador */}
          <div 
            className="w-px h-6 mx-2"
            style={{ backgroundColor: colors.border }}
          ></div>
          
          {/* Números de página */}
          <div className="flex space-x-1">
            {pages.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange?.(pageNum)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  pageNum === page
                    ? 'shadow-md'
                    : 'hover:opacity-80 hover:shadow-sm'
                }`}
                style={{
                  backgroundColor: pageNum === page ? colors.buttonPrimary1 : 'transparent',
                  color: pageNum === page ? 'white' : colors.textSecondary,
                  borderColor: pageNum === page ? colors.buttonPrimary2 : colors.border,
                }}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          {/* Separador */}
          <div 
            className="w-px h-6 mx-2"
            style={{ backgroundColor: colors.border }}
          ></div>
          
          {/* Botón Página siguiente */}
          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={!hasNext}
            className="p-2 hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all duration-200 border border-transparent hover:border-opacity-50"
            style={{
              color: colors.textMuted,
              borderColor: colors.border,
            }}
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          {/* Botón Última página */}
          <button
            onClick={() => onPageChange?.(totalPages)}
            disabled={!hasNext}
            className="p-2 hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all duration-200 border border-transparent hover:border-opacity-50"
            style={{
              color: colors.textMuted,
              borderColor: colors.border,
            }}
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
      <div 
        className="theme-bg-3 rounded-lg border theme-border overflow-hidden"
        style={{
          backgroundColor: colors.background3,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
              style={{ borderColor: colors.buttonPrimary1 }}
            ></div>
            <p className="theme-text-secondary">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div 
        className="theme-bg-3 rounded-lg border theme-border overflow-hidden"
        style={{
          backgroundColor: colors.background3,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: colors.background2 }}
            >
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: colors.border }}
              ></div>
            </div>
            <p className="theme-text-secondary">{emptyMessage}</p>
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
    <div 
      className={`theme-bg-3 rounded-lg border theme-border overflow-hidden ${className}`}
      style={{
        backgroundColor: colors.background3,
        borderColor: colors.border,
      }}
    >
      {/* Paginación arriba */}
      {renderPagination()}
      
      {/* Contenido según el modo de vista */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table 
            className="w-full table-fixed"
            style={{ borderColor: colors.tableBorder }}
          >
            <thead 
              className="theme-table-header"
              style={{ backgroundColor: colors.tableHeader }}
            >
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:opacity-80' : ''
                    } ${column.className || ''}`}
                    style={{
                      color: 'white',
                    }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {getSortIcon(column.key)}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody 
              className="theme-table-row"
              style={{ 
                backgroundColor: colors.tableRow,
                borderColor: colors.tableBorder,
              }}
            >
              {data.map((item, index) => (
                <tr 
                  key={index} 
                  className="theme-table-row hover:theme-table-row-hover"
                  style={{
                    backgroundColor: colors.tableRow,
                  }}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-6 py-4 whitespace-nowrap text-sm theme-text-primary ${column.className || ''}`}
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

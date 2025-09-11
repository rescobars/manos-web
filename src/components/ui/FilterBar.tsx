'use client';

import React from 'react';
import { Search, Filter, Grid3X3, List } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

interface FilterOption {
  value: string;
  label: string;
}

type ViewMode = 'cards' | 'table';

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterPlaceholder?: string;
  showFilter?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  showViewToggle?: boolean;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filterValue,
  onFilterChange,
  filterOptions = [],
  filterPlaceholder = 'Filtrar por...',
  showFilter = true,
  viewMode = 'cards',
  onViewModeChange,
  showViewToggle = false,
  className = ''
}: FilterBarProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-3 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-4">
          {showFilter && filterOptions.length > 0 && (
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterValue || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  onFilterChange?.(value);
                }}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[180px]"
              >
                <option value="">{filterPlaceholder}</option>
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showViewToggle && onViewModeChange && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                onClick={() => onViewModeChange('cards')}
                className={`h-8 px-3 ${viewMode === 'cards' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                onClick={() => onViewModeChange('table')}
                className={`h-8 px-3 ${viewMode === 'table' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

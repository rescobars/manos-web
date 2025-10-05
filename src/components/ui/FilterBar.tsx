'use client';

import React from 'react';
import { Search, Filter, Grid3X3, List } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

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
  const { colors } = useDynamicTheme();
  return (
    <div 
      className={`rounded-2xl shadow-sm border p-6 ${className}`}
      style={{
        backgroundColor: colors.background3,
        borderColor: colors.border
      }}
    >
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
            style={{ color: colors.textMuted }}
          />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-3 theme-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-4">
          {showFilter && filterOptions.length > 0 && (
            <div className="flex items-center gap-3">
              <Filter 
                className="w-5 h-5" 
                style={{ color: colors.textMuted }}
              />
              <select
                value={filterValue || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  onFilterChange?.(value);
                }}
                className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]"
                style={{
                  backgroundColor: colors.background3,
                  borderColor: colors.border,
                  color: colors.textPrimary
                }}
              >
                <option 
                  value=""
                  style={{
                    backgroundColor: colors.background3,
                    color: colors.textMuted
                  }}
                >
                  {filterPlaceholder}
                </option>
                {filterOptions.map((option) => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    style={{
                      backgroundColor: colors.background3,
                      color: colors.textPrimary
                    }}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showViewToggle && onViewModeChange && (
            <div 
              className="flex items-center gap-1 rounded-lg p-1"
              style={{ backgroundColor: colors.background2 }}
            >
              <Button
                size="sm"
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                onClick={() => onViewModeChange('cards')}
                className={`h-8 px-3 ${viewMode === 'cards' 
                  ? 'shadow-sm' 
                  : ''
                }`}
                style={viewMode === 'cards' ? {
                  backgroundColor: colors.background3,
                  color: colors.textPrimary
                } : {
                  color: colors.textMuted
                }}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                onClick={() => onViewModeChange('table')}
                className={`h-8 px-3 ${viewMode === 'table' 
                  ? 'shadow-sm' 
                  : ''
                }`}
                style={viewMode === 'table' ? {
                  backgroundColor: colors.background3,
                  color: colors.textPrimary
                } : {
                  color: colors.textMuted
                }}
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

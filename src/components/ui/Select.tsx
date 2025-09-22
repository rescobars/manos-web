import React from 'react';
import { clsx } from 'clsx';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: SelectOption[];
  onChange?: (value: string) => void;
}

export function Select({
  label,
  error,
  helperText,
  required = false,
  options,
  onChange,
  className,
  id,
  value,
  ...props
}: SelectProps) {
  const { colors } = useDynamicTheme();
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium theme-text-primary mb-1"
        >
          {label}{required && <span className="theme-error ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={handleChange}
        className={clsx(
          'block w-full px-3 py-2 border theme-border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm theme-bg-3 theme-text-primary',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          className
        )}
        style={{
          backgroundColor: colors.background3,
          borderColor: error ? colors.error : colors.border,
          color: colors.textPrimary,
        }}
        required={required}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm theme-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm theme-text-muted">{helperText}</p>
      )}
    </div>
  );
}

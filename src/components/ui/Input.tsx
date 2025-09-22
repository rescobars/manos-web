import React from 'react';
import { clsx } from 'clsx';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  required = false,
  className,
  id,
  ...props
}: InputProps) {
  const { colors } = useDynamicTheme();
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium theme-text-primary mb-1"
        >
          {label}{required && <span className="theme-error ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
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
      />
      {error && (
        <p className="mt-1 text-sm theme-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm theme-text-muted">{helperText}</p>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  validateOnChange?: boolean;
}

// Funciones de validación
const validatePhone = (phone: string): string | null => {
  if (!phone.trim()) {
    return 'El teléfono es requerido';
  }
  
  // Remover espacios, guiones y paréntesis
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Validar que sea un número
  if (!/^\d+$/.test(cleanPhone)) {
    return 'El teléfono debe contener solo números';
  }
  
  // Validar longitud exacta para Guatemala (8 dígitos)
  if (cleanPhone.length !== 8) {
    return 'El teléfono debe tener exactamente 8 dígitos';
  }
  
  return null;
};

const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return 'El email es requerido';
  }
  
  // Expresión regular para validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return 'Ingresa un email válido (ejemplo: correo@ejemplo.com)';
  }
  
  return null;
};

export function Input({
  label,
  error: externalError,
  helperText,
  required = false,
  validateOnChange = true,
  className,
  id,
  type = 'text',
  value,
  onChange,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const [internalError, setInternalError] = useState<string | null>(null);
  
  // Determinar qué error mostrar (externo tiene prioridad)
  const displayError = externalError || internalError;

  // Validación automática basada en el tipo
  const validateByType = (value: string): string | null => {
    if (!required && !value.trim()) {
      return null; // No validar si no es requerido y está vacío
    }

    switch (type) {
      case 'tel':
        return validatePhone(value);
      case 'email':
        return validateEmail(value);
      default:
        return null;
    }
  };

  // Manejar cambio con validación
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Llamar al onChange original
    if (onChange) {
      onChange(e);
    }

    // Validar si está habilitada la validación en tiempo real
    if (validateOnChange) {
      const validationError = validateByType(newValue);
      setInternalError(validationError);
    }
  };

  // Validar al montar si hay valor inicial
  useEffect(() => {
    if (value && validateOnChange) {
      const validationError = validateByType(value as string);
      setInternalError(validationError);
    }
  }, [value, validateOnChange, type, required]);

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
        type={type}
        value={value}
        onChange={handleChange}
        className={clsx(
          'block w-full px-3 py-2 border theme-border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm theme-bg-3 theme-text-primary',
          displayError ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500',
          className
        )}
        required={required}
        {...props}
      />
      {displayError && (
        <p className="mt-1 text-sm theme-error">{displayError}</p>
      )}
      {helperText && !displayError && (
        <p className="mt-1 text-sm theme-text-muted">{helperText}</p>
      )}
    </div>
  );
}
